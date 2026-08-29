#!/usr/bin/env python3
"""gen_feed.py — 生成 RSS(/feed.xml):按「收录时间」(git 首次提交该期 ep json)倒序取最近 30 条。
与 build_share_pages.js 同批跑;纯静态，零后端。用法: python3 gen_feed.py"""
import json, re, subprocess, io
from email.utils import formatdate
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
SITE = "https://aipodcast.jasonlin.tech"

html = io.open(ROOT / "app.js", encoding="utf-8").read()
eps = json.loads(re.search(r"const EPISODES = (\[.*?\]);", html, re.S).group(1))
# 合回 split_* 移走的字段。2026-08-29 之前漏了这步,后果不是报错而是**静默降级**:
# brief 早就不在内联里了,于是下面的 tldr 恒为空 —— RSS 的「要点」一条都没生成过。
try:
    _ex = json.loads(io.open(ROOT / "data" / "ep-extra.json", encoding="utf-8").read())
    for e in eps:
        x = _ex.get(e["id"]) or {}
        for k in ("sEn", "sZh", "brief", "insights"):
            if not e.get(k) and x.get(k):
                e[k] = x[k]
except FileNotFoundError:
    pass
by_id = {e["id"]: e for e in eps}

# 收录时间 = 该期 mcp-data/ep/<id>.json 首次进 git 的提交时间(一次 git log 全量拿)
out = subprocess.run(
    ["git", "log", "--diff-filter=A", "--format=__C__%at", "--name-only", "--", "mcp-data/ep/"],
    capture_output=True, text=True, cwd=ROOT).stdout
added, ts = {}, None
for line in out.splitlines():
    if line.startswith("__C__"):
        ts = int(line[5:])
    elif line.strip().startswith("mcp-data/ep/") and ts:
        eid = line.strip()[len("mcp-data/ep/"):-len(".json")]
        added.setdefault(eid, ts)   # git log 新→旧，首个即最新;setdefault 留…其实要最早的提交
# 上面 setdefault 留下的是「最新一次 A」;对 add 而言每文件只 A 一次，等价。

rows = sorted(((added.get(e["id"], 0), e) for e in eps if e["id"] in added),
              key=lambda x: -x[0])[:30]

def esc(s):
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

items = []
for t, e in rows:
    p = e.get("pid", "")
    tldr = ((e.get("brief") or {}).get("tldr") or [])[:3]
    desc = esc(e.get("sZh") or e.get("sEn") or "")
    if tldr:
        desc += "  要点: " + " / ".join(esc(x.get("zh") or x.get("en") or "") for x in tldr)
    # link 指 hash 路由(SPA 详情页):点 RSS 直接进互动版,有朗读/问答/深色模式。
    # 2026-08-23 起静态页 e/<id>/ 带完整中英对照全文,是给搜索引擎和分享用的落地页;
    # guid **必须保持原值不变**(仍是 e/<id>/),否则阅读器会把全部 30 条当成新条目重推一遍,
    # 所以只把 isPermaLink 改成 false —— 值不动,含义从"这是永久链接"变成"这只是个唯一 id",
    # 阅读器于是改用 <link> 作为点击目标。两者不一致是有意为之,别"顺手改回去"。
    items.append(f"""  <item>
    <title>{esc(e.get('tZh') or e.get('tEn'))} — {esc((e.get('pod') or {}).get('zh') or '')}</title>
    <link>{SITE}/#/episode/{e['id']}</link>
    <guid isPermaLink="false">{SITE}/e/{e['id']}/</guid>
    <pubDate>{formatdate(t)}</pubDate>
    <description>{desc}</description>
  </item>""")

feed = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>AI Podcast · 双语播客全文</title>
  <link>{SITE}/</link>
  <atom:link href="{SITE}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>海外一线 AI 人物访谈，中英对照全文阅读——章节速览 · 核心观点/反共识 · 划词朗读 · AI 问答</description>
  <language>zh-cn</language>
  <lastBuildDate>{formatdate(rows[0][0] if rows else None)}</lastBuildDate>
{chr(10).join(items)}
</channel>
</rss>
"""
io.open(ROOT / "feed.xml", "w", encoding="utf-8").write(feed)
print(f"feed.xml: {len(items)} 条(按收录时间)")
