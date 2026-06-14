# AI Podcast · 内容管线 (pipeline)

把一期播客 → 站内**双语全文**（按主题分章、含目录、顶部「共识 / 反共识」速览）。
翻译与提炼用 **DeepSeek**（`deepseek-chat`，OpenAI 兼容）；转录取自 YouTube 字幕轨（`yt-dlp`）。

## 安装

```bash
cd pipeline
python3 -m venv .venv && source .venv/bin/activate
pip install yt-dlp pillow
export DEEPSEEK_API_KEY=sk-...        # 翻译/提炼用
```

`pillow` 仅用于把人物头像裁成正方形。`yt-dlp` 用于抓字幕。

---

## 场景 A：给已有人物加一期播客（最常用）

一条命令：抓字幕 → 双语翻译 → 共识/反共识 → 写进 `../index.html`（自动按日期重排）。

```bash
python add_episode.py \
  --url "https://youtu.be/XXXXXXXXXXX" \
  --pid jensen --guest Jensen \
  --pod-en "Dwarkesh Podcast" --pod-zh "Dwarkesh 播客" \
  --fields deep-learning,robotics
```

- `--pid` 必须是 `index.html` 里 `PEOPLE` 中已有的人物 id；嘉宾发言用 `--guest`，主持人统一记为 `Host`。
- `--date / --min / --title-en/zh / --sub-en/zh` 不填则自动：日期/时长取自 YouTube，标题/导语由 DeepSeek 生成。
- `--fields` 用领域分类法：`deep-learning / nlp / vision / rl / safety / robotics`。
- 产物：转录存 `transcripts/ep_<vid>.json`，并把该期 `EPISODES[]` 对象插入 `index.html`。
- 跑完直接刷新页面即可看到这期的全文 + 目录 + 共识/反共识，且可选中朗读。

## 场景 B：新增一个人物

```bash
python add_person.py --pid sutton --wiki "Richard S. Sutton" \
  --en "Richard Sutton" --zh "理查德·萨顿" \
  --ti-en "Professor, U of Alberta" --ti-zh "阿尔伯塔大学教授" \
  --fields rl,deep-learning \
  --bio-en "..." --bio-zh "..."
```

它会抓 Wikimedia 头像到 `../assets/people/<pid>.jpg`，并打印一段 `PEOPLE` 条目；按提示：
1. 把条目粘进 `index.html` 的 `PEOPLE{}`；
2. 若抓到照片，把 pid 加进 `PHOTOS` 集合；
3. 再用**场景 A** 给他加播客。

> 海外人物优先（站点定位）。新增播客媒体时，顺手在 `index.html` 的 `POD_INFO`（详情页简介）和 `POD_LOGO` 里登记；封面可用 Apple Podcasts 搜索 API 拉：`https://itunes.apple.com/search?term=<节目名>&media=podcast&limit=1` 取 `artworkUrl600`，存 `../assets/pods/<slug>.jpg`。

## 重新生成整页（可选）

`build_catalog.py` 是页面 `EPISODES[]` 的**生成器**：读 `transcripts/*.json` + 脚本内的节目元数据清单，重写 `index.html` 的 `EPISODES[]`。批量改动后用它一次性重建。日常加单集用**场景 A** 即可，不必跑它。

## 术语表

`glossary.json` 是译名单一事实源（键=英文小写、值=固定中文）。新增领域/术语先在此登记，保证全站译名一致。

## 合规 / 注意

- 转录稿是受版权保护的演绎。**站点公开发布全文有播客方版权风险**；自用阅读风险低。公开版建议只放摘要+金句+原链接（见根目录说明）。
- 译文由 AI 生成，个别词偶有瑕疵，页面底注已注明。
- 朗读用的 ElevenLabs Key 放在根目录 `config.js`（已 gitignore，不进仓库）。
