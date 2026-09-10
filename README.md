# AI Podcast · AI 播客

知名 AI 人物的播客 **双语全文阅读站** —— 把研究者 / 实验室建设者的英文长访谈整理成中英对照全文,提炼核心观点,还能针对内容直接问 AI。

🌐 **在线**：[aipodcast.jasonlin.tech](https://aipodcast.jasonlin.tech) · **281 位人物 / 628 期 / 213 档节目**

## 功能

### 读
- **双语全文**：按主题分章、左侧目录,中英对照逐句阅读;支持「原文 / 译文在前」、字号、单/双语切换(localStorage 持久化)。
- **速览 + 观点**：每期 TL;DR、常见问题、核心观点 / 反共识(可点击跳到原文出处)。
- **观点演变**：同一人在不同时间、不同节目的立场变化(≥2 期才生成)。
- **逐字朗读**：选中文本即可 TTS 朗读,字符级高亮跟读,0.5–2× 变速。

### 找
- **人物**：按播客覆盖量排序,头像确认本人否则首字母。
- **筛选**：8 个研究领域(deep-learning / nlp / product / safety / rl / robotics / world-model / bio)交叉筛选。
- **议题**：跨人物的主题聚合,引文标注出处。
- **全站搜索**、**节目列表**。

### 用
- **问答 Ask**：问这期(基于该期转录,引用 `[#章节]`)/ 问全站(RAG-lite,从目录选相关单集,引用 `[@id]`),流式输出。
- **分享**：选中文本生成带引文 + 深链(`?at&hl`)的分享,打开自动定位高亮;每期 / 每人有专属 OG 卡(1200×630),微信 / X / Slack 里预览各不相同。
- **「我的」**：阅读进度、多设备同步(同步码即身份,无账号)、新内容浏览器推送开关。
- **RSS**：`feed.xml`(计数走 `feed.jasonlin.tech`,GitHub Pages 直连拦不到)。
- **MCP server**：外部 AI 可只读接入全站内容。
- **深色模式**、**离线兜底**(Service Worker)、**自建埋点分析**(不存 IP)。

## 技术

- **静态 SPA**：`index.html`(62KB,只有壳)+ 外链 **`app.js`**(hash 路由 + 全站元数据 / insights),GitHub Pages 部署。
  数据按需拉:单集全文 `mcp-data/ep/<id>.json`、议题 / 观点演变 `data/{topics,views}.json`。
  另有 628 + 281 个**静态分享页**(`e/<id>/`、`pp/<pid>/`)供爬虫和冷启动直出。
- **DeepSeek**(`deepseek-v4-flash`,推理模型)：分块翻译、共识 / 反共识、速览、议题、观点演变、问答。
- **Cloudflare Workers**（6 个）：

  | Worker | 作用 |
  |---|---|
  | `chat` | 问答(流式) |
  | `tts` | ElevenLabs 字符级时间戳朗读 |
  | `stats` | D1 埋点分析 + RSS 计数代理 |
  | `mcp` | 只读内容接口 |
  | `push` | Web Push 订阅与下发(VAPID) |
  | `sync` | 多设备阅读状态同步(KV,无账号无 IP) |

## 目录结构

```
index.html              SPA 壳(62KB,含 app.js?v=<md5> 版本号)
app.js                  全站数据 + 视图 + 样式的唯一源
sw.js                   Service Worker(两站共用):导航 network-first、app.js cache-first
data/                   按需拉:ep-extra(insights/brief)、views、topics
mcp-data/               MCP 检索目录 index.json + 每期全文 ep/<id>.json
e/ | pp/                每期 / 每人的静态分享页
og/e/ | og/pp/          每期 / 每人的专属 OG 卡(JPEG 1200×630)
assets/people|pods/     人物头像 / 播客台标(jpg + webp)
feed.xml sitemap.xml llms.txt robots.txt
config.example.js       ElevenLabs Key 注入模板(实际 config.js 已 gitignore)
CNAME                   自定义域名
{chat,tts,stats,mcp,push,sync}-worker/   Cloudflare Workers
pipeline/               内容管线(见下)
```

## 内容管线 `pipeline/`

| 脚本 | 作用 |
|---|---|
| `add_person.py` / `add_episode.py` | 建人物档 / yt-dlp 取字幕 → DeepSeek 双语全文 + 共识反共识 → 写库 |
| `auto_refresh.py` | 无人值守保鲜:人物 + 频道双维度发现 → 选题闸门 → 收录 → 重生成 → 推送上线(launchd 每天定时) |
| `remove_episode.py` | 下架一期并写入 `excluded.json`,防止下一轮又被收回来 |
| `gen_views.py` / `gen_brief.py` / `gen_topics.py` / `gen_sectitles.py` | 观点演变 / 速览 / 议题 / 中文章节标题 |
| `fetch_avatar.py` / `webp_avatars.py` | 多源取头像(带身份校验 + 人脸检测)/ 转 WebP |
| `gen_og_cards.py` | 每期 / 每人的专属 OG 分享卡 |
| `split_extra.py` / `split_data.py` | 首屏瘦身:insights/brief → `data/ep-extra.json`;VIEWS/TOPICS.items → `data/{views,topics}.json` |
| `build_mcp_data.js` / `build_share_pages.js` | MCP 数据 + 静态分享页 + sitemap + 回填 `app.js?v=` 哈希 |
| `gen_feed.py` / `push_notify.py` / `indexnow.py` | RSS / 浏览器推送 / 搜索引擎主动推送 |
| `check_artifacts.js` / `audit_completeness.js` | 上线前门禁:产物完整性、头像登记、版本号一致 |

> ⚠️ `build_share_pages.js` 按 `app.js` 内容 md5 回填 `index.html` 的 `?v=`,**必须是最后一步**;之后再改 `app.js` 要重跑一次。

```bash
cd pipeline && export DEEPSEEK_API_KEY=sk-...
python add_episode.py --url <youtube> --pid <人物id> --guest <嘉宾名> \
  --pod-en "..." --pod-zh "..." --fields nlp,safety
```

> 本地脚本用 `urllib ProxyHandler({})` 绕系统代理;`wrangler` 命令需关代理(`HTTPS_PROXY= HTTP_PROXY=`)。密钥放 `pipeline/.env` 与 Worker secret,不入库。yt-dlp 需住宅 IP(云端会被 YouTube 挡),所以定时任务跑在本地 Mac。

## 版权与使用

仅作**学习 / 评论用途**,版权归原播客 / 权利人;译文由 AI 生成、仅供参考,以原文为准。**应权利人要求即下架**(linzheng3535@gmail.com),不商业化。

> 姊妹项目:[AI Paper](https://github.com/jason3535/aipaper) —— 同一套阅读框架,做学者 × 论文。
