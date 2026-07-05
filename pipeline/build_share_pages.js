// SEO/GEO 静态预渲染:为每期生成 e/<id>/(真实正文 + JSON-LD),每位人物生成 pp/<pid>/(hub),
// 首页注入结构化数据,并产出 sitemap.xml + llms.txt。静态页含真实可抓取内容(不再只是跳转壳),
// 让搜索引擎与 AI 答案引擎能索引/引用;正文顶部提供「打开互动全文版」链接回 SPA。
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),SITE='https://aipodcast.jasonlin.tech';
const h=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const EPISODES=JSON.parse(h.match(/const EPISODES = (\[[\s\S]*?\]);\n\n\/\* ====== REAL/)[1]);
const PEOPLE=eval('('+h.match(/const PEOPLE = (\{[\s\S]*?\n\});/)[1]+')');
const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const jl=o=>`<script type="application/ld+json">${JSON.stringify(o).replace(/</g,'\\u003c')}</script>`;
const chapters=id=>{try{const d=JSON.parse(fs.readFileSync(path.join(ROOT,'mcp-data','ep',id+'.json'),'utf8'));return (d.transcript||[]).map(t=>({en:t.sec||'',zh:t.secZh||''})).filter(c=>c.en||c.zh);}catch(e){return[];}};
const CSS=`:root{--ink:#1d1d1f;--sub:#6e6e73;--line:#e6e6ea;--acc:#0071e3}*{box-sizing:border-box}body{font-family:-apple-system,"SF Pro Text",system-ui,"PingFang SC",sans-serif;color:var(--ink);background:#fff;margin:0;line-height:1.62}.wrap{max-width:760px;margin:0 auto;padding:34px 22px 80px}nav.bc{font-size:13px;color:var(--sub);margin-bottom:20px}nav.bc a{color:var(--sub);text-decoration:none}h1{font-size:27px;line-height:1.25;margin:.2em 0 .1em;letter-spacing:-.02em}.en-t{font-size:16px;color:var(--sub);margin:0 0 10px}.meta{font-size:14px;color:var(--sub);margin:8px 0 22px}.meta a{color:var(--acc);text-decoration:none}.cta{display:inline-block;margin:6px 0 26px;padding:10px 18px;background:var(--acc);color:#fff;border-radius:980px;font-size:14px;font-weight:600;text-decoration:none}h2{font-size:16px;margin:30px 0 10px;padding-top:8px;border-top:1px solid var(--line)}.zh{margin:.35em 0}.en{margin:.15em 0 1em;color:var(--sub);font-size:14.5px}ul{padding-left:1.1em}li{margin:.5em 0}.ep-list a{color:var(--ink)}footer{margin-top:44px;padding-top:16px;border-top:1px solid var(--line);font-size:12px;color:var(--sub)}footer a{color:var(--sub)}`;
const page=(title,desc,url,ogtype,bodyHtml,ld)=>`<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${ogtype}">
<meta property="og:site_name" content="AI Podcast · AI 播客">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${SITE}/assets/og.png">
${ld.map(jl).join('\n')}
<style>${CSS}</style></head><body><div class="wrap">${bodyHtml}
<footer>© AI Podcast · <a href="${SITE}/">aipodcast.jasonlin.tech</a> — 双语播客全文阅读。转录/翻译仅供学习评论,版权归原播客与权利人,应要求即下架(linzheng3535@gmail.com)。</footer>
</div></body></html>`;

const byPid={};EPISODES.forEach(e=>(byPid[e.pid]=byPid[e.pid]||[]).push(e));
const EDIR=path.join(ROOT,'e');fs.rmSync(EDIR,{recursive:true,force:true});fs.mkdirSync(EDIR,{recursive:true});
const PDIR=path.join(ROOT,'pp');fs.rmSync(PDIR,{recursive:true,force:true});fs.mkdirSync(PDIR,{recursive:true});
const vid=s=>{const m=(s||'').match(/(?:v=|youtu\.be\/)([\w-]{11})/);return m?m[1]:'';};
let n=0;
EPISODES.forEach(e=>{
  const p=PEOPLE[e.pid]||{};
  const title=`${esc(e.tZh||e.tEn)} · ${esc(p.zh||'')} — AI Podcast`;
  const cons=(e.insights&&e.insights.consensus)||[],cont=(e.insights&&e.insights.contrarian)||[];
  const kp=cons[0]?'｜核心观点：'+esc(cons[0].zh||''):'';
  const desc=esc((e.sZh||e.sEn||'')+'')+kp;
  const url=`${SITE}/e/${e.id}/`,hash=`${SITE}/#/episode/${e.id}`,person=`${SITE}/pp/${e.pid}/`;
  const chs=chapters(e.id);
  const tldr=(e.brief&&e.brief.tldr)||[];
  const li=(arr,f)=>arr.map(x=>`<li><span class="zh">${esc(f(x).zh)}</span><br><span class="en">${esc(f(x).en)}</span></li>`).join('');
  const body=`<nav class="bc"><a href="${SITE}/">AI Podcast</a> › <a href="${person}">${esc(p.zh||p.en||'')}</a> › 本期</nav>
<h1>${esc(e.tZh||e.tEn)}</h1><p class="en-t">${esc(e.tEn)}</p>
<p class="meta"><a href="${person}">${esc(p.zh||'')} ${esc(p.en||'')}</a> · ${esc((e.pod&&e.pod.zh)||(e.pod&&e.pod.en)||'')} · ${esc(e.date||'')} · 约 ${e.min||''} 分钟${vid(e.src)?` · <a href="${esc(e.src)}" rel="nofollow">原视频 ↗</a>`:''}</p>
<a class="cta" href="${hash}">打开互动全文版（中英对照 + 朗读 + 问答）→</a>
${(e.sZh||e.sEn)?`<h2>本期速览 · Overview</h2><p class="zh">${esc(e.sZh||'')}</p><p class="en">${esc(e.sEn||'')}</p>`:''}
${tldr.length?`<h2>要点 · TL;DR</h2><ul>${li(tldr,x=>x)}</ul>`:''}
${cons.length?`<h2>核心观点 · Key points</h2><ul>${li(cons,x=>x)}</ul>`:''}
${cont.length?`<h2>反共识 · Contrarian takes</h2><ul>${li(cont,x=>x)}</ul>`:''}
${chs.length?`<h2>本期章节 · Chapters（共 ${chs.length}）</h2><ul>${chs.map(c=>`<li><span class="zh">${esc(c.zh)}</span> <span class="en">${esc(c.en)}</span></li>`).join('')}</ul>`:''}
<p style="margin-top:26px"><a class="cta" href="${hash}">阅读全文双语转录 →</a></p>
<script>(function(){var q=location.search.replace(/^\\?/,'');if(!q)return;var h=${JSON.stringify(hash)}+'?'+q;
document.querySelectorAll('a.cta').forEach(function(a){a.href=h});
if(/(^|&)(at|hl)=/.test(q))location.replace(h);})()</script>`;
  const ld=[{"@context":"https://schema.org","@type":"PodcastEpisode",name:e.tEn,alternateName:e.tZh,url,datePublished:e.date,timeRequired:e.min?`PT${e.min}M`:undefined,inLanguage:["en","zh"],description:e.sEn||e.sZh,abstract:cons.map(c=>c.en).filter(Boolean).slice(0,5).join(' '),partOfSeries:{"@type":"PodcastSeries",name:(e.pod&&e.pod.en)||''},isPartOf:{"@type":"WebSite",name:"AI Podcast",url:SITE},actor:{"@type":"Person",name:p.en,jobTitle:p.tiEn,url:person},...(vid(e.src)?{associatedMedia:{"@type":"VideoObject",name:e.tEn,embedUrl:`https://www.youtube.com/embed/${vid(e.src)}`,uploadDate:e.date}}:{})},
    {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"AI Podcast",item:SITE+"/"},{"@type":"ListItem",position:2,name:p.zh||p.en||'',item:person},{"@type":"ListItem",position:3,name:e.tZh||e.tEn,item:url}]}];
  fs.mkdirSync(path.join(EDIR,e.id),{recursive:true});
  fs.writeFileSync(path.join(EDIR,e.id,'index.html'),page(title,desc,url,'article',body,ld));
  n++;
});
// person hub pages
let pn=0;
Object.keys(byPid).forEach(pid=>{
  const p=PEOPLE[pid]||{};if(!p.en)return;
  const eps=byPid[pid].slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const url=`${SITE}/pp/${pid}/`;
  const title=`${esc(p.zh||'')} ${esc(p.en||'')} 的 AI 播客访谈（${eps.length} 期）— AI Podcast`;
  const desc=esc(((p.zh||'')+' '+(p.en||'')+'：'+(p.tiZh||p.tiEn||'')+'。收录 '+eps.length+' 期双语播客全文——'+(p.bioZh||'')).slice(0,180));
  const body=`<nav class="bc"><a href="${SITE}/">AI Podcast</a> › ${esc(p.zh||p.en||'')}</nav>
<h1>${esc(p.zh||'')} ${esc(p.en||'')}</h1><p class="en-t">${esc(p.tiZh||'')} · ${esc(p.tiEn||'')}</p>
${p.bioZh?`<p class="zh">${esc(p.bioZh)}</p><p class="en">${esc(p.bioEn||'')}</p>`:''}
<a class="cta" href="${SITE}/#/person/${pid}">在 AI Podcast 查看 TA 的全部内容 →</a>
<h2>收录的 ${eps.length} 期访谈</h2>
<ul class="ep-list">${eps.map(e=>`<li><a href="${SITE}/e/${e.id}/">${esc(e.tZh||e.tEn)}</a> — ${esc((e.pod&&e.pod.zh)||'')} · ${esc(e.date||'')}</li>`).join('')}</ul>`;
  const ld=[{"@context":"https://schema.org","@type":"ProfilePage",mainEntity:{"@type":"Person",name:p.en,alternateName:p.zh,jobTitle:p.tiEn,description:p.bioEn,url}},
    {"@context":"https://schema.org","@type":"ItemList",itemListElement:eps.map((e,i)=>({"@type":"ListItem",position:i+1,url:`${SITE}/e/${e.id}/`,name:e.tEn}))},
    {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"AI Podcast",item:SITE+"/"},{"@type":"ListItem",position:2,name:p.zh||p.en||'',item:url}]}];
  fs.mkdirSync(path.join(PDIR,pid),{recursive:true});
  fs.writeFileSync(path.join(PDIR,pid,'index.html'),page(title,desc,url,'profile',body,ld));
  pn++;
});
// sitemap: 首页 + 议题 + 人物 hub + 各期
const urls=[`${SITE}/`,`${SITE}/#/topics`,...Object.keys(byPid).filter(pid=>PEOPLE[pid]).map(pid=>`${SITE}/pp/${pid}/`),...EPISODES.map(e=>`${SITE}/e/${e.id}/`)];
fs.writeFileSync(path.join(ROOT,'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`+
  urls.map(u=>`  <url><loc>${u}</loc></url>`).join('\n')+`\n</urlset>\n`);
// llms.txt (GEO 索引)
const llms=`# AI Podcast · 双语播客全文阅读站\n\n> 把知名 AI 人物(研究者、实验室建设者、创始人)的英文长访谈整理成中英对照全文,提炼核心观点与反共识,并可针对内容问答。A bilingual reading site of famous AI figures' podcast interviews — full English↔Chinese transcripts, key points, contrarian takes, and Q&A.\n\n站点: ${SITE}/\n规模: ${Object.keys(byPid).filter(p=>PEOPLE[p]).length} 位人物 / ${EPISODES.length} 期访谈\n每期静态页含: 双语速览、核心观点、反共识、章节;互动版含中英对照全文 + 逐字朗读 + 单期/全站问答。\n\n## 人物 People\n${Object.keys(byPid).filter(pid=>PEOPLE[pid]).sort((a,b)=>byPid[b].length-byPid[a].length).map(pid=>{const p=PEOPLE[pid];return `- [${p.en}${p.zh?' / '+p.zh:''}](${SITE}/pp/${pid}/): ${(p.tiEn||'').replace(/\n/g,' ')} — ${byPid[pid].length} 期`;}).join('\n')}\n\n## 最新访谈 Latest episodes\n${EPISODES.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,40).map(e=>{const p=PEOPLE[e.pid]||{};return `- [${e.tEn}](${SITE}/e/${e.id}/) — ${p.en||''}, ${(e.pod&&e.pod.en)||''}, ${e.date||''}`;}).join('\n')}\n\n## 数据接口\n- sitemap: ${SITE}/sitemap.xml\n- MCP server (只读内容,外部 AI 可接入): https://aipodcast-mcp.992978142.workers.dev/mcp\n`;
fs.writeFileSync(path.join(ROOT,'llms.txt'),llms);
console.log('分享页',n,'期 + 人物 hub',pn,'个 + sitemap',urls.length,'条 + llms.txt');
