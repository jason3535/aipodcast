# AI Podcast(aipodcast.jasonlin.tech)— 仓库须知

双语播客全文站,GitHub Pages 从 master 部署。`app.js` 是 EPISODES/PEOPLE/POD_INFO 等数据的唯一源;单集详情 `mcp-data/ep/<id>.json`,分享页 `e/<id>/`、`pp/<pid>/` 为生成物。

## 收录与收尾
- 人工收录:`pipeline/add_episode.py` → `pipeline/postingest.sh <新收id...>`(11 步重建 + 门禁,全绿才 commit)。流程见 `/aipodcast-add-person` skill,加人物必须做图谱关联。
- 自动保鲜:`pipeline/auto_refresh.py`,由另一台机器(Mac mini)launchd 经 `run_auto_refresh.sh` 定时跑;生成后先过 gates_ok + verify_site + check_transcript,通过才推 master,失败则提交到本地 `fix/auto-<日期>` 分支、master 退回、日志写一行 `GATE-FAIL`。定时任务不自动 pull,改了脚本要在那台机器 git pull。
- 站点验证:`node pipeline/verify_site.js <id...>`(`--recent N` / `--all --jobs 6` / `--no-browser`);转写质检:`python3 pipeline/check_transcript.py --check <id...>`。依赖全局 Playwright。
- 推送门禁:`pipeline/install_hooks.sh` 装 pre-push(只装工作 Mac,Mac mini 不装),推送时自动跑上面两项;要推的必须是当前检出提交且无未提交改动。绕过 `SKIP_SITE_GATE=1 git push`,别默认绕过。

## 禁止 / 踩过的坑
- `build_share_pages.js` 必须是最后一步(按 app.js 回填 `?v=` 哈希);`check_guest_names` 必须在 `build_mcp_data` 之后。
- 新误听要登记进 `pipeline/transcript_glossary.json` / fix_terms,别只改那一期(如 pstack→P Sack、Graphbot→Grok Bot)。
- 建人物前按英文全名 grep PEOPLE,别只猜 pid(曾重复建档 sottiaux/tibosottiaux);插 PEOPLE 条目先切出 PEOPLE 块,别插进 FIELDS。
- 自动保鲜同一人同日两期会漏第二期;register_pod 的 iTunes 台标只比首词,新台要人工核台标和简介。
- MTS 与 Machine Learning Street Talk 是两个频道,别合并;台名 slug 撞车时撤回会误删台标。
- mark_ads 会把讲广告产品的正文章节误判成赞助(Alphabet 财报会 Advertiser Tools),财报会类要人工核 ads。
- 带定时任务的仓库别放 Downloads/Desktop/Documents(TCC 会让 launchd 静默失败)。
- 不提交 `pipeline/.env`、密钥、个人信息;DeepSeek 用 `deepseek-v4-flash`。

## 提交信息
中文一行,前缀 `feat:` / `fix:` / `content:` / `qc:` / `avatar:` / `ui:` / `chore:`(自动保鲜固定为 `chore: 自动保鲜 +N 期(…)`),冒号后写做了什么 + 关键数字/根因。只在 Jason 要求时 commit/push。
