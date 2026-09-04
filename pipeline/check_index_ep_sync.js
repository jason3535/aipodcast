// check_index_ep_sync.js —— 门禁:mcp-data/index.json 与 mcp-data/ep/<id>.json 的元数据必须一致。
//
// 为什么需要这道门禁:
//   列表/搜索页读 index.json,SPA 单集详情页读 ep/<id>.json —— 同一集的标题在两处各存一份。
//   build_mcp_data.js 每次都从 app.js 重建 index,但 ep 文件「只在内联仍带 ts 时才写」,
//   逐字稿剥离之后就再也不写了。于是任何在 app.js 上做的标题/台名修正只落到 index,
//   ep 文件冻在收录当天 —— 列表页一个标题、点进去另一个标题,肉眼扫列表永远发现不了。
//
//   2026-08-24 修 altman-davidsen-2026 的标题(自动标题把开场话题「Tobi Lütke」当成了整集
//   主题)就只落到 index,详情页十天里一直挂着 Tobi Lütke 的标题;当天全库同类不一致 24 处,
//   其中 hinton-mitimes-2026 的 ep 标题甚至是另一场医学活动。
//   根因已在 build_mcp_data.js 的 3c 步回写修掉,这道门禁是防它再漂回去的那一层。
//
// 用法: node pipeline/check_index_ep_sync.js   (不一致 → 非零退出)
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const EP=path.join(ROOT,'mcp-data','ep');
const eps=JSON.parse(fs.readFileSync(path.join(ROOT,'mcp-data','index.json'),'utf8')).episodes;
const KEYS=['pid','podEn','podZh','date','tEn','tZh'];
const bad=[],missing=[],hollow=[];
eps.forEach(e=>{
  const f=path.join(EP,e.id+'.json');
  if(!fs.existsSync(f)){missing.push(e.id);return;}
  let d;try{d=JSON.parse(fs.readFileSync(f,'utf8'));}catch(err){bad.push([e.id,'JSON',err.message,'']);return;}
  if(!(d.transcript||[]).length)hollow.push(e.id);          // 空壳集:2026-08 推理模型吃光 max_tokens 那次事故
  KEYS.forEach(k=>{if((e[k]||'')!==(d[k]||''))bad.push([e.id,k,String(e[k]||''),String(d[k]||'')]);});
});
const cut=s=>s.length>64?s.slice(0,64)+'…':s;
if(missing.length){console.error('  ✗ index 里有 '+missing.length+' 期没有 ep 文件:'+missing.slice(0,5).join('、'));}
if(hollow.length){console.error('  ✗ '+hollow.length+' 期 ep 文件没有逐字稿(空壳集):'+hollow.slice(0,5).join('、'));}
if(bad.length){
  console.error('  ✗ index 与 ep 元数据不一致 '+bad.length+' 处(权威源是 app.js,跑 build_mcp_data.js 回写):');
  bad.slice(0,12).forEach(([id,k,a,b])=>console.error(`    ${id} · ${k}\n      index: ${cut(a)}\n      ep   : ${cut(b)}`));
  if(bad.length>12)console.error('    …还有 '+(bad.length-12)+' 处');
}
if(bad.length||missing.length||hollow.length)process.exit(1);
console.log('  index/ep 一致性:'+eps.length+' 期元数据两处一致,逐字稿齐全');
