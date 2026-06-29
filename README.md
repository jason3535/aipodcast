# AI Podcast · AI 播客

知名 AI 人物的播客 **双语全文阅读站** —— 把研究者 / 实验室建设者的英文长访谈整理成中英对照全文,提炼核心观点,还能针对内容直接问 AI。

🌐 **在线**：[aipodcast.jasonlin.tech](https://aipodcast.jasonlin.tech) · **73 位人物 / 160+ 期**

## 功能

- **人物**：按播客覆盖量排序,头像确认本人否则首字母,可按研究领域筛选。
- **双语全文**：按主题分章、左侧目录,中英对照逐句阅读;支持「原文 / 译文在前」、字号、单/双语切换(localStorage 持久化)。
- **速览 + 观点**：每期 TL;DR、核心观点 / 反共识(可点击跳到原文出处)。
- **观点演变**：同一人在不同时间、不同节目的立场变化(≥2 期才生成)。
- **逐字朗读**：选中文本即可 TTS 朗读,字符级高亮跟读,0.5–2× 变速。
- **议题**：跨人物的主题聚合。
- **问答 Ask**：问这期(基于该期转录,引用 `[#章节]`)/ 问全站(RAG-lite,从目录选相关单集,引用 `[@id]`),流式输出。
- **分享**：选中文本生成带引文 + 深链(`?at&hl`)的分享,打开自动定位高亮。
- **深色模式**、**全站搜索**、**MCP server**(外部 AI 可接入只读内容)、**自建埋点分析**。

## 技术

- **单文件静态 SPA**：`index.html`(hash 路由 + 内联元数据/insights + 懒加载 `mcp-data/ep/<id>.json` 全文),GitHub Pages 部署。
- **DeepSeek**(`deepseek-chat`)：分块翻译、共识/反共识、速览、议题、观点演变、问答。
- **Cloudflare Workers**：`chat`(问答,流式)、`tts`(ElevenLabs 字符级时间戳)、`stats`(D1 分析)、`mcp`(只读内容接口)。

## 目录结构

```
index.html              单文件 SPA(数据 + 视图 + 样式)
config.example.js       ElevenLabs Key 注入模板(实际 config.js 已 gitignore)
CNAME                   自定义域名
assets/people|pods/     人物头像 / 播客封面
mcp-data/               懒加载全文 + 检索目录(index.json)
chat-worker|tts-worker|stats-worker|mcp-worker/  Cloudflare Workers
pipeline/               内容管线(见下)
```

## 内容管线 `pipeline/`

| 脚本 | 作用 |
|---|---|
| `add_person.py` | 抓维基头像 + 生成 PEOPLE 条目 |
| `add_episode.py` | yt-dlp 取字幕 → DeepSeek 双语全文 + 共识/反共识 → 写库 |
| `gen_views.py` / `gen_brief.py` / `gen_topics.py` / `gen_sectitles.py` | 观点演变 / 速览 / 议题 / 中文章节标题 |
| `build_mcp_data.js` / `build_share_pages.js` | MCP 数据 + 每期 OG 分享页 + sitemap |
| `auto_refresh.py` | 无人值守保鲜:发现新单集 → 选题闸门 → 收录 → 再生成 → 推送(本地 launchd 定时) |

```bash
cd pipeline && export DEEPSEEK_API_KEY=sk-...
python add_episode.py --url <youtube> --pid <人物id> --guest <嘉宾名> \
  --pod-en "..." --pod-zh "..." --fields nlp,safety
```

> 本地脚本用 `urllib ProxyHandler({})` 绕系统代理;`wrangler` 命令需关代理(`HTTPS_PROXY= HTTP_PROXY=`)。密钥放 `pipeline/.env` 与 Worker secret,不入库。

## 版权与使用

仅作**学习 / 评论用途**,版权归原播客 / 权利人;译文由 AI 生成、仅供参考,以原文为准。**应权利人要求即下架**(linzheng3535@gmail.com),不商业化。

> 姊妹项目:[AI Paper](https://github.com/jason3535/aipaper) —— 同一套阅读框架,做学者 × 论文。
