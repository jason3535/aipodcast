/* sw.js — 二次访问加速 + 离线兜底(aipodcast / aipaper 共用同一份)。
 *
 * 背景:GitHub Pages 只发 cache-control: max-age=600。10 分钟内回访秒开,但隔天回访
 * 等于每次都是首次——app.js(gzip 230KB)+ 数据 + 头像全部重新下载。SW 把这笔消掉。
 *
 * 策略按资源分层:
 * - 导航请求(index.html / e/xx/ 分享页):network-first,断网退缓存,再退缓存的 '/'。
 *   必须 network-first —— app.js 的 ?v= 哈希只存在于 index.html 里,它不新鲜,
 *   用户就永远卡在旧版本(这是 SW 最经典的翻车点)。
 * - app.js?v=<hash>:cache-first —— URL 含内容哈希,天然不可变,命中即秒开。
 * - 其余同源 GET(data/*.json、mcp-data/ep/*.json、assets 图片):stale-while-revalidate,
 *   先回缓存、后台刷新。单集数据和头像偶尔会原地更新(修说话人、换头像),SWR 保证最终新鲜。
 * - 跨域一律不拦截:stats / tts / chat / sync 四个 worker 与 MathJax CDN 都直连。
 *   (顺带避免 opaque response 把缓存配额虚爆。)
 * - LRU:数据与图片两个桶各设上限,超了删最旧 —— iOS Safari 超配额会把整个 origin
 *   的缓存清空,不设上限等于白做。
 *
 * Kill switch:线上出问题时把 KILL 改成 true 再部署。新 SW 会清光缓存并自我注销,
 * 用户下一次访问就回到无 SW 状态,不需要用户做任何事。
 */
const KILL = false;
const V = 'v1';
const PAGES = 'pages-' + V, STATIC = 'static-' + V, DATA = 'data-' + V, IMG = 'img-' + V;
const DATA_MAX = 80;   // 单集 json 平均 ~50KB,80 个约 4MB
const IMG_MAX = 200;   // 头像/台标 ~10KB 一张

/* 推送相关常量(两站共用这份 sw.js,靠域名区分文案与上报的 site) */
const PUSH_META = 'push-meta';    // 只存一条「上次已提醒到哪个时间戳」,不参与版本清理
const PUSH_API = 'https://push.jasonlin.tech';
const VAPID_PUB = 'BKZpK04qWu3AxxSH9KatKT0882TaRH43G1JhOQ1cLkaEg_AyR8os6JcLpzNhUKvyhmlEpD6no9SHphYbd_-n2hc';
const IS_PAPER = /aipaper/.test(self.location.hostname);
const SITE_KEY = IS_PAPER ? 'aipaper' : 'aipodcast';
const SITE_NAME = IS_PAPER ? 'AI Paper' : 'AI Podcast';
const SITE_UNIT = IS_PAPER ? '篇' : '期';
const SITE_WORD = IS_PAPER ? '新内容' : '新访谈';
const NOTIFY_ICON = '/assets/notify-icon.png';
const NOTIFY_TAG = 'latest';      // 固定 tag:多次推送替换同一条,不在通知中心堆一摞

if (KILL) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', e => e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
  })()));
} else {

  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', e => e.waitUntil((async () => {
    const keep = new Set([PAGES, STATIC, DATA, IMG, PUSH_META]);   // PUSH_META 必须留,否则每次换版都把「已提醒到哪」清零 → 重复轰炸
    for (const k of await caches.keys()) if (!keep.has(k)) await caches.delete(k);
    await self.clients.claim();
  })()));

  /* ── 浏览器推送 ─────────────────────────────────────────────────────
     服务端发的是**不带 payload** 的推送(理由见 push-worker/worker.js),这里收到后
     自己拉 /push-latest.json 再决定弹什么。因此:
       · 攒了多期只弹一条「N 期新访谈」,不是轰炸 N 条;
       · 用户离线几天后上线,看到的是"此刻最新",不是发送时的旧快照。
     「上次提醒到哪」存在 Cache 里(SW 里 IndexedDB 要写的样板代码多得多)。 */
  const seenGet = async () => {
    try { const c = await caches.open(PUSH_META); const r = await c.match('/__push_seen');
          return r ? (+(await r.text()) || 0) : 0; } catch (_) { return 0; }
  };
  const seenSet = async v => {
    try { const c = await caches.open(PUSH_META); await c.put('/__push_seen', new Response(String(v))); } catch (_) { }
  };

  self.addEventListener('push', e => e.waitUntil((async () => {
    let items = [];
    try {
      const r = await fetch('/push-latest.json?_=' + Date.now(), { cache: 'no-store' });
      const d = await r.json();
      if (d && Array.isArray(d.items)) items = d.items;
    } catch (_) { }

    // 拉不到(断网/正在部署):也必须弹点什么 —— 什么都不弹的话浏览器会替你弹
    // 一条"此网站已在后台更新",那个更难看。
    if (!items.length) {
      return self.registration.showNotification(SITE_NAME, {
        body: '有' + SITE_WORD + '更新', icon: NOTIFY_ICON, badge: NOTIFY_ICON,
        tag: NOTIFY_TAG, data: { url: '/' },
      });
    }

    const seen = await seenGet();
    let fresh = items.filter(i => (+i.ts || 0) > seen);
    if (!fresh.length) fresh = items.slice(0, 1);   // 同上:宁可重复说一条最新的,也不留空推
    await seenSet(items.reduce((m, i) => Math.max(m, +i.ts || 0), 0));

    const one = fresh.length === 1;
    await self.registration.showNotification(
      one ? SITE_NAME + ' · ' + SITE_WORD : SITE_NAME + ' · ' + fresh.length + ' ' + SITE_UNIT + SITE_WORD,
      {
        body: fresh.slice(0, 3).map(i => i.t).join('\n') + (fresh.length > 3 ? '\n等 ' + fresh.length + ' ' + SITE_UNIT : ''),
        icon: NOTIFY_ICON, badge: NOTIFY_ICON, tag: NOTIFY_TAG, renotify: true,
        data: { url: one ? (fresh[0].u || '/') : '/' },
      });
  })()));

  self.addEventListener('notificationclick', e => {
    e.notification.close();
    const url = (e.notification.data && e.notification.data.url) || '/';
    e.waitUntil((async () => {
      // 已经开着本站的窗口就复用,别每次点通知都开新标签页
      const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of wins) {
        if (new URL(c.url).origin === self.location.origin) {
          await c.focus();
          try { await c.navigate(url); } catch (_) { }   // 个别浏览器拒绝 navigate,聚焦本身已达目的
          return;
        }
      }
      await self.clients.openWindow(url);
    })());
  });

  // 页面在用户刚订阅时告诉 SW「当前这些都算已读」,否则第一条推送会说"N 篇新内容"(N=全站)
  self.addEventListener('message', e => {
    const d = e.data || {};
    if (d.type === 'push-seen-init') e.waitUntil(seenSet(+d.ts || Date.now()));
  });

  /* 浏览器会主动轮换订阅(密钥过期、存储清理)。不接这个事件的话推送就静默死了,
     用户还以为自己订着。这里用同一个 VAPID 公钥重新订阅并上报新端点。 */
  self.addEventListener('pushsubscriptionchange', e => e.waitUntil((async () => {
    try {
      const raw = atob(VAPID_PUB.replace(/-/g, '+').replace(/_/g, '/'));
      const key = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) key[i] = raw.charCodeAt(i);
      const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      const old = e.oldSubscription && e.oldSubscription.endpoint;
      if (old) await fetch(PUSH_API + '/unsub', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: old }) }).catch(() => { });
      await fetch(PUSH_API + '/sub', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ site: SITE_KEY, sub: sub.toJSON() }) });
    } catch (_) { }
  })()));

  const trim = async (name, max) => {
    const c = await caches.open(name);
    const keys = await c.keys();                      // Cache API 按插入序返回,删最旧的
    for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
  };

  /* 注意:调用方必须传入"已经 clone 好的响应副本"。
     clone 必须在把原响应交给页面之前同步完成 —— put 里第一步 caches.open() 是异步的,
     等它回来时原响应体已被页面消费,再 clone 会抛 body already used,
     结果是静默存不进任何东西(首版就是这么翻的,离线测试 0 命中)。 */
  const put = async (name, req, copy, max) => {
    if (!copy || !copy.ok) return;
    const c = await caches.open(name);
    await c.put(req.url, copy);                       // 按 URL 存:导航请求的 mode 不参与匹配,统一掉
    if (max) trim(name, max);                         // 不 await,别拖慢响应
  };

  self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;  // 跨域(stats/tts/chat/sync/CDN)不碰

    // 导航:network-first
    if (req.mode === 'navigate') {
      e.respondWith((async () => {
        try {
          const res = await fetch(req);
          put(PAGES, req, res.clone());               // 同步 clone 后再异步入缓存
          return res;
        } catch (_) {
          return (await caches.match(req.url)) || (await caches.match('/')) ||
                 new Response('offline', { status: 503 });
        }
      })());
      return;
    }

    // app.js?v=hash:cache-first(哈希即不可变)
    if (url.pathname.endsWith('/app.js') && url.searchParams.has('v')) {
      e.respondWith((async () => {
        const hit = await caches.match(req.url);
        if (hit) return hit;
        const res = await fetch(req);
        put(STATIC, req, res.clone());
        return res;
      })());
      return;
    }

    // 其余同源 GET:stale-while-revalidate
    const isImg = /\.(webp|jpe?g|png|gif|svg)$/i.test(url.pathname);
    const bucket = isImg ? IMG : DATA;
    const max = isImg ? IMG_MAX : DATA_MAX;
    e.respondWith((async () => {
      const hit = await caches.match(req.url);
      const refresh = fetch(req).then(res => { put(bucket, req, res.clone(), max); return res; })
                                .catch(() => null);
      if (hit) { e.waitUntil(refresh); return hit; }
      return (await refresh) || new Response('', { status: 504 });
    })());
  });
}
