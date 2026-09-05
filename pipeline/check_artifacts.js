#!/usr/bin/env node
/* check_artifacts.js — 门禁:产物里的导语/要点是不是还在。
 *
 * 缘由:app.js 的内联 EPISODES 被 split_* 系列一层层剥薄(逐字稿 → insights/brief →
 * 2026-08-29 起连导语 sEn/sZh 也移进了 data/ep-extra.json)。任何在 split_data **之后**
 * 读内联 EPISODES 的构建脚本,只要忘了先合回 ep-extra,就会产出「少一块内容」的成品 ——
 * 不报错、不为空、看着一切正常。这类事故已经发生过两次:
 *   · 2026-07 静态页核心观点区块空渲染;
 *   · gen_feed.py 的 RSS「要点」因为 brief 早已不在内联里,整整一年一条都没生成过
 *     (2026-08-29 才发现)。
 * 所以不能只在脚本里加合并代码,必须有一道盯**成品**的门禁。
 *
 * 用法: node pipeline/check_artifacts.js   (有问题 exit 1)
 */
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const bad = [];

// 1) 静态页:抽查 12 期,「本期速览」区块必须有中文正文
const EDIR = path.join(ROOT, "e");
const ids = fs.readdirSync(EDIR).filter(d => fs.existsSync(path.join(EDIR, d, "index.html")));
const step = Math.max(1, Math.floor(ids.length / 12));
const sample = ids.filter((_, i) => i % step === 0).slice(0, 12);
let noOverview = sample.filter(id => {
  const h = fs.readFileSync(path.join(EDIR, id, "index.html"), "utf8");
  return !/本期速览[\s\S]{0,200}?<p class="zh">\s*\S/.test(h);
});
if (noOverview.length > sample.length / 3)
  bad.push(`静态页缺「本期速览」正文:抽查 ${sample.length} 期中 ${noOverview.length} 期为空` +
           `(${noOverview.slice(0, 3).join("、")}…)\n    → build_share_pages.js 是不是漏了合回 data/ep-extra.json?`);

// 2) meta description:静态页的 description 不能退化成空
const emptyDesc = sample.filter(id => {
  const h = fs.readFileSync(path.join(EDIR, id, "index.html"), "utf8");
  const m = h.match(/<meta name="description" content="([^"]*)"/);
  return !m || m[1].trim().length < 10;
});
if (emptyDesc.length) bad.push(`静态页 description 为空:${emptyDesc.join("、")}`);

// 3) RSS:30 条里必须有条目带「要点」(来自 brief.tldr)
const feed = fs.readFileSync(path.join(ROOT, "feed.xml"), "utf8");
const items = feed.split("<item>").length - 1;
if (items < 5) bad.push(`feed.xml 只有 ${items} 条`);
else if (!/要点:/.test(feed)) bad.push("feed.xml 一条「要点」都没有 → gen_feed.py 是不是漏了合回 data/ep-extra.json 的 brief?");
const emptyFeedDesc = (feed.match(/<description>\s*<\/description>/g) || []).length;
if (emptyFeedDesc) bad.push(`feed.xml 有 ${emptyFeedDesc} 条空 description`);

// 4) mcp-data:单集 json 必须自带导语(单集页的 meta description 靠它回填)
const EP = path.join(ROOT, "mcp-data", "ep");
const mIds = fs.readdirSync(EP).filter(f => f.endsWith(".json"));
const mSample = mIds.filter((_, i) => i % Math.max(1, Math.floor(mIds.length / 12)) === 0).slice(0, 12);
const noS = mSample.filter(f => {
  const d = JSON.parse(fs.readFileSync(path.join(EP, f), "utf8"));
  return !(d.sZh || d.sEn);
});
if (noS.length) bad.push(`mcp-data/ep 缺导语:${noS.join("、")} → build_mcp_data.js 漏了合回 ep-extra?`);

// 5) 首页大卡片要用的导语必须还在内联(vHome 是同步渲染,等不到异步数据)
const app = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const eps = JSON.parse(app.match(/const EPISODES = (\[[\s\S]*?\]);\n\n\/\* ====== REAL/)[1]);
const feat = eps.slice().sort((a, b) =>
  (b.addedAt || "").localeCompare(a.addedAt || "") || (b.date || "").localeCompare(a.date || ""))[0];
if (!(feat && feat.sZh)) bad.push(`首页大卡片这一期(${feat && feat.id})的导语没留在内联 → split_data.py 的 FEAT_KEEP 口径与 vHome 不一致`);

// 6) 静态页埋点:两条流都得在。read 是唯一能把分布式抓取和真人分开的信号(见 pipeline/beacon.js),
// 掉了不会报错、页面照常渲染,只是从此再也分不清爬虫 —— 正是要门禁盯住的那类静默降级。
const noBeacon = sample.filter(id => {
  const h = fs.readFileSync(path.join(EDIR, id, "index.html"), "utf8");
  return !(/stats\.jasonlin\.tech/.test(h) && /post\('view'\)/.test(h) && /post\('read'\)/.test(h));
});
if (noBeacon.length) bad.push(`静态页埋点缺失或缺 read 流:${noBeacon.slice(0, 3).join("、")} → build_share_pages.js 还在读 pipeline/beacon.js 吗?`);

// 6) index.html 里的 app.js?v=<md5> 必须与 app.js 现况一致。
// build_share_pages(第 10 步)算这个哈希,但它后面的 build_crosslinks --apply 还会再写 app.js;
// 哈希一旦对不上,SW 对 app.js?v= 是 cache-first —— 老访客会被永久钉在旧版本上(sw.js 头注释里
// 写明这是最经典的翻车点)。这里兜住,失败时重跑一次 build_share_pages 即可。
const realHash = require("crypto").createHash("md5").update(app).digest("hex").slice(0, 10);
const idxHash = (fs.readFileSync(path.join(ROOT, "index.html"), "utf8").match(/app\.js\?v=([a-f0-9]+)/) || [])[1];
if (realHash !== idxHash)
  bad.push(`index.html 指向 app.js?v=${idxHash},但 app.js 现在是 ${realHash}` +
           `\n    → 有脚本在 build_share_pages 之后改了 app.js(多半是 build_crosslinks --apply);重跑 node pipeline/build_share_pages.js`);

if (bad.length) { bad.forEach(b => console.error("  ✗ " + b)); process.exit(1); }
console.log(`  产物抽查:静态页 ${sample.length} 期速览/description 完整 | feed ${items} 条含要点 | mcp-data 导语完整 | 首页大卡片导语在位`);

// app.js 版本号门禁(2026-09-05):index.html 里的 app.js?v=<md5> 必须等于当前 app.js 的 md5。
// 否则=改了 app.js 没重建:新内容顶着旧 URL 上线,SW 对带 ?v= 的 app.js 是 cache-first,老用户永远拿不到新版
//(或者反过来,回滚后仍看到旧版)。修法就是跑 build_share_pages.js。
{const crypto=require('crypto');const fs=require('fs');const path=require('path');const ROOT=path.resolve(__dirname,'..');
 const h=crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT,'app.js'),'utf8')).digest('hex').slice(0,10);
 const m=fs.readFileSync(path.join(ROOT,'index.html'),'utf8').match(/app\.js\?v=([a-f0-9]+)/);
 if(!m||m[1]!==h){console.error(`  ✗ index.html 的 app.js?v=${m&&m[1]} ≠ 当前 app.js md5 ${h} —— 改了 app.js 没重建,跑 node pipeline/build_share_pages.js`);process.exit(1);}
 console.log('  app.js 版本号与内容一致('+h+')');}
