/**
 * AI Podcast — 「去广告」邀请码服务 (Cloudflare Worker + D1)
 *
 * 机制(刻意做得很简单):
 *   - 发起人 Jason 用 ADMIN_KEY 签发根邀请码(issuer='root')。
 *   - 任何人拿一个未使用的邀请码 POST /redeem → 成为成员(member),立即拿到
 *       ① 一个 token(此后「去广告」身份凭证,存在浏览器 localStorage,可随同步码跨设备)
 *       ② 2 个自己的邀请码,送给朋友;朋友兑换后又各得 2 个 —— 一棵以 Jason 为根的二叉邀请树。
 *   - 邀请码一次性、不过期;一个成员终身只有 2 个(不续发,树的宽度由此受控)。
 *   - 码格式:6 位,字母表去掉 0/O/1/I(ABCDEFGHJKLMNPQRSTUVWXYZ23456789 共 32 字符),
 *     32^6 ≈ 10 亿组合,配合限流无法爆破;大小写不敏感,输入时连字符/空格忽略。
 *
 * 隐私:不存 IP、不存任何个人信息。限流键是 IP 的 SHA-256 前 16 位,KV 10 分钟自动过期。
 *
 * 接口(JSON;CORS 只放行站点来源):
 *   POST /redeem         {code}                → {ok,token,mid,codes:[..],since}
 *   GET  /me             Authorization: Bearer <token>
 *                                              → {ok,mid,since,codes:[{code,used,usedAt}],invited,inviter}
 *   POST /admin/issue    X-Admin: <ADMIN_KEY>  {n,label?} → {ok,codes:[..]}
 *   GET  /admin/stats    X-Admin: <ADMIN_KEY>  → {members,codes,used,unusedRoot,tree:[{mid,label,invitedBy,since,used}]}
 *   POST /admin/grant    X-Admin: <ADMIN_KEY>  {mid,n} → 给某成员补发 n 个码(发起人特权,日常不用)
 *
 * 建表(一次性,wrangler d1 execute aipodcast-stats --remote --file=schema.sql):见 schema.sql
 */
const ALLOW = new Set(['https://aipodcast.jasonlin.tech', 'https://aipaper.jasonlin.tech', 'http://localhost:8000', 'http://127.0.0.1:8000', 'null']);
const cors = o => ({
  'Access-Control-Allow-Origin': ALLOW.has(o) ? o : 'https://aipodcast.jasonlin.tech',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin',
  'Vary': 'Origin',
});
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_RE = /^[A-HJ-NP-Z2-9]{6}$/;
const J = (o, status = 200, h = {}) => new Response(JSON.stringify(o), { status, headers: { ...h, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

function randCode() {
  const b = crypto.getRandomValues(new Uint8Array(6));
  let s = ''; for (const x of b) s += ALPHABET[x % 32];
  return s;
}
function hex(n) { return [...crypto.getRandomValues(new Uint8Array(n))].map(x => x.toString(16).padStart(2, '0')).join(''); }
// 用户输入归一:大写、去掉非字母数字、把容易看混的 0/O、1/I/L 映射到字母表里的字符
function normCode(s) {
  s = ('' + (s || '')).toUpperCase().replace(/[^A-Z0-9]/g, '');
  s = s.replace(/0/g, 'O').replace(/[1I]/g, 'L');
  // 字母表没有 O / I / 1 / 0 / L?——有 L、没有 O/I/0/1。O→Q 太武断,直接拒绝含 O 的输入,前端会提示。
  return s;
}
async function ipKey(req) {
  const ip = req.headers.get('CF-Connecting-IP') || '';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('inv:' + ip));
  return 'inv-rl:' + [...new Uint8Array(d)].slice(0, 8).map(x => x.toString(16).padStart(2, '0')).join('');
}
// 滚动限流:10 分钟内最多 max 次(KV 最小 TTL 60s;这里存计数,过期即清零)
async function rateLimited(env, req, max) {
  try {
    const k = await ipKey(req);
    const n = +(await env.RL.get(k)) || 0;
    if (n >= max) return true;
    await env.RL.put(k, '' + (n + 1), { expirationTtl: 600 });
  } catch (_) { }
  return false;
}
async function issueCodes(env, issuer, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < 5; t++) {
      const c = randCode();
      try {
        await env.DB.prepare('INSERT INTO inv_codes(code,issuer,created_at) VALUES(?,?,?)').bind(c, issuer, Date.now()).run();
        out.push(c); break;
      } catch (_) { /* 撞码重试 */ }
    }
  }
  return out;
}
async function memberByToken(env, req) {
  const m = /^Bearer\s+([0-9a-f]{32})$/i.exec(req.headers.get('Authorization') || '');
  if (!m) return null;
  return await env.DB.prepare('SELECT mid,token,via_code,invited_by,created_at,label FROM inv_members WHERE token=?').bind(m[1].toLowerCase()).first();
}
async function codesOf(env, mid) {
  const r = await env.DB.prepare('SELECT code,used_by,used_at FROM inv_codes WHERE issuer=? ORDER BY created_at').bind(mid).all();
  return (r.results || []).map(x => ({ code: x.code, used: !!x.used_by, usedAt: x.used_at || 0 }));
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '', co = cors(origin);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: co });
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/+$/, '') || '/';
    const isAdmin = !!env.ADMIN_KEY && req.headers.get('X-Admin') === env.ADMIN_KEY;

    // ---- 成员侧(必须来自站点页面) ----
    if (p === '/redeem' && req.method === 'POST') {
      if (origin && !ALLOW.has(origin)) return J({ error: 'forbidden' }, 403, co);
      if (await rateLimited(env, req, 20)) return J({ error: 'too_many', msg: '试得太频繁了,10 分钟后再来' }, 429, co);
      let b; try { b = await req.json(); } catch { return J({ error: 'bad_json' }, 400, co); }
      const code = normCode(b.code);
      if (!CODE_RE.test(code)) return J({ error: 'bad_code', msg: '邀请码是 6 位字母数字(不含 0 / O / 1 / I)' }, 400, co);
      const row = await env.DB.prepare('SELECT code,issuer,used_by FROM inv_codes WHERE code=?').bind(code).first();
      if (!row) return J({ error: 'not_found', msg: '没有这个邀请码' }, 404, co);
      if (row.used_by) return J({ error: 'used', msg: '这个邀请码已经被用过了' }, 409, co);
      const mid = hex(8), token = hex(16), now = Date.now();
      // 原子占用:只有 used_by 仍为空才写得进去,两人同时兑换同一码只会成功一个
      const upd = await env.DB.prepare('UPDATE inv_codes SET used_by=?,used_at=? WHERE code=? AND used_by IS NULL').bind(mid, now, code).run();
      if (!upd.meta || !upd.meta.changes) return J({ error: 'used', msg: '这个邀请码刚被别人用掉了' }, 409, co);
      await env.DB.prepare('INSERT INTO inv_members(mid,token,via_code,invited_by,created_at) VALUES(?,?,?,?,?)').bind(mid, token, code, row.issuer, now).run();
      const codes = await issueCodes(env, mid, 2);
      return J({ ok: 1, token, mid, since: now, codes, inviter: row.issuer === 'root' ? 'root' : 'member' }, 200, co);
    }
    if (p === '/me' && req.method === 'GET') {
      if (origin && !ALLOW.has(origin)) return J({ error: 'forbidden' }, 403, co);
      const m = await memberByToken(env, req);
      if (!m) return J({ error: 'no_member' }, 401, co);
      const codes = await codesOf(env, m.mid);
      const inv = await env.DB.prepare('SELECT count(*) c FROM inv_members WHERE invited_by=?').bind(m.mid).first();
      return J({ ok: 1, mid: m.mid, since: m.created_at, codes, invited: (inv && inv.c) || 0, inviter: m.invited_by === 'root' ? 'root' : 'member' }, 200, co);
    }

    // ---- 发起人侧 ----
    if (p.startsWith('/admin/')) {
      if (!isAdmin) return J({ error: 'unauthorized' }, 401, co);
      if (p === '/admin/issue' && req.method === 'POST') {
        let b = {}; try { b = await req.json(); } catch { }
        const n = Math.max(1, Math.min(50, +b.n || 1));
        return J({ ok: 1, codes: await issueCodes(env, 'root', n) }, 200, co);
      }
      if (p === '/admin/grant' && req.method === 'POST') {
        let b = {}; try { b = await req.json(); } catch { }
        if (!/^[0-9a-f]{16}$/.test('' + b.mid)) return J({ error: 'bad_mid' }, 400, co);
        const n = Math.max(1, Math.min(10, +b.n || 1));
        return J({ ok: 1, codes: await issueCodes(env, b.mid, n) }, 200, co);
      }
      if (p === '/admin/stats' && req.method === 'GET') {
        const members = (await env.DB.prepare('SELECT count(*) c FROM inv_members').first()).c;
        const codes = (await env.DB.prepare('SELECT count(*) c FROM inv_codes').first()).c;
        const used = (await env.DB.prepare('SELECT count(*) c FROM inv_codes WHERE used_by IS NOT NULL').first()).c;
        const root = (await env.DB.prepare("SELECT code FROM inv_codes WHERE issuer='root' AND used_by IS NULL ORDER BY created_at").all()).results.map(x => x.code);
        const tree = (await env.DB.prepare(
          'SELECT m.mid, m.label, m.invited_by invitedBy, m.created_at since, m.via_code via, ' +
          '(SELECT count(*) FROM inv_codes c WHERE c.issuer=m.mid AND c.used_by IS NOT NULL) used ' +
          'FROM inv_members m ORDER BY m.created_at').all()).results;
        return J({ ok: 1, members, codes, used, unusedRoot: root, tree }, 200, co);
      }
      return J({ error: 'not_found' }, 404, co);
    }
    if (p === '/' || p === '/health') return J({ ok: 1, service: 'aipodcast-invite' }, 200, co);
    return J({ error: 'not_found' }, 404, co);
  }
};
