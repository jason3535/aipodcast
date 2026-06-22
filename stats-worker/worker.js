/**
 * AI Podcast — 匿名访问统计 (Cloudflare Worker + D1)
 * 埋点: POST / {type,path,ref,ua} → 写 D1(无 Cookie / 不存 IP / 无个人信息)。
 * 查数: GET /q?token=SECRET&mode=overview|top|ref|sql&days=N[&q=SELECT...] → JSON(供 Claude Code 直接 curl)。
 */
const ALLOW=new Set(['https://aipodcast.jasonlin.tech','http://localhost:8000','http://127.0.0.1:8000','null']);
const cors=o=>({'Access-Control-Allow-Origin':ALLOW.has(o)?o:'https://aipodcast.jasonlin.tech',
  'Access-Control-Allow-Methods':'POST, GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'});
const J=(o,s,co)=>new Response(JSON.stringify(o),{status:s,headers:{...co,'Content-Type':'application/json'}});
const DAY=864e5;
export default {
  async fetch(req,env){
    const origin=req.headers.get('Origin')||'',co=cors(origin),url=new URL(req.url);
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers:co});
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
            days, byDay:await all("SELECT day,count(*) c FROM events WHERE type='view' AND ts>=? GROUP BY day ORDER BY day",since),
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
    // ---- 埋点 ----
    if(req.method==='POST'){
      if(origin&&!ALLOW.has(origin))return new Response('forbidden',{status:403,headers:co});
      let b;try{b=await req.json();}catch{return new Response('bad json',{status:400,headers:co});}
      const type=(''+(b.type||'view')).slice(0,16),path=(''+(b.path||'/')).slice(0,200),
            ref=(''+(b.ref||'')).slice(0,120),ua=(''+(b.ua||'')).slice(0,12);
      try{await env.DB.prepare("INSERT INTO events(ts,day,type,path,ref,ua) VALUES(?,date('now'),?,?,?,?)").bind(Date.now(),type,path,ref,ua).run();}catch(_){}
      return new Response(null,{status:204,headers:co});
    }
    return new Response('AI Podcast stats worker',{headers:co});
  }
};
