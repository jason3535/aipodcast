/**
 * AI Podcast — 问答代理 (Cloudflare Worker, 流式)
 * POST {id, question, history?, mode?}
 *   mode 'episode'(默认): 优先就「该期」转录回答,引用 [#章节号];
 *   mode 'all': 就全站核心观点综合回答,引用 [@单集id]。
 * 自动联网:两种模式都给模型一个 web_search 工具,由模型按问题自行判断——
 *   转录/材料能答就据此作答;超范围(最新动态、材料外的事实等)则自动联网搜索后回答,标注链接。
 *   未配置 SEARCH_KEY 时降级为「用通用知识补充」,不做实时联网。
 * 返回 text/plain 流(逐字)。密钥:secret DEEPSEEK_KEY(必需)、SEARCH_KEY(Tavily,可选)。
 */
const DATA = 'https://aipodcast.jasonlin.tech/mcp-data';
const ALLOW = new Set(['https://aipodcast.jasonlin.tech','http://localhost:8000','http://127.0.0.1:8000','null']);
const MAX_Q = 500, MAX_CTX = 46000;
const mem = {};
const cors = o => ({ 'Access-Control-Allow-Origin': ALLOW.has(o) ? o : 'https://aipodcast.jasonlin.tech',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' });

const SEARCH_TOOL = { type: 'function', function: {
  name: 'web_search',
  description: '当本期播客转录/站内材料不足以回答,或问题涉及最新动态、材料之外的事实、需要实时或外部互联网信息时,调用此工具联网搜索。若已有内容足以回答,则不要调用。',
  parameters: { type: 'object', properties: {
    query: { type: 'string', description: '搜索查询,用用户提问所用的语言,提炼为精准关键词' } }, required: ['query'] },
} };

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
// Tavily 联网搜索;未配置或出错时返回 null / 提示串
async function webSearch(env, query) {
  if (!env.SEARCH_KEY) return null;
  try {
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.SEARCH_KEY}` },
      body: JSON.stringify({ query, max_results: 5, search_depth: 'basic', include_answer: false }),
    });
    if (!r.ok) return `(联网搜索失败:${r.status})`;
    const d = await r.json();
    const rows = (d.results || []).slice(0, 5).map((x, i) =>
      `[${i + 1}] ${x.title}\n${x.url}\n${('' + (x.content || '')).replace(/\s+/g, ' ').slice(0, 600)}`);
    return rows.length ? rows.join('\n\n') : '(未找到相关结果)';
  } catch (e) { return `(联网搜索出错:${e.message || e})`; }
}
async function dsOnce(env, messages, mx) {
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${env.DEEPSEEK_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.1, max_tokens: mx || 300, response_format: { type: 'json_object' } }),
  });
  if (!r.ok) throw new Error('DeepSeek ' + r.status);
  const d = await r.json(); return JSON.parse(d.choices[0].message.content);
}
// 流式;可带 tools。若模型选择调用工具则不产出正文,返回 {name,args};否则边流边 write,返回 null。
async function dsAgent(env, messages, tools, write) {
  const body = { model: 'deepseek-chat', messages, temperature: 0.2, max_tokens: 1200, stream: true };
  if (tools) { body.tools = tools; body.tool_choice = 'auto'; }
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST', headers: { 'Authorization': `Bearer ${env.DEEPSEEK_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) { await write('（出错:DeepSeek ' + r.status + '）'); return null; }
  const reader = r.body.getReader(), dec = new TextDecoder(); let buf = '', tc = null;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true }); let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim(); if (data === '[DONE]') return tc;
      try {
        const delta = JSON.parse(data).choices[0].delta;
        if (delta && delta.tool_calls) {
          const call = delta.tool_calls[0];
          if (!tc) tc = { name: '', args: '' };
          if (call.function && call.function.name) tc.name += call.function.name;
          if (call.function && call.function.arguments) tc.args += call.function.arguments;
        } else if (delta && delta.content) { await write(delta.content); }
      } catch (_) {}
    }
  }
  return tc;
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

    const hasSearch = !!env.SEARCH_KEY;
    let sys, ctxTitle = '';
    if (mode === 'episode') {
      const ep = await getJSON(`ep/${(b.id || '').replace(/[^a-z0-9-]/gi, '')}.json`);
      if (!ep || !(ep.transcript || []).length) return jerr('该期暂无转录', 404, co);
      ctxTitle = ep.tEn || '';
      sys = `你是「AI Podcast」单期问答助手。下面是《${ep.tEn || ''}》(嘉宾 ${ep.person || ''})的转录,每节前有 [#序号]。
优先规则:能用这份转录回答的,就据转录回答,关键论断后用 [#序号] 标注出处(可多个);简洁,先给结论,用用户提问的语言。` +
      (hasSearch
        ? `\n超范围规则:若问题超出本期转录(最新动态、转录没谈到的事实、需要核实的外部信息等),不要说"本期没谈到",而是调用 web_search 工具联网搜索后再回答。`
        : `\n超范围规则:若问题超出本期转录,可用你的通用知识补充作答并注明"(本期未提及,以下为补充)",不确定就直说,不要编造。`) +
      `\n转录:\n${epContext(ep.transcript)}`;
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
规则:综合这些材料回答用户问题,对比不同人的看法;每个论断后用 [@单集id] 标注来源(可多个);先给结论再展开,用用户提问的语言。` +
      (hasSearch
        ? `\n超范围规则:若材料不足以回答(最新动态、材料没覆盖的事实等),调用 web_search 工具联网搜索后再回答,不要编造。`
        : `\n超范围规则:若材料不足,可用通用知识补充并注明,不确定就直说,不要编造。`) +
      `\n材料:\n${ctx}`;
    }

    const tools = hasSearch ? [SEARCH_TOOL] : undefined;
    const msgs = [{ role: 'system', content: sys }, ...history, { role: 'user', content: question }];
    const { readable, writable } = new TransformStream();
    const w = writable.getWriter(), enc = new TextEncoder();
    const write = t => w.write(enc.encode(t));
    (async () => {
      try {
        const tc = await dsAgent(env, msgs, tools, write);
        if (tc && tc.name === 'web_search') {
          let q = question;
          try { const a = JSON.parse(tc.args || '{}'); if (a.query) q = ('' + a.query).slice(0, MAX_Q); } catch (_) {}
          const results = await webSearch(env, q);
          const sysWeb = `你是「AI Podcast」问答助手。用户的问题需要本期播客之外的信息,下面是刚为此问题做的网络搜索结果(每条:标题/链接/摘要)。
规则:综合这些结果回答;关键事实后用 markdown 链接标注来源,格式 [简短标题](链接);结果不足或彼此矛盾就如实说明;用用户提问的语言,先给结论。` +
          (ctxTitle ? `\n(当前播客:《${ctxTitle}》,若搜索内容与之相关可点明联系。)` : '') +
          `\n网络搜索结果:\n${results || '(未获取到搜索结果)'}`;
          const msgs2 = [{ role: 'system', content: sysWeb }, ...history, { role: 'user', content: question }];
          await dsStream(env, msgs2, write);
        }
      } catch (e) { try { await write('（出错:' + (e.message || e) + '）'); } catch (_) {} }
      finally { try { w.close(); } catch (_) {} }
    })();
    return new Response(readable, { headers: { ...co, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  },
};
function jerr(msg, status, co) { return new Response(JSON.stringify({ error: msg }), { status, headers: { ...co, 'Content-Type': 'application/json' } }); }
