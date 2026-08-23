#!/usr/bin/env python3
"""保持首页轻量:把 index.html 内联 EPISODES 里的 insights/brief 抽到 data/ep-extra.json。
幂等——已抽过再跑无副作用;新收录后跑一次即可把新集的重数据挪出。前端首屏后非阻塞加载 ep-extra 回填。"""
import re, io, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "app.js"
EXTRA = ROOT / "data" / "ep-extra.json"

def main():
    s = HTML.read_text(encoding="utf-8")
    m = re.search(r'const EPISODES = (\[.*?\]);', s, re.S)
    eps = json.loads(m.group(1))
    extra = json.loads(EXTRA.read_text(encoding="utf-8")) if EXTRA.exists() else {}
    moved = 0
    for e in eps:
        ib = {k: e.pop(k) for k in ("insights", "brief") if k in e}
        if ib:
            extra.setdefault(e["id"], {}).update(ib)
            moved += 1
    ids = {e["id"] for e in eps}               # 清理已删除的集
    for k in [k for k in extra if k not in ids]:
        del extra[k]

    # 自愈:insights 是**移动**不是复制,一旦 app.js 已被抽空、而 ep-extra 来自另一条分支
    # (云端会话收录 与 本地 cron 真分叉后合并),两头就都没有了 —— 集还在,核心观点/反共识
    # 却整块消失,前端静默显示为空,gen_views 也会因「有效期数不足」把人物整个漏掉。
    # 2026-08-23 体检发现 7 期这样丢失(7/20–8/11),全部能从 mcp-data/ep 复原。
    # mcp-data/ep/<id>.json 是全文权威存储,拿它兜底,每次跑都顺手修。
    healed = 0
    for e in eps:
        if (extra.get(e["id"]) or {}).get("insights"):
            continue
        f = ROOT / "mcp-data" / "ep" / f'{e["id"]}.json'
        if not f.exists():
            continue
        try:
            ins = json.loads(f.read_text(encoding="utf-8")).get("insights") or {}
        except Exception:
            continue
        if ins.get("consensus") or ins.get("contrarian"):
            extra.setdefault(e["id"], {})["insights"] = ins
            healed += 1
    if healed:
        print(f"split_extra: 自愈回填 {healed} 集的 insights(来源 mcp-data/ep)")
    EXTRA.parent.mkdir(exist_ok=True)
    EXTRA.write_text(json.dumps(extra, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    s = s[:m.start()] + "const EPISODES = " + json.dumps(eps, ensure_ascii=False, separators=(", ", ": ")) + ";" + s[m.end():]
    HTML.write_text(s, encoding="utf-8")
    print(f"split_extra: 抽出 {moved} 集 → data/ep-extra.json ({EXTRA.stat().st_size//1024}KB) | app.js {HTML.stat().st_size//1024}KB")

if __name__ == "__main__":
    main()
