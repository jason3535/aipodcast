/**
 * AI Podcast — 「问这期」grounded 问答代理 (Cloudflare Worker)
 * 页面 POST {id, question, history?} → Worker 取该期转录(mcp-data/ep/<id>.json)→ DeepSeek
 * 严格只基于转录回答,标注出处 [#章节号],答不出就说本期没讲。密钥存 secret DEEPSEEK_KEY。
 */
const DATA = 'https://aipodcast.jasonlin.tech/mcp-data';
const ALLOW = new Set([
  'https://aipodcast.jasonlin.tech', 'http://localhost:8000', 'http://127.0.0.1:8000', 'null',
]);
const MAX_Q = 500;        // 单条问题字数上限
const MAX_CTX = 46000;    // 转录上下文字符上限(控成本/防超限)
const mem = {};

function cors(origin) {
  const acao = ALLOW.has(origin) ? origin : 'https://aipodcast.jasonlin.tech';
  return { 'Access-Control-Allow-Origin': acao, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
}
async function getEp(id) {
  if (mem[id]) return mem[id];
  const url = `${DATA}/ep/${id.replace(/[^a-z0-9-]/gi, '')}.json`;
  const cache = caches.default;
  let r = await cache.match(url);
  if (!r) { r = await fetch(url, { cf: { cacheTtl: 600 } }); if (r.ok) await cache.put(url, r.clone()); }
  if (!r.ok) return null;
  const j = await r.json(); mem[id] = j; return j;
}
function buildContext(ts) {
  let out = [], n = 0;
  for (let i = 0; i < ts.length; i++) {
    const turns = (ts[i].turns || []).map(t => `${t.spk}: ${t.en}`).join('\n');
    const block = `[#${i}] ${ts[i].sec}\n${turns}\n`;
    if (n + block.length > MAX_CTX) break;
    out.push(block); n += block.length;
  }
  return out.join('\n');
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const co = cors(origin);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: co });
    if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: co });
    if (origin && !ALLOW.has(origin)) return new Response('forbidden origin', { status: 403, headers: co });

    let body; try { body = await req.json(); } catch { return j({ error: 'bad json' }, 400, co); }
    const id = (body.id || '').toString();
    const question = (body.question || '').toString().slice(0, MAX_Q).trim();
    const history = Array.isArray(body.history) ? body.history.slice(-4) : [];
    if (!id || !question) return j({ error: '缺少 id 或 question' }, 400, co);

    const ep = await getEp(id);
    if (!ep || !(ep.transcript || []).length) return j({ error: '该期暂无转录' }, 404, co);
    const ctx = buildContext(ep.transcript);

    const sys = `你是「AI Podcast」的单期问答助手。下面是这期播客《${ep.tEn || ''}》(嘉宾 ${ep.person || ''})的转录,按章节给出,每节前有 [#序号]。
规则:
- 只根据这份转录回答,不要用外部知识、不要编造。
- 每个关键论断后用 [#序号] 标注它来自哪一节(可多个)。
- 转录里没有讲到的,直接说「本期没有谈到这个」,不要硬答。
- 用「用户提问所用的语言」回答;简洁、口语化,先给结论。
转录:
${ctx}`;
    const msgs = [{ role: 'system', content: sys }];
    for (const m of history) if (m && m.role && m.content) msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: ('' + m.content).slice(0, 1500) });
    msgs.push({ role: 'user', content: question });

    let r;
    try {
      r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST', headers: { 'Authorization': `Bearer ${env.DEEPSEEK_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'deepseek-chat', messages: msgs, temperature: 0.2, max_tokens: 900 }),
      });
    } catch (e) { return j({ error: 'DeepSeek 连接失败' }, 502, co); }
    if (!r.ok) return j({ error: 'DeepSeek ' + r.status }, r.status, co);
    let answer = '';
    try { const d = await r.json(); answer = (d.choices && d.choices[0] && d.choices[0].message.content || '').trim(); }
    catch { return j({ error: '解析失败' }, 502, co); }
    return j({ answer }, 200, co);
  },
};
function j(obj, status, co) { return new Response(JSON.stringify(obj), { status, headers: { ...co, 'Content-Type': 'application/json' } }); }
