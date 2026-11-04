#!/bin/bash
# 装推送前门禁:把 pipeline/hooks/pre-push 软链到本仓库 .git/hooks/pre-push(两站同一份)。
# 钩子只对当前这份克隆生效 —— 跑自动保鲜的个人 Mac 不装就不受影响(那边无人值守,拦下会让保鲜停摆)。
cd "$(git rev-parse --show-toplevel)" || exit 1
chmod +x pipeline/hooks/pre-push pipeline/gate_prepush.sh pipeline/verify_site.js
dst=.git/hooks/pre-push
if [ -e "$dst" ] && [ ! -L "$dst" ]; then mv "$dst" "$dst.bak.$(date +%Y%m%d%H%M%S)"; echo "已把原有 pre-push 备份为 $dst.bak.*"; fi
ln -sf ../../pipeline/hooks/pre-push "$dst"
echo "✓ 已安装 $dst → pipeline/hooks/pre-push"
echo "  绕过:SKIP_SITE_GATE=1 git push   或   git push --no-verify"
