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
    const keep = new Set([PAGES, STATIC, DATA, IMG]);
    for (const k of await caches.keys()) if (!keep.has(k)) await caches.delete(k);
    await self.clients.claim();
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
