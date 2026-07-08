#!/usr/bin/env python3
"""保持首页轻量:把 index.html 内联 EPISODES 里的 insights/brief 抽到 data/ep-extra.json。
幂等——已抽过再跑无副作用;新收录后跑一次即可把新集的重数据挪出。前端首屏后非阻塞加载 ep-extra 回填。"""
import re, io, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
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
    EXTRA.parent.mkdir(exist_ok=True)
    EXTRA.write_text(json.dumps(extra, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    s = s[:m.start()] + "const EPISODES = " + json.dumps(eps, ensure_ascii=False, separators=(", ", ": ")) + ";" + s[m.end():]
    HTML.write_text(s, encoding="utf-8")
    print(f"split_extra: 抽出 {moved} 集 → data/ep-extra.json ({EXTRA.stat().st_size//1024}KB) | index.html {HTML.stat().st_size//1024}KB")

if __name__ == "__main__":
    main()
