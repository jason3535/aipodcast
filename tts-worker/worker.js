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
// 朗读额度(字符数/天)。ElevenLabs 按字符收费,这里是花钱的闸门。
// 默认值 = 当前真实用量的几十倍,同时把最坏情况钉死在可承受范围;可用环境变量覆盖。
const TTS_IP_CHARS  = 30000;    // 单 IP 每天(≈半期长访谈的跟读量)
const TTS_DAY_CHARS = 100000;   // 全站每天

/* ---------- 限流:按 IP 按天 + 全站按天硬上限(防刷钱) ----------
 * cost 的单位由调用方决定:TTS 用字符数(ElevenLabs 按字符计费),问答用次数。
 * KV 最终一致,并发下可能小幅超出 —— 这是成本护栏不是安全边界,够用。
 * KV 故障时**放行**:宁可短暂失去护栏,也不让计数层故障拖垮整个功能;
 * 全站上限是最后的兜底。改额度不必动代码,在 Worker 环境变量里设即可。 */
async function quota(env, kind, ip, cost, ipCap, dayCap) {
  if (!env.RL) return null;                       // 未绑定 KV → 不限流(本地/回滚场景)
  const day = new Date().toISOString().slice(0, 10);
  const kIp = `${kind}:${day}:${ip || 'unknown'}`, kAll = `${kind}:${day}:_all`;
  try {
    const [a, b] = await Promise.all([env.RL.get(kIp), env.RL.get(kAll)]);
    const used = +a || 0, all = +b || 0;
    if (used + cost > ipCap) return 'ip';
    if (all + cost > dayCap) return 'all';
    const ttl = 172800;                           // 2 天,跨时区也够
    await Promise.all([
      env.RL.put(kIp, String(used + cost), { expirationTtl: ttl }),
      env.RL.put(kAll, String(all + cost), { expirationTtl: ttl }),
    ]);
  } catch (_) { return null; }
  return null;
}


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

    const over = await quota(env, 'tts', req.headers.get('CF-Connecting-IP'), text.length,
      +env.TTS_IP_CHARS || TTS_IP_CHARS, +env.TTS_DAY_CHARS || TTS_DAY_CHARS);
    if (over) return new Response(JSON.stringify({ detail: over === 'ip'
        ? '今天的朗读额度已用完，明天再来吧。' : '本站今日朗读额度已用完，明天再来吧。' }),
      { status: 429, headers: { ...cors, 'Content-Type': 'application/json' } });

    // with-timestamps:返回 JSON {audio_base64, alignment:{characters[], character_start_times_seconds[], ...}}
    // 供前端做「朗读跟读」字符级进度高亮。
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps`, {
      method: 'POST',
      headers: {
        'xi-api-key': env.ELEVENLABS_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ text, model_id: MODEL }),
    });

    // 透传错误体(便于前端显示额度/限额等信息),成功则透传 JSON
    return new Response(r.body, {
      status: r.status,
      headers: { ...cors, 'Content-Type': r.headers.get('Content-Type') || 'application/json' },
    });
  },
};
