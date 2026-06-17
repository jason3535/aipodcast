// 为每期生成静态预渲染分享页 e/<id>/index.html(带该期 OG 元标签 + 跳回 SPA),
// 让微信/社交分享链接预览显示「该期标题/导语」而非千篇一律的首页卡片。另出 sitemap.xml。
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..'),SITE='https://aipodcast.jasonlin.tech';
const h=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const EPISODES=JSON.parse(h.match(/const EPISODES = (\[[\s\S]*?\]);\n\n\/\* ====== REAL/)[1]);
const PEOPLE=eval('('+h.match(/const PEOPLE = (\{[\s\S]*?\n\});/)[1]+')');
const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const EDIR=path.join(ROOT,'e');fs.rmSync(EDIR,{recursive:true,force:true});fs.mkdirSync(EDIR,{recursive:true});
let n=0;
EPISODES.forEach(e=>{
  const p=PEOPLE[e.pid]||{};
  const title=`${esc(e.tZh||e.tEn)} · ${esc(p.zh||'')} — AI Podcast`;
  const kp=(e.insights&&e.insights.consensus&&e.insights.consensus[0])?'｜核心观点：'+esc(e.insights.consensus[0].zh||''):'';
  const desc=esc((e.sZh||e.sEn||'')+'')+kp;
  const hash=`${SITE}/#/episode/${e.id}`;
  const url=`${SITE}/e/${e.id}/`;
  const html=`<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="AI Podcast · AI 播客">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${SITE}/assets/og.png">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${SITE}/assets/og.png">
<link rel="canonical" href="${hash}">
<meta http-equiv="refresh" content="0;url=${hash}">
<script>location.replace(${JSON.stringify(hash)});</script>
<style>body{font-family:-apple-system,system-ui,"PingFang SC",sans-serif;background:#fff;color:#1d1d1f;display:grid;place-items:center;height:100vh;margin:0}a{color:#0071e3}</style>
</head><body><p>正在前往《${esc(e.tZh||e.tEn)}》…&nbsp;<a href="${hash}">未跳转?点此进入</a></p></body></html>`;
  fs.mkdirSync(path.join(EDIR,e.id),{recursive:true});
  fs.writeFileSync(path.join(EDIR,e.id,'index.html'),html);
  n++;
});
// sitemap.xml(首页 + 议题 + 各期分享页)
const urls=[`${SITE}/`,`${SITE}/#/topics`,...EPISODES.map(e=>`${SITE}/e/${e.id}/`)];
fs.writeFileSync(path.join(ROOT,'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`+
  urls.map(u=>`  <url><loc>${u}</loc></url>`).join('\n')+`\n</urlset>\n`);
console.log('生成分享页',n,'个 (e/<id>/index.html) + sitemap.xml',urls.length,'条');
