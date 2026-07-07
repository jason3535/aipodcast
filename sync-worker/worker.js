/**
 * AI Podcast — 多设备同步（无账号:同步码即身份）
 * PUT /s/<code>  存阅读状态 JSON(≤64KB);GET /s/<code> 取回;DELETE /s/<code> 删除。
 * code=客户端生成的 20 位 base32(100bit 随机,不可猜);KV 存储,一年滚动 TTL。
 * 隐私:无 Cookie、无 IP、无任何个人信息;存的只是「读过哪些期/读到哪」。
 */
const ALLOW = new Set(['https://aipodcast.jasonlin.tech', 'http://localhost:8000', 'http://127.0.0.1:8000', 'null']);
const cors = o => ({
  'Access-Control-Allow-Origin': ALLOW.has(o) ? o : 'https://aipodcast.jasonlin.tech',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin',
});
const ID = /^[A-Z2-7]{20}$/;
const TTL = 400 * 24 * 3600;   // 400 天滚动续期

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '', co = cors(origin);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: co });
    if (origin && !ALLOW.has(origin)) return new Response('forbidden', { status: 403, headers: co });
    const m = new URL(req.url).pathname.match(/^\/s\/([A-Z2-7]+)$/);
    if (!m || !ID.test(m[1])) return new Response('bad code', { status: 400, headers: co });
    const key = 'sync:' + m[1];

    if (req.method === 'GET') {
      const v = await env.SYNC.get(key);
      if (!v) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: { ...co, 'Content-Type': 'application/json' } });
      return new Response(v, { headers: { ...co, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (req.method === 'PUT') {
      const body = await req.text();
      if (body.length > 65536) return new Response('too large', { status: 413, headers: co });
      try { JSON.parse(body); } catch { return new Response('bad json', { status: 400, headers: co }); }
      await env.SYNC.put(key, body, { expirationTtl: TTL });
      return new Response(null, { status: 204, headers: co });
    }
    if (req.method === 'DELETE') {
      await env.SYNC.delete(key);
      return new Response(null, { status: 204, headers: co });
    }
    return new Response('method', { status: 405, headers: co });
  },
};
