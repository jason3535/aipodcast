#!/bin/bash
# launchd 调用的入口:补全 PATH(launchd 环境精简)、加载密钥、运行自动保鲜。
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
[ -f pipeline/.env ] && { set -a; . pipeline/.env; set +a; }
echo "===== $(date) auto_refresh start =====" >> pipeline/auto_refresh.log
python3 pipeline/auto_refresh.py "$@" >> pipeline/auto_refresh.log 2>&1
echo "===== $(date) exit $? =====" >> pipeline/auto_refresh.log
