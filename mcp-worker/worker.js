/**
 * AI Podcast — 远程 MCP Server (Cloudflare Worker, Streamable HTTP)
 * 让任意支持 MCP 的 Agent(Claude / Cursor / 等) 接入本站全部播客内容做问答。
 * 端点: POST https://<worker>/mcp   工具: list_people / get_person / search_episodes / get_episode
 * 数据: GitHub Pages 上的 /mcp-data/(由 pipeline/build_mcp_data.js 生成),Worker 拉取并缓存。只读、双语。
 */
const DATA = 'https://aipodcast.jasonlin.tech/mcp-data';
const PROTO = '2025-06-18';
const SERVER = { name: 'ai-podcast', version: '1.0.0', title: 'AI Podcast' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Authorization',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
};

// ---- 数据读取(Cache API + isolate 内存缓存) ----
const mem = {};
async function getJSON(p) {
  if (mem[p]) return mem[p];
  const url = `${DATA}/${p}`;
  const cache = caches.default;
  let r = await cache.match(url);
  if (!r) {
    r = await fetch(url, { cf: { cacheTtl: 600 } });
    if (r.ok) await cache.put(url, r.clone());
  }
  if (!r.ok) throw new Error(`数据获取失败 ${p} (${r.status})`);
  const j = await r.json();
  mem[p] = j;
  return j;
}

// ---- 工具定义 ----
const TOOLS = [
  { name: 'list_people',
    description: '列出全部 AI 关键人物(姓名、头衔、研究领域、播客期数)。先用它了解有谁。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'get_person',
    description: '取某位人物的简介、研究领域、TA 的全部播客列表,以及「观点演变」(随时间的立场变化)。',
    inputSchema: { type: 'object', properties: { pid: { type: 'string', description: '人物 id,如 ilya / karpathy / lecun' } }, required: ['pid'], additionalProperties: false } },
  { name: 'search_episodes',
    description: '按关键词/人物/领域/年份检索播客单集,返回标题、导语、核心观点与反共识摘要(不含逐字稿)。用它定位相关单集,再用 get_episode 取全文。',
    inputSchema: { type: 'object', properties: {
      query: { type: 'string', description: '关键词(中英皆可),匹配标题/导语/章节/核心观点' },
      person: { type: 'string', description: '可选,限定人物 id' },
      field: { type: 'string', description: '可选,领域: deep-learning/nlp/vision/rl/safety/robotics' },
      year: { type: 'string', description: '可选,年份如 2026' },
      limit: { type: 'number', description: '返回条数,默认 8' } }, additionalProperties: false } },
  { name: 'get_episode',
    description: '取某一期的双语全文逐字稿 + 核心观点/反共识。lang 可选 both/en/zh 控制返回大小。',
    inputSchema: { type: 'object', properties: {
      id: { type: 'string', description: '单集 id(来自 search_episodes / get_person)' },
      lang: { type: 'string', enum: ['both', 'en', 'zh'], description: '默认 both' } }, required: ['id'], additionalProperties: false } },
];

// ---- 工具实现 ----
async function listPeople() {
  const { people } = await getJSON('people.json');
  return people.map(p => ({ pid: p.pid, name: p.en, nameZh: p.zh, title: p.tiEn, fields: p.fields, episodes: p.episodes.length }));
}
async function getPerson(a) {
  const { people } = await getJSON('people.json');
  const p = people.find(x => x.pid === a.pid);
  if (!p) throw new Error(`没有这个人物: ${a.pid}。用 list_people 查可用 id。`);
  return p;
}
async function searchEpisodes(a) {
  const { episodes } = await getJSON('index.json');
  const q = (a.query || '').toLowerCase().trim();
  const terms = q ? q.split(/\s+/) : [];
  let res = episodes.filter(e =>
    (!a.person || e.pid === a.person) &&
    (!a.field || (e.fields || []).includes(a.field)) &&
    (!a.year || e.year === String(a.year)));
  const blob = e => [e.person, e.personZh, e.podEn, e.tEn, e.tZh, e.sEn, e.sZh,
    (e.secs || []).join(' '), (e.keyPoints || []).map(x => x.en + x.zh).join(' '),
    (e.contrarian || []).map(x => x.en + x.zh).join(' ')].join(' ').toLowerCase();
  if (terms.length) {
    res = res.map(e => { const b = blob(e); let s = 0;
      for (const t of terms) { if (b.includes(t)) s++; if ((e.tEn + e.tZh).toLowerCase().includes(t)) s += 2; }
      return { e, s }; }).filter(x => x.s > 0).sort((x, y) => y.s - x.s).map(x => x.e);
  } else { res = res.sort((x, y) => x.date < y.date ? 1 : -1); }
  const lim = Math.min(a.limit || 8, 25);
  return { total: res.length, results: res.slice(0, lim).map(e => ({
    id: e.id, person: e.person, personZh: e.personZh, title: e.tEn, titleZh: e.tZh,
    pod: e.podEn, date: e.date, min: e.min, fields: e.fields,
    summary: e.sEn, summaryZh: e.sZh, keyPoints: e.keyPoints, contrarian: e.contrarian, source: e.src })) };
}
async function getEpisode(a) {
  let ep;
  try { ep = await getJSON(`ep/${(a.id || '').replace(/[^a-z0-9-]/gi, '')}.json`); }
  catch { throw new Error(`没有这一期: ${a.id}。用 search_episodes 查 id。`); }
  const lang = a.lang || 'both';
  if (lang !== 'both') {
    ep = { ...ep, transcript: (ep.transcript || []).map(s => ({ sec: s.sec,
      turns: (s.turns || []).map(t => ({ spk: t.spk, text: lang === 'en' ? t.en : t.zh })) })) };
  }
  return ep;
}
async function runTool(name, args) {
  args = args || {};
  if (name === 'list_people') return await listPeople();
  if (name === 'get_person') return await getPerson(args);
  if (name === 'search_episodes') return await searchEpisodes(args);
  if (name === 'get_episode') return await getEpisode(args);
  throw new Error(`未知工具: ${name}`);
}

// ---- JSON-RPC / MCP ----
function rpc(id, result) { return { jsonrpc: '2.0', id, result }; }
function rpcErr(id, code, message) { return { jsonrpc: '2.0', id, error: { code, message } }; }

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') {
    const pv = (params && params.protocolVersion) || PROTO;
    return rpc(id, { protocolVersion: pv, capabilities: { tools: { listChanged: false } },
      serverInfo: SERVER, instructions: '本站收录知名 AI 人物的播客双语全文(102 期/25 人)。先 list_people 或 search_episodes 定位,再 get_episode 取全文。' });
  }
  if (method === 'notifications/initialized' || method === 'notifications/cancelled') return null; // 通知无响应
  if (method === 'ping') return rpc(id, {});
  if (method === 'tools/list') return rpc(id, { tools: TOOLS });
  if (method === 'tools/call') {
    const nm = params && params.name;
    try {
      const out = await runTool(nm, params && params.arguments);
      return rpc(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 1) }] });
    } catch (e) {
      return rpc(id, { content: [{ type: 'text', text: '错误: ' + (e.message || e) }], isError: true });
    }
  }
  if (id === undefined) return null;
  return rpcErr(id, -32601, `Method not found: ${method}`);
}

export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    // 人类访问根路径给个说明
    if (req.method === 'GET' && url.pathname !== '/mcp') {
      return new Response(JSON.stringify({ server: SERVER, endpoint: '/mcp (Streamable HTTP)', tools: TOOLS.map(t => t.name) }, null, 2),
        { headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    if (req.method !== 'POST') return new Response('Use POST /mcp (MCP Streamable HTTP)', { status: 405, headers: CORS });
    let body;
    try { body = await req.json(); } catch { return new Response(JSON.stringify(rpcErr(null, -32700, 'Parse error')), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }); }
    const out = Array.isArray(body)
      ? (await Promise.all(body.map(handle))).filter(x => x !== null)
      : await handle(body);
    if (out === null || (Array.isArray(out) && !out.length)) return new Response(null, { status: 202, headers: CORS }); // 仅通知
    return new Response(JSON.stringify(out), { headers: { ...CORS, 'Content-Type': 'application/json' } });
  },
};
