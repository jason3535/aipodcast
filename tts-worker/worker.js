/**
 * AI Podcast — ElevenLabs 朗读代理 (Cloudflare Worker)
 * 页面 POST {text, voice?} 到本 Worker,Worker 用密钥 ELEVENLABS_KEY 调 ElevenLabs 返回音频。
 * 密钥只存在 Worker secret 里,不进仓库、不暴露给前端。
 *
 * 部署见 README.md。设密钥: echo "<KEY>" | wrangler secret put ELEVENLABS_KEY
 */
const ALLOW = new Set([
  'https://aipodcast.jasonlin.tech',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'null', // 本地 file:// 打开时 Origin 为 "null"
]);
const MODEL = 'eleven_flash_v2_5';      // 最快的多语种模型(中英皆可)
const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM';
const MAX_CHARS = 2500;

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const acao = ALLOW.has(origin) ? origin : 'https://aipodcast.jasonlin.tech';
    const cors = {
      'Access-Control-Allow-Origin': acao,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: cors });
    // 仅允许白名单来源(挡掉浏览器侧的盗用;无法完全防服务端直连,但抬高门槛)
    if (origin && !ALLOW.has(origin)) return new Response('forbidden origin', { status: 403, headers: cors });

    let body;
    try { body = await req.json(); } catch { return new Response('bad json', { status: 400, headers: cors }); }
    const text = (body.text || '').toString().slice(0, MAX_CHARS);
    if (!text.trim()) return new Response('no text', { status: 400, headers: cors });
    const voice = (body.voice || DEFAULT_VOICE).toString().replace(/[^A-Za-z0-9]/g, '');

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'xi-api-key': env.ELEVENLABS_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({ text, model_id: MODEL }),
    });

    // 透传错误体(便于前端显示额度/限额等信息),成功则透传音频流
    return new Response(r.body, {
      status: r.status,
      headers: { ...cors, 'Content-Type': r.headers.get('Content-Type') || 'audio/mpeg' },
    });
  },
};
