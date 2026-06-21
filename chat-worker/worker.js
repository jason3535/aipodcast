/**
 * AI Podcast — 问答代理 (Cloudflare Worker, 流式)
 * POST {id, question, history?, mode?}
 *   mode 'episode'(默认): 就「该期」转录回答,引用 [#章节号]。
 *   mode 'all': 问全站——先让 DeepSeek 从精简目录选相关单集(RAG-lite),
 *               再就这些单集的核心观点/反共识综合回答,引用 [@单集id]。
 * 返回 text/plain 流(逐字)。密钥存 secret DEEPSEEK_KEY。
 */
const DATA = 'https://aipodcast.jasonlin.tech/mcp-data';
const ALLOW = new Set(['https://aipodcast.jasonlin.tech','http://localhost:8000','http://127.0.0.1:8000','null']);
const MAX_Q = 500, MAX_CTX = 46000;
const mem = {};
const cors = o => ({ 'Access-Control-Allow-Origin': ALLOW.has(o) ? o : 'https://aipodcast.jasonlin.tech',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' });

async function getJSON(path) {
  if (mem[path]) return mem[path];
  const url = `${DATA}/${path}`, cache = caches.default;
  let r = await cache.match(url);
  if (!r) { r = await fetch(url, { cf: { cacheTtl: 600 } }); if (r.ok) await cache.put(url, r.clone()); }
  if (!r.ok) return null;
  const j = await r.json(); mem[path] = j; return j;
}
function epContext(ts) {
  let out = [], n = 0;
  for (let i = 0; i < ts.length; i++) {
    const blk = `[#${i}] ${ts[i].sec}\n` + (ts[i].turns || []).map(t => `${t.spk}: ${t.en}`).join('\n') + '\n';
    if (n + blk.length > MAX_CTX) break; out.push(blk); n += blk.length;
  }
  return out.join('\n');
}
async function dsOnce(env, messages, mx) {
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${env.DEEPSEEK_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.1, max_tokens: mx || 300, response_format: { type: 'json_object' } }),
  });
  if (!r.ok) throw new Error('DeepSeek ' + r.status);
  const d = await r.json(); return JSON.parse(d.choices[0].message.content);
}
async function dsStream(env, messages, write) {
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${env.DEEPSEEK_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.2, max_tokens: 1200, stream: true }),
  });
  if (!r.ok) { await write('（出错:DeepSeek ' + r.status + '）'); return; }
  const reader = r.body.getReader(), dec = new TextDecoder(); let buf = '';
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true }); let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim(); if (data === '[DONE]') return;
      try { const c = JSON.parse(data).choices[0].delta.content; if (c) await write(c); } catch (_) {}
    }
  }
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '', co = cors(origin);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: co });
    if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: co });
    if (origin && !ALLOW.has(origin)) return new Response('forbidden', { status: 403, headers: co });
    let b; try { b = await req.json(); } catch { return jerr('bad json', 400, co); }
    const question = (b.question || '').toString().slice(0, MAX_Q).trim();
    const mode = b.mode === 'all' ? 'all' : 'episode';
    const history = (Array.isArray(b.history) ? b.history.slice(-4) : [])
      .filter(m => m && m.role && m.content).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: ('' + m.content).slice(0, 1500) }));
    if (!question) return jerr('缺少 question', 400, co);

    let sys;
    if (mode === 'episode') {
      const ep = await getJSON(`ep/${(b.id || '').replace(/[^a-z0-9-]/gi, '')}.json`);
      if (!ep || !(ep.transcript || []).length) return jerr('该期暂无转录', 404, co);
      sys = `你是「AI Podcast」单期问答助手。下面是《${ep.tEn || ''}》(嘉宾 ${ep.person || ''})的转录,每节前有 [#序号]。
规则:只据这份转录回答,不用外部知识、不编造;关键论断后用 [#序号] 标注出处(可多个);转录没讲到就说「本期没有谈到这个」;用用户提问的语言、简洁、先给结论。
转录:
${epContext(ep.transcript)}`;
    } else {
      const idx = await getJSON('index.json');
      if (!idx) return jerr('目录不可用', 503, co);
      const eps = idx.episodes || [];
      const catalog = eps.map(e => `${e.id} | ${e.person} | ${e.tEn} | ${e.sEn || ''}`).join('\n');
      let picked = [];
      try {
        const sel = await dsOnce(env, [{ role: 'system', content: `下面是 AI 播客单集目录(每行:id | 人物 | 标题 | 导语)。根据用户问题,挑最相关的最多 8 期,按相关度排序。只输出 JSON {"ids":["..."]}。\n目录:\n${catalog}` },
          { role: 'user', content: question }], 400);
        picked = (sel.ids || []).filter(id => eps.find(e => e.id === id)).slice(0, 8);
      } catch (_) {}
      if (!picked.length) picked = eps.slice(0, 6).map(e => e.id);
      const ctx = picked.map(id => {
        const e = eps.find(x => x.id === id); if (!e) return '';
        const kp = (e.keyPoints || []).map(x => '  · ' + x.en).join('\n');
        const ct = (e.contrarian || []).map(x => '  ! ' + x.en).join('\n');
        return `[@${e.id}] ${e.person}《${e.tEn}》(${e.date})\n核心观点:\n${kp}\n反共识:\n${ct}`;
      }).join('\n\n');
      sys = `你是「AI Podcast」全站问答助手。下面是若干位 AI 人物在不同播客里的「核心观点/反共识」摘录,每段前有 [@单集id]。
规则:综合这些材料回答用户问题,对比不同人的看法;每个论断后用 [@单集id] 标注来源(可多个);材料里没有的不要编;用用户提问的语言,先给结论再展开。
材料:
${ctx}`;
    }

    const msgs = [{ role: 'system', content: sys }, ...history, { role: 'user', content: question }];
    const { readable, writable } = new TransformStream();
    const w = writable.getWriter(), enc = new TextEncoder();
    (async () => {
      try { await dsStream(env, msgs, t => w.write(enc.encode(t))); }
      catch (e) { try { await w.write(enc.encode('（出错:' + (e.message || e) + '）')); } catch (_) {} }
      finally { try { w.close(); } catch (_) {} }
    })();
    return new Response(readable, { headers: { ...co, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  },
};
function jerr(msg, status, co) { return new Response(JSON.stringify({ error: msg }), { status, headers: { ...co, 'Content-Type': 'application/json' } }); }
