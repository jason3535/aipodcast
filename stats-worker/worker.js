/**
 * AI Podcast — 匿名访问统计 (Cloudflare Worker + D1)
 * 埋点: POST / {type,path,ref,ua,sid} → 写 D1(无 Cookie / 不存 IP / 无个人信息)。
 *   UV: 优先用客户端 localStorage 里的随机匿名 ID(aid,2026-08-09 起);没有才回落服务端
 *       「每日匿名 hash」= SHA256(盐 + 当天日期 + IP + UA) 前 80bit,只存 hash、永不存 IP。
 *       改因:日哈希含当天日期 → 同一人隔天必换 ID,**跨天/跨周留存在结构上不可测**。
 *       aid 是纯随机数、与任何个人信息无关(比 IP 哈希更保守),仍无 Cookie。
 *   sid: 客户端可选传「同步码的哈希」(仅开启多设备同步者才有);同一人多设备 sid 相同 →
 *        UV 按 coalesce(sid,vid) 去重,多设备算 1 人。存的是哈希而非原始同步码(后者是读写凭证)。
 *   UV = count(distinct coalesce(nullif(sid,''), vid))。
 * 查数: GET /q?token=SECRET&mode=overview|top|ref|sql&days=N[&q=SELECT...] → JSON(供 Claude Code 直接 curl)。
 */
const ALLOW=new Set(['https://aipodcast.jasonlin.tech','https://aipaper.jasonlin.tech',
  // 四图谱 2026-08-10 起共用本 worker,path 前缀 graph-ai:/graph-hw:/graph-inv:/graph-design: 区分
  'https://ai.jasonlin.tech','https://hardware.jasonlin.tech','https://investor.jasonlin.tech','https://design.jasonlin.tech',
  // 个人主页 2026-08-23 接入,path 前缀 home:
  'https://jasonlin.tech','https://www.jasonlin.tech',
  'http://localhost:8000','http://127.0.0.1:8000','http://localhost:8931','http://localhost:8932','null']);
const cors=o=>({'Access-Control-Allow-Origin':ALLOW.has(o)?o:'https://aipodcast.jasonlin.tech',
  'Access-Control-Allow-Methods':'POST, GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'});
const J=(o,s,co)=>new Response(JSON.stringify(o),{status:s,headers:{...co,'Content-Type':'application/json'}});
const DAY=864e5;
// 每日匿名访客 hash:含当天日期→次日失效、跨天不可关联;只返回 hash,IP/UA 不落库。
async function vidOf(env,req){
  const ip=req.headers.get('CF-Connecting-IP')||'';
  const ua=req.headers.get('User-Agent')||'';
  const day=new Date().toISOString().slice(0,10);
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode((env.STATS_TOKEN||'salt')+'|'+day+'|'+ip+'|'+ua));
  return [...new Uint8Array(buf)].slice(0,10).map(x=>x.toString(16).padStart(2,'0')).join('');
}
// ---- RSS 计数代理 ----
// 起因:feed.xml 直接放在 GitHub Pages 上(域名是灰云 DNS-only,Worker route 拦不到),
// 抓取不经过任何可观测的环节 → 订阅者数量在结构上不可知。这里做一层回源代理:
// 读者拿 feed.jasonlin.tech/<site>.xml,worker 回源取真 feed、记一条 type='feed' 再原样返回。
const FEED_SRC={aipodcast:'https://aipodcast.jasonlin.tech/feed.xml',
                aipaper:  'https://aipaper.jasonlin.tech/feed.xml'};
// 站群共用一个 D1,沿用页面埋点的 path 前缀约定(aipodcast 无前缀,其余带前缀)
const FEED_PATH={aipodcast:'/feed.xml',aipaper:'paper:/feed.xml'};
// Feedly/Inoreader 这类聚合器会在 UA 里自报代抓了多少订阅者:
// "Feedly/1.0 (+http://www.feedly.com/fetcher.html; 17 subscribers; ...)"
// 一次抓取 = 背后 N 个真人,不解析出来会把它们低估成 1。
const subsOf=ua=>{const m=/(\d+)\s+subscribers?/i.exec(ua||'');return m?Math.min(parseInt(m[1],10),99999):0;};

export default {
  async fetch(req,env){
    const origin=req.headers.get('Origin')||'',co=cors(origin),url=new URL(req.url);
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers:co});
    // ---- /feed/<site>.xml(stats 域)或 /<site>.xml(feed 域)----
    {
      const m=/^(?:\/feed)?\/(aipodcast|aipaper)\.xml$/.exec(url.pathname);
      if(m&&(req.method==='GET'||req.method==='HEAD')){
        const site=m[1];
        const up=await fetch(FEED_SRC[site],{cf:{cacheTtl:300,cacheEverything:true}});
        if(!up.ok)return new Response('upstream '+up.status,{status:502});
        let xml=await up.text();
        // self 链接指向计数地址,阅读器会自我校正到这个 URL。
        // 注意属性顺序:gen_feed.py 输出的是 href 在前、rel 在后,按 rel...href 写的正则匹配不上。
        xml=xml.replace(/<atom:link\b[^>]*\brel=["']self["'][^>]*\/?>/,
          t=>t.replace(/href=["'][^"']*["']/,'href="'+url.origin+'/'+site+'.xml"'));
        const ua=req.headers.get('User-Agent')||'';
        if(req.method==='GET'&&!/HeadlessChrome|Playwright|puppeteer/i.test(ua)){
          // 一行一次抓取;ref 存聚合器自报的订阅数(没有则 0),ua 存客户端标识前 60 字符便于分辨阅读器
          try{
            const vid=await vidOf(env,req);
            await env.DB.prepare("INSERT INTO events(ts,day,type,path,ref,ua,vid,sid) VALUES(?,date('now'),'feed',?,?,?,?,'')")
              .bind(Date.now(),FEED_PATH[site],''+subsOf(ua),ua.slice(0,60),vid).run();
          }catch(_){}
        }
        return new Response(req.method==='HEAD'?null:xml,{headers:{
          'Content-Type':'application/rss+xml; charset=utf-8',
          'Cache-Control':'public, max-age=900',
          'Access-Control-Allow-Origin':'*'}});
      }
    }
    // ---- 查询(token 保护)----
    if(req.method==='GET'&&url.pathname==='/q'){
      if(url.searchParams.get('token')!==env.STATS_TOKEN)return J({error:'unauthorized'},401,co);
      const days=Math.min(parseInt(url.searchParams.get('days')||'7',10)||7,365),since=Date.now()-days*DAY;
      const mode=url.searchParams.get('mode')||'overview';
      try{
        if(mode==='overview'){
          const one=async(s,...a)=>(await env.DB.prepare(s).bind(...a).first());
          const all=async(s,...a)=>(await env.DB.prepare(s).bind(...a).all()).results;
          return J({
            totalViews:(await one("SELECT count(*) c FROM events WHERE type='view'")).c,
            viewsToday:(await one("SELECT count(*) c FROM events WHERE type='view' AND day=date('now')")).c,
            views_range:(await one("SELECT count(*) c FROM events WHERE type='view' AND ts>=?",since)).c,
            uvToday:(await one("SELECT count(distinct coalesce(nullif(sid,''),vid)) c FROM events WHERE type='view' AND day=date('now') AND (vid<>'' OR sid<>'')")).c,
            uv_rangeVisitorDays:(await one("SELECT count(distinct coalesce(nullif(sid,''),vid)) c FROM events WHERE type='view' AND ts>=? AND (vid<>'' OR sid<>'')",since)).c,
            days, byDay:await all("SELECT day,count(*) c,count(distinct coalesce(nullif(sid,''),vid)) uv FROM events WHERE type='view' AND ts>=? GROUP BY day ORDER BY day",since),
            byEvent:await all("SELECT type,count(*) c FROM events WHERE ts>=? GROUP BY type ORDER BY c DESC",since),
            byDevice:await all("SELECT ua,count(*) c FROM events WHERE type='view' AND ts>=? GROUP BY ua",since)
          },200,co);
        }
        if(mode==='top')return J({days,top:await(await env.DB.prepare("SELECT path,count(*) c FROM events WHERE type='view' AND ts>=? GROUP BY path ORDER BY c DESC LIMIT 30").bind(since).all()).results},200,co);
        if(mode==='ref')return J({days,referrers:await(await env.DB.prepare("SELECT ref,count(*) c FROM events WHERE type='view' AND ts>=? AND ref<>'' GROUP BY ref ORDER BY c DESC LIMIT 30").bind(since).all()).results},200,co);
        if(mode==='sql'){let q=(url.searchParams.get('q')||'').trim();
          if(!/^select\s/i.test(q)||/;/.test(q.replace(/;\s*$/,'')))return J({error:'仅允许单条 SELECT'},400,co);
          if(!/\blimit\b/i.test(q))q+=' LIMIT 200';
          return J({rows:(await env.DB.prepare(q).all()).results},200,co);}
        return J({error:'unknown mode'},400,co);
      }catch(e){return J({error:''+(e&&e.message||e)},500,co);}
    }
    // ---- 自助找回:按自己的 sid(同步码哈希,不可猜)查自己的单集浏览史;只返回 day+episode id ----
    if(req.method==='GET'&&url.pathname==='/my'){
      const sid=(url.searchParams.get('sid')||'').trim();
      if(!/^[0-9a-f]{12,40}$/.test(sid))return J({error:'bad sid'},400,co);
      try{
        const rows=(await env.DB.prepare("SELECT day,path FROM events WHERE sid=? AND type='view' AND path LIKE '/episode/%' GROUP BY day,path ORDER BY day").bind(sid).all()).results;
        const days={};rows.forEach(r=>{(days[r.day]=days[r.day]||[]).push(r.path.slice(9));});
        return J({days},200,co);
      }catch(e){return J({error:''+(e&&e.message||e)},500,co);}
    }
    // ---- 埋点 ----
    if(req.method==='POST'){
      if(origin&&!ALLOW.has(origin))return new Response('forbidden',{status:403,headers:co});
      // 无头浏览器/爬虫直接丢弃:部署后的 Playwright 线上验证每次都是新指纹,
      // 一次验证 = 好几个假 UV,已实际污染过 8/7 的数据。返回 ok 让前端无感。
      const rawUA=req.headers.get('user-agent')||'';
      if(/HeadlessChrome|Playwright|puppeteer|bot|spider|crawl/i.test(rawUA))return J({ok:1},200,co);
      let b;try{b=await req.json();}catch{return new Response('bad json',{status:400,headers:co});}
      const type=(''+(b.type||'view')).slice(0,16),path=(''+(b.path||'/')).slice(0,200),
            ref=(''+(b.ref||'')).slice(0,120),ua=(''+(b.ua||'')).slice(0,12),
            sid=/^[0-9a-f]{1,16}$/.test(''+(b.sid||''))?b.sid:'',   // 只接受同步码哈希(hex),防注入
            aid=/^[0-9a-f]{8,40}$/.test(''+(b.aid||''))?b.aid:'';     // 客户端 localStorage 随机匿名 ID
      // vid 优先用客户端持久匿名 ID:服务端日哈希含当天日期,同一人隔天必换 → 跨天留存不可测。
      // 拿不到 aid(旧版前端/禁用 localStorage)才回落日哈希,行为与改动前一致。
      let vid=aid;
      if(!vid){try{vid=await vidOf(env,req);}catch(_){}}
      try{await env.DB.prepare("INSERT INTO events(ts,day,type,path,ref,ua,vid,sid) VALUES(?,date('now'),?,?,?,?,?,?)").bind(Date.now(),type,path,ref,ua,vid,sid).run();}catch(_){}
      return new Response(null,{status:204,headers:co});
    }
    return new Response('AI Podcast stats worker',{headers:co});
  }
};
