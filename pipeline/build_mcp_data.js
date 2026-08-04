// 从 app.js 导出 MCP 数据到 mcp-data/(GitHub Pages 托管,供 MCP Worker + 网页懒加载用)
// 注意:app.js 的内联 EPISODES 已剥离逐字稿(ts),只剩元数据+insights。
//   逐字稿的权威源 = mcp-data/ep/<id>.json(由 add_episode.py 写入,本脚本不覆盖)。
//   本脚本只重建 index.json(检索) 与 people.json,章节标题从 ep 文件读取。
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const h=fs.readFileSync(path.join(ROOT,'app.js'),'utf8');
const EPISODES=JSON.parse(h.match(/const EPISODES = (\[[\s\S]*?\]);\n\n\/\* ====== REAL/)[1]);
// 合并 data/ep-extra.json(split_extra 把 insights/brief 移了出去,这里补回作 MCP/Ask 材料)
try{const extra=JSON.parse(fs.readFileSync(path.join(ROOT,'data','ep-extra.json'),'utf8'));
  EPISODES.forEach(e=>{const x=extra[e.id];if(x){if(!e.insights&&x.insights)e.insights=x.insights;if(!e.brief&&x.brief)e.brief=x.brief;}});
}catch(err){console.error('ep-extra 合并失败:',err.message);}
const PEOPLE=eval('('+h.match(/const PEOPLE = (\{[\s\S]*?\n\});/)[1]+')');
// 观点演变:split_data 把它移到 data/views.json 了,内联块为空时从那里读(两种状态都兼容)
let VIEWS=JSON.parse(h.match(/VIEWS_START\*\/const VIEWS=(\{[\s\S]*?\});\/\*VIEWS_END/)[1]);
if(!Object.keys(VIEWS).length){
  try{VIEWS=JSON.parse(fs.readFileSync(path.join(ROOT,'data','views.json'),'utf8'));}
  catch(err){console.error('views.json 读取失败(MCP 人物数据将缺观点演变):',err.message);}
}
const OUT=path.join(ROOT,'mcp-data'),EP=path.join(OUT,'ep');
fs.mkdirSync(EP,{recursive:true});

// 从 ep 文件取逐字稿(权威源);内联若仍带 ts 则优先用内联
function tsOf(e){
  if((e.ts||[]).length)return e.ts;
  const f=path.join(EP,e.id+'.json');
  if(fs.existsSync(f)){try{return (JSON.parse(fs.readFileSync(f,'utf8')).transcript)||[];}catch(_){}}
  return [];
}

// 1) 检索索引(每期元数据 + 章节标题 + 核心观点/反共识,无逐字稿)
const index=EPISODES.map(e=>{
  const p=PEOPLE[e.pid]||{};const ins=e.insights||{};
  return {id:e.id,pid:e.pid,person:p.en,personZh:p.zh,
    podEn:e.pod.en,podZh:e.pod.zh,date:e.date,year:(e.date||'').slice(0,4),
    min:e.min,fields:e.fields,tEn:e.tEn,tZh:e.tZh,sEn:e.sEn,sZh:e.sZh,
    secs:tsOf(e).map(s=>s.sec),
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

// 3) ep/<id>.json(逐字稿全文)= 权威源,只在内联仍带 ts 时补写,绝不清空已有文件
let wrote=0;
EPISODES.forEach(e=>{
  if(!(e.ts||[]).length)return;            // 内联无 ts → 保留已有 ep 文件,不动
  const p=PEOPLE[e.pid]||{};
  fs.writeFileSync(path.join(EP,e.id+'.json'),JSON.stringify({
    id:e.id,pid:e.pid,person:p.en,personZh:p.zh,podEn:e.pod.en,podZh:e.pod.zh,
    date:e.date,min:e.min,fields:e.fields,tEn:e.tEn,tZh:e.tZh,sEn:e.sEn,sZh:e.sZh,
    src:e.src,insights:e.insights||{},brief:e.brief||null,transcript:e.ts}));
  wrote++;
});

// 3b) 把 insights/brief 补进已有的 ep 文件:单集页本来就要拉这个文件,拿到这两块就不必再为
//     data/ep-extra.json(gzip 558KB)整包买单。只补缺的字段,不碰 transcript。
let patched=0;
EPISODES.forEach(e=>{
  const f=path.join(EP,e.id+'.json');
  if(!fs.existsSync(f))return;
  let d;try{d=JSON.parse(fs.readFileSync(f,'utf8'));}catch(_){return;}
  let ch=false;
  if(e.insights&&Object.keys(e.insights).length&&!(d.insights&&Object.keys(d.insights).length)){d.insights=e.insights;ch=true;}
  if(e.brief&&!d.brief){d.brief=e.brief;ch=true;}
  if(ch){fs.writeFileSync(f,JSON.stringify(d));patched++;}
});
console.log('mcp-data:',index.length,'期索引 +',people.length,'人 | ep 补写',wrote,'(其余沿用已有全文) | 补 insights/brief',patched);
