# 内容自动保鲜机制（auto_refresh）

让 AI Podcast 的内容「总是最新」——定时自动发现各人物的新播客、AI 选题、抓取双语全文、重生成全部派生数据、提交推送上线。**无人值守。**

## 流程
`pipeline/auto_refresh.py` 一条龙:
1. **发现**:对在站全部人物,yt-dlp 搜最近的新播客(近 120 天、比在站最新更新、≥30min、有英文字幕、未收录)。
2. **选题闸门**(替代人工筛):每个候选过 DeepSeek 判断——必须是该人物作为**主嘉宾**的**英文****实质 AI 访谈**(自动剔除新闻短片/圆桌/非英语/本人非主角)。
3. **收录**:每人最多 1 期最新、全局每轮 ≤6 期;调 `add_episode.py` 抓双语全文+核心观点;新播客台自动登记(DeepSeek 双语简介 + iTunes logo)。
4. **重生成**:`gen_views` 观点演变 / `gen_topics` 议题 / `build_mcp_data` MCP 索引 / `build_share_pages` 分享页。
5. **上线**:JS 校验通过后 `git commit && push`,GitHub Pages 自动部署。**没有新内容就不提交。**

## 为什么跑在本机(不是云)
**yt-dlp 必须用住宅 IP**——YouTube 封数据中心 IP,GitHub Actions/云会被"确认非机器人"挡。所以调度跑在 Jason 的 Mac 上(住宅 IP + 已有 key)。DeepSeek 用 `ProxyHandler({})` 直连绕开 Clash 系统代理。

## 调度(macOS launchd)
- 计划任务:`~/Library/LaunchAgents/com.aipodcast.autorefresh.plist`(模板在 `pipeline/`)。
- 频率:**每周一、周四 09:17**(本地时间)。开机自启、与 Claude 无关、重启不丢。
- 入口:`pipeline/run_auto_refresh.sh`(补全 launchd 精简 PATH、加载 `.env` 密钥、跑 python、记日志)。
- 密钥:`pipeline/.env`(已 gitignore)放 `DEEPSEEK_API_KEY=...`,轮换时改这里即可。

### 常用命令
```bash
# 手动跑一轮(正式)
DEEPSEEK_API_KEY=... python3 pipeline/auto_refresh.py
# 只看「会收录什么」,不抓不推
DEEPSEEK_API_KEY=... python3 pipeline/auto_refresh.py --dry-run --days 150
# 加载 / 卸载 / 立即触发一次 定时任务
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.aipodcast.autorefresh.plist
launchctl bootout   gui/$(id -u)/com.aipodcast.autorefresh
launchctl kickstart -k gui/$(id -u)/com.aipodcast.autorefresh   # 立刻跑一次测试
# 看日志
tail -f pipeline/auto_refresh.log
```

## 注意 / 排查
- **git push 需免密**:本机 git 凭据已缓存(osxkeychain),launchd 同用户可用;首次定时跑完确认 `auto_refresh.log` 里是「✓ 已上线」而非 push 失败。
- **限量保守**:`--max`(默认 6)防失控;每人每轮最多 1 期;失败的单人不影响其余。
- **选题闸门偏保守**:偶尔会把边界内容判「弃」(宁缺毋滥);要更激进可放宽 `GATE_SYS`。
- **台名是原始频道名**:自动登记的台名取 YouTube 频道名(不像人工那样精修,如 Stripe→Cheeky Pint);可事后手动改 POD_INFO。
- **Mac 需开机**:Mac 睡眠/关机时 launchd 不跑;醒来后 launchd 会补跑错过的任务(默认行为)。
