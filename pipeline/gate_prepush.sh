#!/bin/bash
# gate_prepush.sh — 推送前站点门禁(两站同一份:aipaper / aipodcast;改一处同步另一处)。
# 由 .git/hooks/pre-push 调用(装法:pipeline/install_hooks.sh),也可以手动跑:
#   git diff --name-only origin/master | pipeline/gate_prepush.sh
# stdin = 本次推送改到的文件列表。从中挑出改到的篇目 → verify_site.js(详情页 + 飞书卡片),
# 播客站再跑 check_transcript.py(专有名词/碎章节/说话人)。有 ✗ 就非零退出,git 会拒绝推送。
#
# 临时绕过(确认问题可以先上线时):
#   SKIP_SITE_GATE=1 git push      只跳过这道门禁,会打印一行提示
#   git push --no-verify           跳过所有 pre-push 钩子
# 只抽查:一次改到 >12 篇(全库批处理,如 fix_spacing)时只验最新的 12 篇,其余不验 —— 抽样而不是逐篇看。
set -u
cd "$(git rev-parse --show-toplevel)" || exit 2
SITE=$(cat CNAME)
MAX=12
files=$(cat)

case "$SITE" in
  aipaper.jasonlin.tech)
    ids=$(printf '%s\n' "$files" | sed -nE 's#^data/([^/]+)\.json$#\1#p; s#^p/([^/]+)/.*#\1#p; s#^assets/paperfigs/([^/]+)/.*#\1#p; s#^og/p/([^/]+)\.jpg$#\1#p')
    INDEX='require("./data/index.json").papers.map(p=>p.id)'
    CANARY="deepseek-super-agent anthropic-s1-2026"   # 有图/列表/表格(X 长文) + 招股书大表
    ;;
  aipodcast.jasonlin.tech)
    ids=$(printf '%s\n' "$files" | sed -nE 's#^mcp-data/ep/([^/]+)\.json$#\1#p; s#^e/([^/]+)/.*#\1#p; s#^og/e/([^/]+)\.jpg$#\1#p')
    INDEX='require("./mcp-data/index.json").episodes.map(e=>e.id)'
    CANARY=""
    ;;
  *) echo "✗ gate_prepush: 不认识的站点 $SITE"; exit 2;;
esac

# 改到全站共用的东西(前端/分享页生成器/门禁自身)→ 抽最近 3 篇 + 固定样本做冒烟
smoke=""
if printf '%s\n' "$files" | grep -qE '^(app\.js|index\.html|404\.html|sw\.js|pipeline/(build_share_pages|verify_site)\.js)$'; then
  smoke=$(node -e "console.log(($INDEX).slice(0,3).join(' '))")" $CANARY"
fi

# 只留真实存在的篇目,按收录新旧排序(index 里新的在前)
known=$(node -e "
const all=$INDEX, want=new Set(process.argv.slice(1));
console.log(all.filter(i=>want.has(i)).join(' '));" $ids)
n=$(echo $known | wc -w | tr -d ' ')
pick=$(echo $known | tr ' ' '\n' | head -$MAX | tr '\n' ' ')
targets=$(echo $pick $smoke | tr ' ' '\n' | awk 'NF&&!s[$0]++' | tr '\n' ' ')

if [ -z "${targets// /}" ]; then
  echo "── 站点门禁:本次推送没改到页面,跳过"
  exit 0
fi
echo "── 站点门禁($SITE):改到 $n 篇,验证 $(echo $targets | wc -w | tr -d ' ') 篇${smoke:+(含冒烟样本)}"
[ "$n" -gt "$MAX" ] && echo "   改到的篇目超过 $MAX 篇,只抽最新 $MAX 篇"

fail=0
# 冒烟样本走 --smoke:只看前端/分享页回归,不让它们自带的旧内容问题(中文空段等)卡住无关的推送
smokecsv=$(echo $smoke | tr ' ' ','); [ -z "$smokecsv" ] && smokecsv=","
node pipeline/verify_site.js --quiet --smoke "$smokecsv" $pick || fail=1
if [ -f pipeline/check_transcript.py ] && [ -n "${pick// /}" ]; then
  python3 pipeline/check_transcript.py --check --quiet $pick || fail=1
fi

if [ $fail -ne 0 ]; then
  cat <<'EOF'

✗ 站点门禁没通过,推送已拦下。修好后重新 git push。
  截图和明细:pipeline/.verify/(report.json、shots/<id>.png)
  确认要先上线:SKIP_SITE_GATE=1 git push   (或 git push --no-verify 跳过所有钩子)
EOF
  exit 1
fi
echo "✓ 站点门禁通过"
