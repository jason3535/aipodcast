#!/usr/bin/env python3
"""graph_site_index.py — 重建四图谱首页页脚的「站点地图 · Sitemap」人物导航。

那个 <details class="site-index"> 块(给爬虫通向 /p/ 分享页的内链)当初是一次性脚本写的,
之后加人从没更新过——2026-09-05 查:ai 标着 175 人实际 192,hw 161/176,inv 88/96,design 171/175,
新加的人物在首页没有任何一条静态 <a> 指向它的分享页。固化于此,接在 graph_share_pages 之后跑。
只替换 <details ...>…</details> 这一段,<style> 与两侧标记原样保留。幂等。
用法:python3 pipeline/graph_site_index.py [--apply] [--check]
"""
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from graph_share_pages import SITES, parse_graph, esc
NATIVE_ZH = re.compile(r"^[一-鿿·]{2,6}$")   # 何恺明 这类原生中文名才用中文显示;音译名(杰克·帕克-霍尔德)仍显示英文
def build(site):
    nodes, zh, *_ = parse_graph(site["path"])
    items = []
    for gid, n in nodes.items():
        z = (zh.get(gid) or {}).get("zhName", "")
        disp = z if (z and NATIVE_ZH.match(z) and "·" not in z) else n["name"]
        items.append((disp, gid))
    items.sort(key=lambda x: (bool(re.search(r"[一-鿿]", x[0])), x[0].lower()))
    nav = " · ".join(f'<a href="/p/{gid}.html">{esc(d)}</a>' for d, gid in items)
    return f'<details class="site-index"><summary>站点地图 · Sitemap（{len(items)} 人）</summary><nav>{nav}</nav></details>', len(items)
def main():
    apply_, check = "--apply" in sys.argv, "--check" in sys.argv
    stale = 0
    for key, site in SITES.items():
        p = Path(site["path"], "index.html"); s = p.read_text(encoding="utf-8")
        m = re.search(r"(<!--SITE_INDEX_START-->[\s\S]*?)(<details class=\"site-index\">[\s\S]*?</details>)(<!--SITE_INDEX_END-->)", s)
        if not m: print(f"  ⚠ {key}: 没找到站点地图块,跳过"); continue
        new, n = build(site)
        cur = re.search(r"Sitemap（(\d+) 人）", m.group(2)); cur = int(cur.group(1)) if cur else -1
        if m.group(2) == new: print(f"  {key:7s} {n} 人,已是最新"); continue
        stale += 1
        print(f"  {key:7s} 标注 {cur} 人 → 实际 {n} 人{'  ✓ 已重建' if apply_ else '  (加 --apply 重建)'}")
        if apply_: p.write_text(s[:m.start(2)] + new + s[m.end(2):], encoding="utf-8")
    if check and stale: sys.exit(1)
if __name__ == "__main__": main()
