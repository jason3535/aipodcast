/* 站群静态页统一埋点片段 —— 由 build_share_pages.js(aipodcast 的 e//pp/)与
 * graph_share_pages.py(四图谱的 /p/)共同读取,占位符 %PATH% 替换成上报路径表达式。
 * 改这一份 = 六站一起改;两边各抄一份就是下一次口径漂移的开始。
 *
 * 【为什么要有停留门槛】
 * 2026-08-22 四图谱一天进来 727 次访问、720 个互不相同的 vid、714 条无 referrer,
 * 把每个 /p/*.html 恰好各扫一次 —— 分布式抓取(住宅代理池/AI 爬虫集群),不是人。
 * vid = SHA256(盐+日期+IP+UA),720 个不同哈希 = 720 个不同 IP+UA 组合,
 * 所以 worker 里那道服务端 UA 正则(HeadlessChrome|Playwright|bot|spider|crawl)拦不住:
 * 它们报的就是正常浏览器 UA。UA 这条路已经走到头了。
 *
 * 唯一还能用的判别信号是**行为**:爬虫抓完就走,不停留、不滚动。
 *
 * 【两条流,不是一条】
 *   type='view' —— 打开即发,口径与 2026-08 之前完全一致。**不要改它**,
 *                  改了历史序列就断了,以后没法跟 8 月之前比。
 *   type='read' —— 可见满 4 秒 或 发生一次真实交互(滚动/点击/按键/触摸)才发。
 *                  这是干净的那条,判断「有没有真人在读」看它。
 * 两条一起存,爬虫占比 = 1 - read/view,随时能算、能回溯。信息一点不丢。
 *
 * 注意:read 会漏掉「真人进来看两眼就走」的快速跳出,这是**故意**的取舍 ——
 * 它衡量的是「有效阅读」,不是「访问次数」。别把 read 和历史 view 直接放一起比。
 *
 * 写法约束:直接发给老引擎(2026-08-15 Kindle 教训),全程 ES5、无可选链、
 * addEventListener 只用布尔 useCapture(老浏览器把 options 对象当 true,once 会失效,
 * 所以 send() 自带幂等锁)。任何一步出错都只是不上报,绝不能影响正文渲染。
 */
<script>(function(){try{
var UA=navigator.userAgent||'';
if(/bot|crawl|spider|slurp|headless|lighthouse|bingpreview|facebookexternalhit/i.test(UA))return;
var U='https://stats.jasonlin.tech',DWELL=4000;
var LS=null;try{LS=window.localStorage}catch(_){}
var aid='';
try{
  aid=(LS&&LS.aid)||'';
  if(!aid){var i,n;
    try{var u=new Uint8Array(10);crypto.getRandomValues(u);
        for(i=0;i<10;i++){n=u[i].toString(16);aid+=n.length<2?'0'+n:n;}}
    catch(_){for(i=0;i<20;i++)aid+=Math.floor(Math.random()*16).toString(16);}
    if(LS)LS.aid=aid;}   /* 与 SPA 共用同一个 aid:先落静态页再点进互动版的人算 1 个 UV */
}catch(_){aid='';}
var sid='';try{if(LS&&LS.syncSidFor&&LS.syncSidFor===LS.syncCode)sid=LS.syncSid||'';}catch(_){}
var ref='';try{ref=(document.referrer||'').replace(/^[a-z]+:\/\//i,'').split('/')[0];}catch(_){}
var dev=/Mobi|Android|iPhone|iPad|iPod/i.test(UA)?'mobile':'desktop';
function post(type){
  try{
    var body=JSON.stringify({type:type,path:%PATH%,ua:dev,ref:ref,sid:sid,aid:aid});
    if(navigator.sendBeacon&&typeof Blob!=='undefined')navigator.sendBeacon(U,new Blob([body],{type:'text/plain'}));
    else{var x=new XMLHttpRequest();x.open('POST',U,true);x.setRequestHeader('Content-Type','text/plain');x.send(body);}
  }catch(_){}
}
post('view');                                  /* 打开即发,口径不变 */
var sent=false,acc=0,since=null,timer=null;    /* 以下是 read:攒够可见时长或等到一次交互 */
function read(){if(sent)return;sent=true;if(timer){clearTimeout(timer);timer=null;}post('read');}
function pause(){if(since!==null){acc+=Date.now()-since;since=null;}if(timer){clearTimeout(timer);timer=null;}}
function resume(){if(sent||since!==null)return;since=Date.now();timer=setTimeout(read,Math.max(0,DWELL-acc));}
function vis(){if(document.visibilityState==='visible')resume();else pause();}
try{document.addEventListener('visibilitychange',vis);}catch(_){}
var evs=['scroll','pointerdown','mousedown','keydown','touchstart'];
for(var k=0;k<evs.length;k++){try{window.addEventListener(evs[k],read,true);}catch(_){}}
vis();
}catch(_){}})()</script>
