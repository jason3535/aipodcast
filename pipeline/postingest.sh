#!/bin/zsh
# postingest.sh — 播客站**人工收录**后的收尾唯一入口(cron 的 auto_refresh 内置同等链条,无需此脚本)。
# 用法: pipeline/postingest.sh [新收集id ...]
# 背景:人工 add_episode 后要手敲 9 步(gen_views→…→build_share_pages)+ 三道门禁,
# 2026-08-09 收 Gustav 两期时第一把就栽在 zsh 分词、第二把漏了 POD_INFO 审计——固化于此。
# 任一步非零退出即中止;全绿才准 git commit。需 pipeline/.env(DeepSeek)+ Clash 代理。
set -e
cd "$(dirname "$0")/.."
set -a; . pipeline/.env; set +a
export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:7890}" HTTP_PROXY="${HTTP_PROXY:-http://127.0.0.1:7890}"

ids=("$@")

echo "── 1/11 公司归属(build_person_org,供 Browse 页按公司筛选)"; node pipeline/build_person_org.js
echo "── 2/11 观点演变(gen_views)";        python3 pipeline/gen_views.py | tail -1
echo "── 3/11 议题(gen_topics)";           python3 pipeline/gen_topics.py | tail -1
echo "── 4/11 首页速览(gen_brief)";        python3 pipeline/gen_brief.py | tail -1
echo "── 5/11 章节标题(gen_sectitles)";    python3 pipeline/gen_sectitles.py | tail -1
echo "── 6/11 盘古之白(fix_spacing,必须在分享页之前)"; python3 pipeline/fix_spacing.py | tail -1
echo "── 7/11 术语归一(fix_terms)";        python3 pipeline/fix_terms.py 2>&1 | tail -1
echo "── 8/11 首屏拆分(split_data)";       python3 pipeline/split_data.py | tail -1
echo "── 9/11 MCP 数据(build_mcp_data)";   node pipeline/build_mcp_data.js | tail -1
echo "── 9.5/11 每页分享卡(gen_og_cards,新增的才生成)"; python3 pipeline/gen_og_cards.py --site aipodcast | tail -1
echo "── 10/11 分享页+sitemap(build_share_pages)"; node pipeline/build_share_pages.js | tail -1
python3 pipeline/webp_avatars.py | tail -1
echo "── 10.5/11 站群闭环(互链 map 补全 + 图谱分享页)"
python3 pipeline/build_crosslinks.py --apply | tail -3       # 六站互链只增不删;动了其他仓库会打印提醒
python3 pipeline/graph_share_pages.py --apply | tail -5      # 图谱新节点的 /p+/og 页(2026-08-10 garrytan 404 教训)
python3 pipeline/graph_share_xlinks.py || echo "  ⚠ 图谱分享页互链失败(不阻断)"
python3 pipeline/graph_site_index.py --apply | tail -4       # 四图谱首页「站点地图」人物导航(2026-09-05 前从没更新过,新人物无内链)
python3 pipeline/graph_conn_labels_zh.py --check || echo "  ⚠ 图谱有纯英文未译的关系边标签(跑 graph_conn_labels_zh.py --apply --identity-rest)"

echo "── 10.6/11 RSS(gen_feed)"
# 2026-08-13 发现:这一步脚本一直在,但从没被任何链条调用过,feed.xml 停更了两周半。
# RSS 是国内 Chrome 用户唯一能用的更新通道(浏览器推送要经 FCM,国内不通),不能再漏。
python3 pipeline/gen_feed.py | tail -1
echo "── 10.7/11 更新提醒(push-latest.json + 浏览器推送)"
# 只在传了新收 id 时才真发推送;推送失败不阻断提交(订阅者收不到 ≠ 内容有问题)
python3 pipeline/push_notify.py --site aipodcast --ids "${ids[@]}" || echo "  ⚠ 推送环节失败(不阻断,内容照常可提交)"

echo "── 10.8/11 主动推给搜索引擎(IndexNow)"
# 2026-08-15 查到:六站在 Bing 一条都没被索引 —— 技术准备齐全,但全网无外链,爬虫从没来过。
# IndexNow 不需要任何账号,是唯一能自己捅破这层的办法。Google 不支持,那边仍需人工提交。
if (( ${#ids[@]} )); then
  python3 pipeline/indexnow.py --site aipodcast \
    --urls "${ids[@]/#/https://aipodcast.jasonlin.tech/e/}" || echo "  ⚠ IndexNow 推送失败(不阻断)"
else
  python3 pipeline/indexnow.py --site aipodcast || echo "  ⚠ IndexNow 推送失败(不阻断)"
fi

echo "── 11/11 门禁"
node -e 'new Function(require("fs").readFileSync("app.js","utf8")); console.log("  app.js 语法 OK")'
python3 pipeline/fix_terms.py --check        # 术语残留=非零退出。**不能接 | tail**:管道退出码是 tail 的,门禁会永远通过
# ES 兼容:app.js 直接发给浏览器、不经转译,一个 ES2020+ 语法就会让老引擎在解析阶段
# 整份脚本失败 → SPA 全白而静态页正常(2026-08-15 Kindle 实拍)。node --check 抓不到。
node pipeline/check_es_compat.js app.js
# 嘉宾名误听:自动字幕把冷门姓氏音译错(Carl Pei→Carl Pay、Liam Fedus→Liam Fetus),
# 错得像模像样,肉眼扫标题发现不了。基线已清到 0,再冒出来就是本轮新引入的。
# **不能接 | tail** —— 管道的退出码是 tail 的,门禁会永远"通过"(这坑踩过两次)。
python3 pipeline/check_guest_names.py --check
# index 与 ep 两处元数据一致性:列表页读 index、详情页读 ep/<id>.json,同一集标题存两份。
# build_mcp_data 对 ep 文件「无 ts 就不写」,导致 app.js 上的标题修正只落到 index —— 列表
# 一个标题、点进去另一个(altman-davidsen-2026 挂错标题十天,全库 24 处)。根因已在
# build_mcp_data.js 3c 步回写,这道门禁防它漂回去。**不能接 | tail**:管道退出码是 tail 的。
node pipeline/check_index_ep_sync.js
# 产物抽查:导语/要点这类「被 split_* 移出内联」的内容,有没有在成品里静默丢掉。
# 加代码合回 ep-extra 只是修当下,这道门禁才是防复发的那一层(理由见脚本头注释)。
node pipeline/check_artifacts.js
# 节目登记:每个 podEn 必须在 POD_INFO 里有简介。audit 里本有这条但只是「警告」,
# 且 audit 只审当轮新收 id —— 存量漏网的一直没人发现。2026-08-28 揪出两例,
# 其中「Startup TM」是个中文搬运号,把 2020 年的 Joe Rogan #1470 当成 2026 新访谈收了进来。
# 无登记 = 要么台名写错、要么来源可疑,一律拦住(全库范围,不只本轮)。
node -e '
const fs=require("fs");
const s=fs.readFileSync("app.js","utf8");
const info=JSON.parse(s.match(/const POD_INFO\s*=\s*(\{[\s\S]*?\n\});/)[1]);
const eps=JSON.parse(fs.readFileSync("mcp-data/index.json","utf8")).episodes;
const bad=[...new Set(eps.map(e=>e.podEn))].filter(p=>!(p in info));
if(bad.length){console.error("  ✗ 这些节目没有 POD_INFO 登记:"+bad.map(x=>`「${x}」`).join("、")+
  "\n    → 台名是否与登记键逐字一致?来源是不是搬运号?");process.exit(1);}
console.log("  节目登记:"+new Set(eps.map(e=>e.podEn)).size+" 个节目全部有简介");'
if (( ${#ids[@]} )); then
  node pipeline/audit_completeness.js "${ids[@]}"           # 只审本轮新收(全库有存量损坏)
  echo "  完整性审计 ${#ids[@]} 期通过"
fi

printf "\n"; echo "✅ postingest 全部通过,可以 git add -A && git commit && git push"
