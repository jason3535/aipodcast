// 从 index.html 导出 MCP 数据到 mcp-data/(GitHub Pages 托管,供 MCP Worker 拉取)
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const h=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const EPISODES=JSON.parse(h.match(/const EPISODES = (\[[\s\S]*?\]);\n\n\/\* ====== REAL/)[1]);
const PEOPLE=eval('('+h.match(/const PEOPLE = (\{[\s\S]*?\n\});/)[1]+')');
const VIEWS=JSON.parse(h.match(/VIEWS_START\*\/const VIEWS=(\{[\s\S]*?\});\/\*VIEWS_END/)[1]);
const OUT=path.join(ROOT,'mcp-data'),EP=path.join(OUT,'ep');
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(EP,{recursive:true});

// 1) 检索索引(每期元数据 + 章节标题 + 核心观点/反共识,无逐字稿)
const index=EPISODES.map(e=>{
  const p=PEOPLE[e.pid]||{};const ins=e.insights||{};
  return {id:e.id,pid:e.pid,person:p.en,personZh:p.zh,
    podEn:e.pod.en,podZh:e.pod.zh,date:e.date,year:(e.date||'').slice(0,4),
    min:e.min,fields:e.fields,tEn:e.tEn,tZh:e.tZh,sEn:e.sEn,sZh:e.sZh,
    secs:(e.ts||[]).map(s=>s.sec),
    keyPoints:(ins.consensus||[]).map(x=>({en:x.en,zh:x.zh})),
    contrarian:(ins.contrarian||[]).map(x=>({en:x.en,zh:x.zh})),
    src:e.src};
});
fs.writeFileSync(path.join(OUT,'index.json'),JSON.stringify({
  updated:'__BUILD_DATE__',count:index.length,episodes:index}));

// 2) 人物 + 观点演变
const people=Object.keys(PEOPLE).map(pid=>{
  const p=PEOPLE[pid];
  return {pid,en:p.en,zh:p.zh,tiEn:p.tiEn,tiZh:p.tiZh,fields:p.fields,
    bioEn:p.bioEn,bioZh:p.bioZh,
    episodes:EPISODES.filter(e=>e.pid===pid).sort((a,b)=>a.date<b.date?1:-1).map(e=>({id:e.id,date:e.date,tEn:e.tEn,podEn:e.pod.en})),
    views:VIEWS[pid]||[]};
});
fs.writeFileSync(path.join(OUT,'people.json'),JSON.stringify({count:people.length,people}));

// 3) 每期双语全文
EPISODES.forEach(e=>{
  const p=PEOPLE[e.pid]||{};
  fs.writeFileSync(path.join(EP,e.id+'.json'),JSON.stringify({
    id:e.id,pid:e.pid,person:p.en,personZh:p.zh,podEn:e.pod.en,podZh:e.pod.zh,
    date:e.date,min:e.min,fields:e.fields,tEn:e.tEn,tZh:e.tZh,sEn:e.sEn,sZh:e.sZh,
    src:e.src,insights:e.insights||{},transcript:e.ts||[]}));
});
console.log('mcp-data 写出:',index.length,'期索引 +',people.length,'人 +',EPISODES.length,'份全文');
