# AI Podcast · AI 播客

知名 AI 人物的播客，**双语全文阅读站**：按主题分章、左侧目录、顶部「共识 / 反共识」速览、选中文本即可朗读。单文件静态 SPA（`index.html`，hash 路由），走 GitHub Pages。

域名：**aipodcast.jasonlin.tech**

## 功能

- **双语全文**：英文原句（衬线）+ 中文译句对照（段内交替），EN / 中 / 双语三档切换、字号三档，localStorage 持久化。
- **目录**：≥3 章的文章显示左侧吸顶目录，滚动高亮当前章、点击跳转；移动端浮层。
- **共识 / 反共识**：每篇文章顶部双栏速览，快速提取要点。
- **朗读**：选中任意文本 → ElevenLabs 多语种 TTS 播放（中英皆可）。
- **人物 / 领域 / 播客** 三个维度浏览 + 搜索；**播客媒体详情页**（简介 + 主持人 + 该台收录）。
- 人物照片来自 Wikimedia Commons（CC），播客封面来自 Apple Podcasts（仅作识别）。

## 目录结构

```
index.html            单文件 SPA（数据 + 视图 + 样式都在内）
config.js             ElevenLabs Key 注入(已 gitignore;参考 config.example.js)
CNAME                 自定义域名
assets/people/*.jpg   人物头像
assets/pods/*.jpg     播客封面
pipeline/             内容管线(加人物/加单集/重建),见 pipeline/README.md
```

## 加内容

见 [`pipeline/README.md`](pipeline/README.md)。一句话：

```bash
cd pipeline && export DEEPSEEK_API_KEY=sk-...
python add_episode.py --url <youtube> --pid <人物id> --guest <嘉宾名> \
  --pod-en "..." --pod-zh "..." --fields nlp,safety
```

抓字幕 → DeepSeek 双语翻译 + 共识/反共识 → 自动写进 `index.html`。

## 本地朗读

复制 `config.example.js` 为 `config.js` 填入 ElevenLabs Key（或在页面右上「语音设置」手填）。`config.js` 已 gitignore，不入仓库。

## 注意

- 译文由 AI 生成，个别词偶有瑕疵。
- 转录稿涉及播客方版权：**自用阅读风险低；公开发布全文有风险**，公开版宜只放摘要 + 金句 + 原链接。
- 任何密钥都不要提交；`config.js` 已忽略。
