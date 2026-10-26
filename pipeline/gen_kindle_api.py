#!/usr/bin/env python3
"""gen_kindle_api.py — 给 Kindle 上的乔木 SimpleUI 插件(魔改版)供「资讯」列表:kindle/api/*。
纯静态,接口形状照抄 rss.qiaomu.ai,插件只换 ORIGIN 就能读:
  kindle/api/entries                 最新 200 期(插件 MAX_ITEMS=200)
  kindle/api/channels                人物 = 频道,category = 首个领域(插件按领域分组)。
                                     原接口叫 /api/sources,但静态站里 sources 已是目录,故改名(插件同步改)
  kindle/api/sources/<pid>/entries   单人全部期
正文不在这里生成:插件点开时直接取 /mcp-data/ep/<id>.json 在设备上排版,省得仓库多 80MB。
GitHub Pages 忽略查询串,所以 ?limit= 照样命中这些无扩展名文件。
必须排在 build_mcp_data 之后(读 mcp-data/index.json)。用法: python3 pipeline/gen_kindle_api.py"""
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://aipodcast.jasonlin.tech"
OUT = ROOT / "kindle" / "api"
LATEST = 200

eps = json.loads((ROOT / "mcp-data" / "index.json").read_text(encoding="utf-8"))["episodes"]
people = {p["pid"]: p for p in json.loads((ROOT / "mcp-data" / "people.json").read_text(encoding="utf-8"))["people"]}


def ts(date):
    try:
        return int(datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc).timestamp() * 1000)
    except (TypeError, ValueError):
        return 0


def entry(e):
    name = e.get("personZh") or e.get("person") or e["pid"]
    pod = e.get("podZh") or e.get("podEn") or ""
    return {
        "id": e["id"], "sourceId": e["pid"], "sourceName": name,
        "title": e.get("tEn") or e.get("tZh") or e["id"],
        "titleZh": f"{e.get('tZh') or e.get('tEn')} · {name}" + (f" — {pod}" if pod and pod != name else ""),
        "published": f"{e.get('date', '')}T00:00:00.000Z", "publishedTs": ts(e.get("date")),
        "link": f"{SITE}/#/episode/{e['id']}",
        "summary": e.get("sEn") or "", "summaryZh": e.get("sZh") or "",
    }


eps = sorted(eps, key=lambda e: (e.get("date") or "", e["id"]), reverse=True)
by_pid = {}
for e in eps:
    by_pid.setdefault(e["pid"], []).append(e)

# 频道顺序:最近有更新的人排前面
sources = []
for pid, items in by_pid.items():
    p = people.get(pid, {})
    fields = items[0].get("fields") or p.get("fields") or ["product"]
    sources.append({"id": pid, "name": items[0].get("personZh") or p.get("zh") or items[0].get("person") or pid,
                    "category": fields[0], "siteUrl": f"{SITE}/#/person/{pid}"})

if OUT.exists():
    shutil.rmtree(OUT)               # 全量重建:删掉的人物/期不留残档
(OUT / "sources").mkdir(parents=True)


def dump(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


dump(OUT / "entries", {"entries": [entry(e) for e in eps[:LATEST]]})
dump(OUT / "channels", {"sources": sources, "updated": datetime.now(timezone.utc).isoformat()})
for pid, items in by_pid.items():
    dump(OUT / "sources" / pid / "entries", {"entries": [entry(e) for e in items]})

size = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file())
print(f"kindle api: {min(LATEST, len(eps))} latest / {len(sources)} people / {size // 1024} KB")
