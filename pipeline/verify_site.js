#!/usr/bin/env node
/* verify_site.js — 详情页 + 分享卡验证(两站同一份:aipaper / aipodcast,按 CNAME 自动识别站点;改一处同步另一处)。
 *
 * 为什么有它:2026-11-02 一天里三个问题全是 Jason 读出来/截图才发现的 ——
 *   ①飞书卡片显示成站点首页(分享页 JS 跳转,飞书跟着跳去抓首页)②有序列表全显示成「1.」
 *   ③(播客)转写里 pstack 被听成 P Sack、整节只剩一句「Yeah, go for it.」。
 *   人当检查员 = 人是瓶颈。这个脚本把「打开页面看一眼」变成可重复的检查,配合 pre-push 门禁。
 *
 * 检查项(✗ = 错误,门禁拦;⚠ = 提示,不拦):
 *   数据层  :分享页 og:title 是本篇标题(不是首页)、og:image 文件在且尺寸够;正文图文件在;
 *            有序列表中英序号一致;表格段中英都是表格、行数一致
 *   浏览器层:本地起静态服务 + Playwright 打开 SPA 详情页 —— 无 JS 异常;章节/段落/转写轮数与数据一致;
 *            有序列表显示的序号 = 原文序号;图全部加载;表格渲染;点图出大图、Esc 关掉;存一张截图
 *   飞书模拟:①不跑 JS 读分享页原始 OG ②跑 JS(普通浏览器 UA)打开分享页,等它跳/接管完,
 *            看最终 URL 和最终 DOM 的 og:title/og:image 还是不是本篇(飞书会跟随 JS 跳转,见 memory)
 *
 * 用法:
 *   node pipeline/verify_site.js <id> [id...]      指定篇目
 *   node pipeline/verify_site.js --recent 5        最近收录的 5 篇
 *   node pipeline/verify_site.js --all --jobs 6    全库(慢,几分钟)
 *   --no-browser 只跑数据层(秒级)   --quiet 只打印有问题的篇目
 *   --smoke a,b 冒烟样本:只看前端/分享页回归,不看这几篇自身的内容问题(门禁改到 app.js 等全站文件时用)
 *   --net 额外用 curl 探测远程正文图(figs.jasonlin.tech / ar5iv 等)是否还能打开;默认不联网
 *   截图与 JSON 报告写到 pipeline/.verify/(已 gitignore)。有 ✗ 则退出码 1。
 * 依赖:Playwright(全局 npm i -g playwright 即可,脚本会去 npm root -g 找;浏览器用 ~/Library/Caches/ms-playwright)。
 * 本地验证会拦掉所有非本机请求(统计埋点、CDN、字体),不会污染线上 UV。
 */
const fs=require('fs'),path=require('path'),http=require('http');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(ROOT,'pipeline','.verify');
const args=process.argv.slice(2);
const flag=k=>args.includes(k);
const opt=(k,d)=>{const i=args.indexOf(k);return i>=0&&args[i+1]?args[i+1]:d;};
const CNAME=fs.readFileSync(path.join(ROOT,'CNAME'),'utf8').trim();

// ── 站点差异 ──────────────────────────────────────────────
const SITES={
  'aipaper.jasonlin.tech':{
    kind:'paper',
    ids:()=>JSON.parse(fs.readFileSync(path.join(ROOT,'data/index.json'),'utf8')).papers.map(p=>p.id),
    data:id=>path.join(ROOT,'data',id+'.json'),
    route:id=>'/#/paper/'+id,
    share:id=>'/p/'+id+'/',
    larkFollow:'E',   // /p/ 已改原地接管(1ee1143a),再出现跳转就是回归
  },
  'aipodcast.jasonlin.tech':{
    kind:'podcast',
    ids:()=>JSON.parse(fs.readFileSync(path.join(ROOT,'mcp-data/index.json'),'utf8')).episodes.map(e=>e.id),
    data:id=>path.join(ROOT,'mcp-data/ep',id+'.json'),
    route:id=>'/#/episode/'+id,
    share:id=>'/e/'+id+'/',
    // /e/ 仍是 location.replace 跳转(aipaper 的原地接管还没移植,待 Jason 决定)→ 飞书跟跳拿到首页卡。
    // 已知问题先记 ⚠ 不拦;移植后改成 'E'。
    larkFollow:'W',
  },
};
const S=SITES[CNAME];
if(!S){console.error('✗ 不认识的站点 CNAME: '+CNAME);process.exit(2);}
const OWN_IMG=/^https:\/\/figs\.jasonlin\.tech\//;   // 站点自己的图床(R2),不算外链
const PIXEL=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAMgAAABkCAIAAABM5OhcAAAAWklEQVR42u3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBrDRIAAWtMnPgAAAAASUVORK5CYII=','base64');
const HOME_OG=(fs.readFileSync(path.join(ROOT,'index.html'),'utf8').match(/<meta property="og:title" content="([^"]*)"/)||[])[1]||'';

// ── 小工具 ──────────────────────────────────────────────
const meta=(html,prop)=>{const m=html.match(new RegExp('<meta property="'+prop.replace(/:/g,'\\:')+'" content="([^"]*)"'));return m?m[1].replace(/&amp;/g,'&').replace(/&quot;/g,'"'):'';};
const localOf=u=>{if(!u)return '';const m=String(u).match(/^https?:\/\/[^/]+(\/.*)$/);const p=m?m[1]:u;return path.join(ROOT,decodeURIComponent(p.split('?')[0]));};
function imgInfo(f){
  let b;try{b=fs.readFileSync(f);}catch(_){return null;}
  if(b[0]===0x89&&b[1]===0x50)return {type:'png',w:b.readUInt32BE(16),h:b.readUInt32BE(20),size:b.length};
  if(b[0]===0xFF&&b[1]===0xD8){let i=2;while(i+9<b.length){if(b[i]!==0xFF){i++;continue;}const m=b[i+1];
      if(m>=0xC0&&m<=0xCF&&m!==0xC4&&m!==0xC8&&m!==0xCC)return {type:'jpeg',h:b.readUInt16BE(i+5),w:b.readUInt16BE(i+7),size:b.length};
      i+=2+b.readUInt16BE(i+2);}return {type:'jpeg',size:b.length};}
  if(b.slice(0,4).toString()==='RIFF')return {type:'webp',size:b.length};
  return {type:'?',size:b.length};
}
// 复刻 app.js mdHtml 的列表切分:连续编号行成一个 <ol>(带 start),空行/普通行/无序项都会断开
function olRuns(md){
  const s=String(md||'').replace(/```[a-zA-Z]*\n?[\s\S]*?```/g,'\n');
  const runs=[];let cur=null;
  for(const line of s.split('\n')){const m=line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if(m){if(!cur){cur={start:+m[1],nums:[]};runs.push(cur);}cur.nums.push(+m[1]);continue;}
    cur=null;}
  return runs;
}
// 中英序号一致性用:中文常写全角「1）」「1．」,前端不当列表渲染,但读者看到的编号是一样的,不算不一致
// 半角要求后跟空白(「3.4 [__]」是条款号不是编号)
function numSeq(md){return String(md||'').split('\n').map(l=>(l.match(/^\s*(\d+)(?:[.)]\s|\s*[．）、])/)||[])[1]).filter(Boolean).join(',');}
const isTbl=t=>{if(!t||t.indexOf(' · ')<0)return false;const ls=String(t).split('\n');return ls.length>1||ls[0].split(' · ').length>=3;};
const seqStr=r=>r.nums.join(',');

// ── 数据层检查(不开浏览器)────────────────────────────────
function checkData(id,R){
  let d;try{d=JSON.parse(fs.readFileSync(S.data(id),'utf8'));}catch(e){R.E('data','数据文件读不了: '+e.message);return null;}
  const title=d.tZh||d.tEn||'';
  // 分享页 OG(飞书不跑 JS 时看到的就是这个)
  const sf=path.join(ROOT,S.share(id),'index.html');
  let raw='';try{raw=fs.readFileSync(sf,'utf8');}catch(_){R.E('share','分享页不存在: '+path.relative(ROOT,sf));}
  if(raw){
    const t=meta(raw,'og:title'),img=meta(raw,'og:image');
    if(!t)R.E('og','分享页没有 og:title');
    else if(t===HOME_OG)R.E('og','分享页 og:title 是站点首页标题');
    else if(title&&!t.startsWith(title.slice(0,12)))R.E('og',`og:title「${t.slice(0,40)}」不是本篇标题「${title.slice(0,30)}」`);
    if(!meta(raw,'og:description'))R.W('og','分享页没有 og:description');
    if(!img)R.E('og','分享页没有 og:image');
    else{const inf=imgInfo(localOf(img));
      if(!inf)R.E('og','og:image 文件不存在: '+path.relative(ROOT,localOf(img)));
      else if(inf.size<5000)R.E('og',`og:image 只有 ${inf.size} 字节,疑似空图`);
      else if(inf.w&&(inf.w<600||inf.h<300))R.W('og',`og:image 尺寸 ${inf.w}×${inf.h},飞书大卡要 ≥600×300`);}
  }
  const exp={secs:0,paras:[],figs:[],remote:[],tbls:0,turns:0,title};
  if(S.kind==='paper'){
    const secs=(d.full||[]).filter(s=>!/^abstract$/i.test(s.sec));
    exp.secs=secs.length;
    secs.forEach((s,si)=>{
      const items=s.items||(s.paras||[]).map(p=>({t:'para',en:p.en,zh:p.zh}));
      let prevSingle=null;   // 段段各自只有一条编号时(翻译按段切),看相邻段序号是否接得上
      items.forEach(it=>{
        if(it.t==='fig'){exp.figs.push(it.src);
          if(/^https?:/.test(it.src||'')){exp.remote.push({sec:si+1,src:it.src});   // 远程图:浏览器层用占位图,--net 时再逐个探测
            if(!OWN_IMG.test(it.src))R.W('fig-src',`第 ${si+1} 章引用第三方图床(可能失效): ${String(it.src).slice(0,70)}`);}
          else{const inf=imgInfo(path.join(ROOT,it.src||''));
            if(!inf)R.E('fig-src',`第 ${si+1} 章的图文件不存在: ${it.src}`);
            // 2026-11-04 全库扫出 207 个 .png 其实是下载到的 HTML 错误页:有 origSrc 时前端会退回原站外链,没有就整张图被藏掉
            else if(inf.type==='?')(it.origSrc?R.W:R.E)('fig-src',`第 ${si+1} 章的图文件不是图片(多半是下载到了 HTML 错误页): ${it.src}`+(it.origSrc?',页面会退回原站外链':''));}
          prevSingle=null;return;}
        if(it.t==='eq'){prevSingle=null;return;}
        const k=exp.paras.length,where=`第 ${si+1} 章第 ${k+1} 段`;
        if((it.en||'').trim()&&!(it.zh||'').trim())R.E('zh-src',where+':中文译文是空的');
        if(isTbl(it.en)){exp.tbls++;exp.paras.push({tbl:true,en:[],zh:[]});
          if(/\\[[(]/.test(it.en))R.E('tbl-src',where+':含公式的段落被前端当成了表格(公式里的「 · 」乘号),页面显示错乱');
          else if(!isTbl(it.zh))R.E('tbl-src',where+':英文是表格、中文不是(中文会糊成一段)');
          else{const a=String(it.en).split('\n').length,b=String(it.zh).split('\n').length;if(a!==b)R.W('tbl-src',`${where}:表格行数中英不一致(${a} vs ${b})`);}
          prevSingle=null;return;}
        const en=olRuns(it.en),zh=olRuns(it.zh);
        exp.paras.push({en,zh});
        if((it.zh||'').trim()&&numSeq(it.en)!==numSeq(it.zh))
          R.E('list-src',`${where}:中英编号不一致(英 ${numSeq(it.en)||'无'} / 中 ${numSeq(it.zh)||'无'})`);
        for(const r of en)if(r.nums.some((n,i)=>n!==r.start+i))R.W('list-src',`${where}:原文序号 ${seqStr(r)} 不连续,页面会显示成 ${r.start}…`);
        if(en.length===1&&en[0].nums.length===1&&/^\s*\d+[.)]\s/.test(it.en)){
          const n=en[0].start;
          // 只报同一个号连着出现(1. 1. 1.):重新从 1 开始的新列表是正常的,全库报 270 处全是这种
          if(prevSingle!==null&&n===prevSingle)R.W('list-src',`${where}:和上一段都是「${n}.」,序号疑似丢了`);
          prevSingle=n;
          if(/^\s*\d+[.)]\s+\*\*/.test(it.en)&&!/^\s*\d+[.)]\s+\*\*/.test(it.zh||''))R.W('list-src',`${where}:英文列表项有粗体标签,中文丢了`);
        }else prevSingle=null;
      });
    });
  }else{
    const ts=d.transcript||[];
    exp.secs=ts.length;exp.turns=ts.reduce((n,s)=>n+(s.turns||[]).length,0);
  }
  return exp;
}

// ── 本地静态服务 ────────────────────────────────────────
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain','.ico':'image/x-icon','.woff2':'font/woff2'};
function serve(){return new Promise(res=>{
  const srv=http.createServer((q,rs)=>{
    let u;try{u=decodeURIComponent(q.url.split('?')[0].split('#')[0]);}catch(_){u=q.url;}
    let f=path.join(ROOT,u);if(!f.startsWith(ROOT)){rs.writeHead(403);return rs.end();}
    try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');}catch(_){}
    fs.readFile(f,(e,b)=>{if(e){rs.writeHead(404,{'content-type':'text/plain'});return rs.end('404');}
      rs.writeHead(200,{'content-type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});rs.end(b);});
  });
  srv.listen(0,'127.0.0.1',()=>res(srv));});}

function loadPW(){
  try{return require('playwright');}catch(_){}
  try{const g=require('child_process').execSync('npm root -g',{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();return require(path.join(g,'playwright'));}catch(_){}
  return null;
}
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
function localFile(p){
  let f=path.join(ROOT,decodeURIComponent(p));if(!f.startsWith(ROOT))return null;
  try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');return {body:fs.readFileSync(f),type:MIME[path.extname(f).toLowerCase()]||'application/octet-stream'};}catch(_){return null;}
}
async function newCtx(browser,base){
  const ctx=await browser.newContext({viewport:{width:1280,height:900},userAgent:UA,serviceWorkers:'block'});
  const prod='https://'+CNAME;
  await ctx.route('**/*',r=>{const u=r.request().url();
    if(u.startsWith(base))return r.continue();
    // 分享页跳转写的是线上绝对地址:同域请求就地用本仓库文件应答,模拟「跟着跳过去」又不碰线上
    if(u.startsWith(prod+'/')||u===prod){const f=localFile(new URL(u).pathname);return f?r.fulfill({status:200,contentType:f.type,body:f.body}):r.fulfill({status:404,body:'404'});}
    // 远程正文图换成占位图:断网也能测排版和点图放大;远程图本身是否还活着交给 --net
    if(r.request().resourceType()==='image')return r.fulfill({status:200,contentType:'image/png',body:PIXEL});
    return r.abort();});  // 其余外网一律断:埋点/CDN/字体
  return ctx;
}

// ── 浏览器层:SPA 详情页 ──────────────────────────────────
async function checkPage(ctx,base,id,exp,R){
  const pg=await ctx.newPage();const errs=[];
  pg.on('pageerror',e=>errs.push(String(e.message||e).slice(0,160)));
  try{
    await pg.goto(base+S.route(id),{waitUntil:'load',timeout:20000});
    const sel=S.kind==='paper'?'.reader .sec-h':'.turn';
    if((S.kind==='paper'?exp.secs:exp.turns)>0){
      try{await pg.waitForSelector(sel,{timeout:15000});}catch(_){R.E('render','15 秒内正文没渲染出来('+sel+')');}
    }
    await pg.waitForTimeout(400);
    if(S.kind==='paper'){
      const dom=await pg.evaluate(()=>{
        const runs=el=>el?[...el.querySelectorAll('ol')].map(o=>({start:o.start,n:o.children.length})):[];
        return {secs:document.querySelectorAll('.reader .sec-h').length,
          paras:[...document.querySelectorAll('.reader .para')].map(p=>({en:runs(p.querySelector(':scope > .en')),zh:runs(p.querySelector(':scope > .zh'))})),
          figs:document.querySelectorAll('.reader figure.pfig').length,
          tbls:document.querySelectorAll('.reader table.ftbl').length,
          h1:(document.querySelector('h1')||{}).textContent||''};
      });
      if(dom.secs!==exp.secs)R.E('render',`章节数:页面 ${dom.secs} / 数据 ${exp.secs}`);
      if(dom.paras.length!==exp.paras.length)R.E('render',`段落数:页面 ${dom.paras.length} / 数据 ${exp.paras.length}`);
      else{let bad=0;
        exp.paras.forEach((p,k)=>{if(p.tbl)return;for(const lang of ['en','zh']){
          const want=p[lang].map(r=>r.start+'×'+r.nums.length).join('|'),got=dom.paras[k][lang].map(o=>o.start+'×'+o.n).join('|');
          if(want!==got&&bad++<3)R.E('list',`第 ${k+1} 段(${lang}):有序列表页面显示「${got||'无'}」,原文是「${want||'无'}」(起始×条数)`);}});
        if(bad>3)R.E('list',`……另有 ${bad-3} 处列表序号不对`);}
      if(dom.figs!==exp.figs.length)R.E('fig',`图数:页面 ${dom.figs} / 数据 ${exp.figs.length}`);
      if(dom.tbls!==exp.tbls*2)R.E('tbl',`表格:页面 ${dom.tbls} 张 / 数据 ${exp.tbls} 段×中英 2`);
      if(dom.figs){
        // 懒加载图强制加载,再看每张是否真出图(onerror 会把 figure 藏起来)
        const broken=await pg.evaluate(async()=>{
          const imgs=[...document.querySelectorAll('.reader figure.pfig img')];
          imgs.forEach(i=>{i.loading='eager';});
          await Promise.race([Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r;}))),new Promise(r=>setTimeout(r,8000))]);
          return imgs.map((i,k)=>({k,ok:i.complete&&i.naturalWidth>0&&i.closest('figure').style.display!=='none',src:i.getAttribute('src')})).filter(x=>!x.ok&&!/^https?:/.test(x.src||''));
        });
        for(const b of broken.slice(0,3))R.E('fig',`第 ${b.k+1} 张图没加载出来: ${b.src}`);
        if(broken.length<dom.figs){
          // 点图出大图(lightbox),Esc 关闭
          const k=await pg.evaluate(()=>[...document.querySelectorAll('.reader figure.pfig img')].findIndex(i=>i.naturalWidth>0));
          const img=pg.locator('.reader figure.pfig img').nth(k);
          await img.scrollIntoViewIfNeeded();await img.click();
          const lb=await pg.waitForSelector('.lbx',{timeout:3000}).then(()=>true,()=>false);
          if(!lb)R.E('lightbox','点图后没有弹出大图');
          else{await pg.keyboard.press('Escape');await pg.waitForTimeout(200);
            if(await pg.$('.lbx'))R.E('lightbox','大图按 Esc 关不掉');}
          await pg.evaluate(()=>window.scrollTo(0,0));
        }
      }
    }else{
      // 整页找(目录很长时标题排在 4000 字之后),且只比字母数字汉字:页面会把半角 ? : 换成全角(jensen-dwarkesh 等曾误报)
      const norm=t=>String(t||'').replace(/[^\p{L}\p{N}]/gu,'');
      const want=norm(exp.title).slice(0,10);
      const dom=await pg.evaluate(w=>({secs:document.querySelectorAll('.sec-h').length,turns:document.querySelectorAll('.turn').length,
        hasTitle:!w||document.body.innerText.replace(/[^\p{L}\p{N}]/gu,'').includes(w)}),want);
      if(dom.secs!==exp.secs)R.E('render',`章节数:页面 ${dom.secs} / 数据 ${exp.secs}`);
      if(dom.turns!==exp.turns)R.E('render',`转写轮数:页面 ${dom.turns} / 数据 ${exp.turns}`);
      if(!dom.hasTitle)R.E('render','页面上找不到本期标题');
    }
    for(const e of [...new Set(errs)].slice(0,3))R.E('js','页面 JS 异常: '+e);
    await pg.screenshot({path:path.join(OUT,'shots',id+'.png')});
  }catch(e){R.E('render','打开详情页失败: '+String(e.message||e).split('\n')[0]);}
  await pg.close();
}

// ── 飞书模拟:跑 JS 打开分享页,看最终落在哪、最终 OG 是什么 ──────────
async function checkLark(ctx,base,id,exp,R){
  const pg=await ctx.newPage();const navs=[];
  // 记真实加载过的文档地址:跳转后前端可能又 replaceState 把地址栏改回 /p/,看 location 会被骗
  pg.on('request',q=>{if(q.isNavigationRequest()&&q.frame()===pg.mainFrame())navs.push(q.url());});
  try{
    await pg.goto(base+S.share(id),{waitUntil:'load',timeout:20000});
    await pg.waitForTimeout(2500);   // 等 location.replace / 原地接管跑完
    const fin=await pg.evaluate(()=>({url:location.pathname+location.search+location.hash,
      t:(document.querySelector('meta[property="og:title"]')||{}).content||'',
      img:(document.querySelector('meta[property="og:image"]')||{}).content||''}));
    // 飞书的实测行为(memory reference_lark_link_preview):跟随 JS 跳转,然后读**目标地址的原始 HTML**
    // (# 后面不发给服务器)。所以跳走了 → 卡片取目标路径静态文件的 OG;没跳(原地接管)→ 取最终 DOM 的 OG。
    const last=new URL(navs[navs.length-1]||base+S.share(id));
    const landed=last.pathname+last.search+last.hash;
    const moved=navs.length>1&&last.pathname!==S.share(id);
    let card=fin;
    if(moved){const f=localFile(last.pathname),h=f?f.body.toString('utf8'):'';card={t:meta(h,'og:title'),img:meta(h,'og:image')};}
    const want=exp.title.slice(0,12);
    const okT=card.t&&card.t!==HOME_OG&&(!want||card.t.startsWith(want));
    const okI=card.img&&fs.existsSync(localOf(card.img));
    if(!okT||!okI){
      const why=`飞书模拟:打开 ${S.share(id)} `+(moved?`被 JS 跳到 ${landed}`:'没跳转但最终 DOM 的 OG 不对')+`,卡片会是「${(card.t||'无标题').slice(0,30)}」`+(okI?'':`、配图 ${card.img||'无'}`);
      (S.larkFollow==='E'?R.E:R.W)('lark',why);
    }
  }catch(e){R.E('lark','打开分享页失败: '+String(e.message||e).split('\n')[0]);}
  await pg.close();
}

// ── 主流程 ──────────────────────────────────────────────
(async()=>{
  const all=S.ids();
  let ids=args.filter((a,i)=>!a.startsWith('--')&&!['--recent','--jobs','--smoke'].includes(args[i-1]));
  if(flag('--all'))ids=all;
  else if(flag('--recent'))ids=[...ids,...all.slice(0,+opt('--recent',5))];
  ids=[...new Set(ids)];
  if(!ids.length&&!opt('--smoke','')){console.error('用法: node pipeline/verify_site.js <id...> | --recent N | --all  [--no-browser] [--jobs N] [--quiet]');process.exit(2);}
  const unknown=ids.filter(i=>!fs.existsSync(S.data(i)));
  fs.mkdirSync(path.join(OUT,'shots'),{recursive:true});
  const results=[];
  const mk=id=>{const r={id,issues:[]};r.E=(c,m)=>r.issues.push({lvl:'E',c,m});r.W=(c,m)=>r.issues.push({lvl:'W',c,m});results.push(r);return r;};
  // --smoke a,b:这些篇只是拿来测前端/分享页有没有回归,它们本来就有的内容问题(*-src:中文空段、图文件坏等)不算
  const explicit=new Set(ids),smoke=new Set(String(opt('--smoke','')).split(',').filter(Boolean).filter(i=>!explicit.has(i)));
  ids=[...ids,...smoke];
  const exps={};
  for(const id of ids){const R=mk(id);if(unknown.includes(id)){R.E('data','没有这篇的数据文件');continue;}exps[id]=checkData(id,R);}
  if(!flag('--no-browser')){
    const pw=loadPW();
    if(!pw){console.error('✗ 找不到 Playwright。装法: npm i -g playwright && npx playwright install chromium\n  (或加 --no-browser 只跑数据层)');process.exit(2);}
    const srv=await serve();const base='http://127.0.0.1:'+srv.address().port;
    const browser=await pw.chromium.launch();
    const jobs=Math.max(1,+opt('--jobs',4));
    const queue=results.filter(r=>exps[r.id]);let done=0;
    const t0=Date.now();
    await Promise.all(Array.from({length:jobs},async()=>{
      const ctx=await newCtx(browser,base);
      while(queue.length){const R=queue.shift();
        await checkPage(ctx,base,R.id,exps[R.id],R);await checkLark(ctx,base,R.id,exps[R.id],R);
        if(++done%50===0)process.stderr.write(`  …${done}/${results.length} (${Math.round((Date.now()-t0)/1000)}s)\n`);}
      await ctx.close();
    }));
    await browser.close();srv.close();
  }
  if(flag('--net')){
    const {execFile}=require('child_process');
    const list=results.flatMap(r=>(exps[r.id]&&exps[r.id].remote||[]).map(x=>({R:r,...x})));
    const probe=u=>new Promise(res=>execFile('curl',['-s','-o','/dev/null','-w','%{http_code}','-L','--max-time','15','-r','0-0',u],{encoding:'utf8'},(e,out)=>res(out||'000')));
    process.stderr.write(`  探测远程图 ${list.length} 张…\n`);
    await Promise.all(Array.from({length:16},async()=>{while(list.length){const x=list.shift();const code=await probe(x.src);
      if(!/^(200|206)$/.test(code))x.R.E('fig-src',`第 ${x.sec} 章远程图打不开(HTTP ${code}): ${x.src.slice(0,80)}`);}}));
  }
  for(const r of results)if(smoke.has(r.id))r.issues=r.issues.filter(i=>!/-src$/.test(i.c));
  // 报告
  let ne=0,nw=0;
  for(const r of results){
    const e=r.issues.filter(i=>i.lvl==='E'),w=r.issues.filter(i=>i.lvl==='W');ne+=e.length;nw+=w.length;
    if(flag('--quiet')&&!r.issues.length)continue;
    console.log(`${e.length?'✗':w.length?'⚠':'✓'} ${r.id}${r.issues.length?'':'  全部通过'}`);
    for(const i of [...e,...w])console.log(`    ${i.lvl==='E'?'✗':'⚠'} [${i.c}] ${i.m}`);
  }
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(results.map(r=>({id:r.id,issues:r.issues})),null,1));
  const bad=results.filter(r=>r.issues.some(i=>i.lvl==='E')).length;
  console.log(`\n${S.kind} 验证 ${results.length} 篇:✗ ${ne} 处(${bad} 篇)  ⚠ ${nw} 处  截图/报告 → pipeline/.verify/`);
  process.exit(ne?1:0);
})();
