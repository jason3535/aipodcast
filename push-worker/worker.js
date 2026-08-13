/**
 * push-worker — 浏览器推送(Web Push, RFC 8030 + VAPID RFC 8292)的订阅存储与发送端。
 * aipodcast / aipaper 共用;订阅表放在与统计同一个 D1(aipodcast-stats)。
 *
 * ── 两个关键设计决定,都有原因 ──
 *
 * 1) **不带 payload 推送**。RFC 8030 允许 body 为空的推送(只做「叫醒」),浏览器 SW 收到
 *    push 事件后自己去拉 /push-latest.json 再决定弹什么。这样做:
 *      · 免掉 aes128gcm + ECDH 那套载荷加密(Worker 里手写约 80 行密码学,是最容易
 *        静默出错、又最难在本地验证的部分);
 *      · 堆积多期时天然合并成一条「N 篇新内容」,而不是轰炸 N 条;
 *      · 用户离线两天后上线,看到的是「此刻的最新」,不是两天前的快照。
 *    代价:SW 必须能访问站点(同源 fetch,失败时退化成一条泛化提醒)。
 *    订阅里的 p256dh/auth 仍然存下来 —— 将来若要改成带 payload,不必让所有人重新订阅。
 *
 * 2) **死订阅自动清理**。推送服务对已失效订阅返回 404/410,收到即从 D1 删除。
 *    不清理的话发送成功率会随时间烂掉,而且看不出是"没人订"还是"发不出去"。
 *
 * ── 已知边界(不是 bug,是现实)──
 * Chrome/Android 的推送要经 fcm.googleapis.com,**国内直连不可达**(2026-08-13 实测超时),
 * 这些浏览器连订阅都会失败。Safari(web.push.apple.com)、Firefox、Edge(WNS)实测可达。
 * 前端据此做了降级提示,不会留一个按了没反应的开关。
 *
 * 端点:
 *   POST /sub    {site, sub:{endpoint,keys:{p256dh,auth}}}  订阅(幂等 upsert)
 *   POST /unsub  {endpoint}                                  退订
 *   GET  /key                                                VAPID 公钥(调试用,前端是硬编码的)
 *   POST /send   ?token=  {site,offset?}                     发送(受 token 保护,管线调用)
 *   GET  /stat   ?token=                                     各站订阅数与健康度
 */
const SITE_ORIGIN = {
  aipodcast: 'https://aipodcast.jasonlin.tech',
  aipaper: 'https://aipaper.jasonlin.tech',
};
const ALLOW = new Set([...Object.values(SITE_ORIGIN), 'http://localhost:8000', 'http://localhost:8902', 'null']);
// 单次 /send 最多发多少个:Workers 免费版每次调用有 50 个子请求上限,留点余量。
// 订阅数超过这个值时,调用方按返回的 next 继续调 /send?offset=N(分页发完)。
const BATCH = 40;

const cors = o => ({
  'Access-Control-Allow-Origin': ALLOW.has(o) ? o : SITE_ORIGIN.aipodcast,
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Vary': 'Origin',
});
const J = (o, s, co) => new Response(JSON.stringify(o), { status: s, headers: { ...co, 'Content-Type': 'application/json' } });
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const utf8 = s => new TextEncoder().encode(s);

/** VAPID Authorization 头。aud 必须是推送端点的 origin,所以按 origin 缓存,
 *  一次 /send 里几十个订阅通常只有 1-3 个不同 origin,能省掉几十次签名。 */
async function vapidAuth(env, endpoint, cache) {
  const aud = new URL(endpoint).origin;
  if (cache.has(aud)) return cache.get(aud);
  const jwk = JSON.parse(env.VAPID_JWK);
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u(utf8(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(utf8(JSON.stringify({
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,   // 上限 24h;12h 足够且更保守
    sub: env.VAPID_SUB || SITE_ORIGIN.aipodcast,      // 推送服务的滥用联系方式,用站点 URL(RFC 8292 允许 https:)
  })));
  // Web Crypto 的 ECDSA 签名本来就是 raw r||s(64 字节),正是 JWS ES256 要的格式,无需 DER 转换
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, utf8(head + '.' + body));
  const h = `vapid t=${head}.${body}.${b64u(sig)}, k=${env.VAPID_PUBLIC}`;
  cache.set(aud, h);
  return h;
}

async function sendOne(env, endpoint, cache) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': await vapidAuth(env, endpoint, cache),
      'TTL': '86400',          // 设备离线时推送服务保留 24h
      'Urgency': 'normal',
      'Content-Length': '0',   // 无 payload 推送:显式零长度,部分服务(含 APNs)对此挑剔
    },
  });
  return res.status;
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '', co = cors(origin), url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: co });

    if (url.pathname === '/key') return J({ key: env.VAPID_PUBLIC }, 200, co);

    // ---- 订阅 ----
    if (req.method === 'POST' && url.pathname === '/sub') {
      if (origin && !ALLOW.has(origin)) return new Response('forbidden', { status: 403, headers: co });
      let b; try { b = await req.json(); } catch { return J({ error: 'bad json' }, 400, co); }
      const site = SITE_ORIGIN[b.site] ? b.site : '';
      const s = b.sub || {};
      const ep = ('' + (s.endpoint || '')).slice(0, 500);
      if (!site || !/^https:\/\//.test(ep)) return J({ error: 'bad sub' }, 400, co);
      const k = s.keys || {};
      try {
        await env.DB.prepare(
          `INSERT INTO push_subs(endpoint,site,p256dh,auth,created,last_ok,fails) VALUES(?,?,?,?,?,0,0)
           ON CONFLICT(endpoint) DO UPDATE SET site=excluded.site,p256dh=excluded.p256dh,auth=excluded.auth,fails=0`
        ).bind(ep, site, ('' + (k.p256dh || '')).slice(0, 200), ('' + (k.auth || '')).slice(0, 100), Date.now()).run();
      } catch (e) { return J({ error: '' + (e && e.message || e) }, 500, co); }
      return J({ ok: true }, 200, co);
    }

    // ---- 退订 ----
    if (req.method === 'POST' && url.pathname === '/unsub') {
      if (origin && !ALLOW.has(origin)) return new Response('forbidden', { status: 403, headers: co });
      let b; try { b = await req.json(); } catch { return J({ error: 'bad json' }, 400, co); }
      try { await env.DB.prepare('DELETE FROM push_subs WHERE endpoint=?').bind('' + (b.endpoint || '')).run(); }
      catch (e) { return J({ error: '' + (e && e.message || e) }, 500, co); }
      return J({ ok: true }, 200, co);
    }

    // ---- 订阅数(token)----
    if (req.method === 'GET' && url.pathname === '/stat') {
      if (url.searchParams.get('token') !== env.PUSH_TOKEN) return J({ error: 'unauthorized' }, 401, co);
      const r = (await env.DB.prepare(
        'SELECT site,count(*) n,sum(CASE WHEN last_ok>0 THEN 1 ELSE 0 END) alive FROM push_subs GROUP BY site'
      ).all()).results;
      return J({ sites: r }, 200, co);
    }

    // ---- 发送(token)----
    if (req.method === 'POST' && url.pathname === '/send') {
      if (url.searchParams.get('token') !== env.PUSH_TOKEN) return J({ error: 'unauthorized' }, 401, co);
      let b = {}; try { b = await req.json(); } catch { }
      const site = SITE_ORIGIN[b.site] ? b.site : '';
      if (!site) return J({ error: 'bad site' }, 400, co);
      const offset = Math.max(0, parseInt(b.offset || '0', 10) || 0);
      const subs = (await env.DB.prepare(
        'SELECT endpoint FROM push_subs WHERE site=? ORDER BY created LIMIT ? OFFSET ?'
      ).bind(site, BATCH, offset).all()).results;
      if (!subs.length) return J({ sent: 0, gone: 0, failed: 0, next: null, note: '该站暂无订阅' }, 200, co);

      const cache = new Map();
      let sent = 0, gone = 0, failed = 0; const dead = [], ok = [], errs = {};
      for (const s of subs) {
        let st;
        try { st = await sendOne(env, s.endpoint, cache); }
        catch (e) { failed++; errs['exception'] = ('' + (e && e.message || e)).slice(0, 120); continue; }
        if (st >= 200 && st < 300) { sent++; ok.push(s.endpoint); }
        else if (st === 404 || st === 410) { gone++; dead.push(s.endpoint); }   // 订阅已失效 → 删
        else { failed++; errs['http' + st] = (errs['http' + st] || 0) + 1; }
      }
      if (dead.length) {
        // D1 不支持数组绑定,逐条删;死订阅数量天然很小
        for (const ep of dead) { try { await env.DB.prepare('DELETE FROM push_subs WHERE endpoint=?').bind(ep).run(); } catch (_) { } }
      }
      // 只给**真的发成功**的那些打时间戳。早先按 site 整表更新,5 个里成功 3 个也会
      // 把 5 个都标成健康 —— /stat 的 alive 就成了假信号,排查时会被它带偏。
      for (const ep of ok) {
        try { await env.DB.prepare('UPDATE push_subs SET last_ok=?,fails=0 WHERE endpoint=?').bind(Date.now(), ep).run(); } catch (_) { }
      }
      return J({ sent, gone, failed, errs, next: subs.length === BATCH ? offset + BATCH : null }, 200, co);
    }

    return new Response('push worker', { headers: co });
  },
};
