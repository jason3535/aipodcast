#!/usr/bin/env python3
"""graph_refresh_beacon.py — 把四图谱**既有**分享页里的旧埋点换成 pipeline/beacon.js 的共用版。

为什么需要单独一个脚本:graph_share_pages.py 的契约是「只补缺失,不重写已有页」
(既有页可能有人工调整),所以它 --apply 一百遍也不会更新这 636 个老页面里的埋点。

为什么必须换:旧版是「打开即发 view」,没有任何行为门槛。2026-08-22 一天进来
727 次访问、720 个互不相同的 vid、714 条无 referrer,把每个 /p/*.html 恰好各扫一次
—— 分布式抓取被原样记成了 720 个 UV,四图谱的 UV 数因此长期虚高约 20 倍
(近 14 天 977 个「UV」里只有 ~56 个像真人)。新版多发一条 type='read'
(可见满 4 秒或有交互才发),view 口径保持不变以免历史序列断裂。

只动 <script> 里含 stats.jasonlin.tech 的那一段,其余字节不碰。幂等:已经是新版的跳过。
用法: python3 pipeline/graph_refresh_beacon.py [--apply]   (不带 --apply 只报告)
"""
import re, sys
from pathlib import Path

SITES = {
    "graph-ai":     Path("/Users/jason/ai-scholar-graph"),
    "graph-hw":     Path("/Users/jason/hardware-startup-graph"),
    "graph-inv":    Path("/Users/jason/investor-graph"),
    "graph-design": Path("/Users/jason/designer-graph"),
}
SRC = (Path(__file__).resolve().parent / "beacon.js").read_text(encoding="utf-8")
TPL = SRC[SRC.index("<script>"):SRC.rindex("</script>") + len("</script>")]

apply_ = "--apply" in sys.argv
total = changed = already = 0
for pfx, repo in SITES.items():
    new = TPL.replace("%PATH%", f"'{pfx}:'+location.pathname+location.search")
    pages = sorted((repo / "p").glob("*.html")) if (repo / "p").is_dir() else []
    if not pages:
        print(f"  ⚠ {pfx}: {repo}/p 下没有页面,跳过")
        continue
    n = skip = 0
    for f in pages:
        s = f.read_text(encoding="utf-8")
        blocks = [m for m in re.finditer(r"<script>[\s\S]*?</script>", s)
                  if "stats.jasonlin.tech" in m.group(0)]
        if not blocks:
            print(f"  ⚠ {f.relative_to(repo)} 没有埋点块,跳过")
            continue
        if len(blocks) > 1:
            print(f"  ⚠ {f.relative_to(repo)} 有 {len(blocks)} 个埋点块,跳过(需人工看)")
            continue
        b = blocks[0]
        # 「已是新版」= 与共用片段逐字节相同。2026-09-05 之前用 "post('read')" 当标记,
        # 结果 beacon.js 再改(补交互起步保护期)时 636 个老页面会被整体跳过、永远停在旧版。
        if b.group(0) == new:
            skip += 1
            continue
        if apply_:
            f.write_text(s[:b.start()] + new + s[b.end():], encoding="utf-8")
        n += 1
    total += len(pages); changed += n; already += skip
    print(f"  {pfx:13s} {len(pages):4d} 页 | 待换 {n:4d} | 已是新版 {skip:4d}")

print(f"\n合计 {total} 页,{'已替换' if apply_ else '待替换(加 --apply 执行)'} {changed},已是新版 {already}")
