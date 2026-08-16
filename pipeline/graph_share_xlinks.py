#!/usr/bin/env python3
"""graph_share_xlinks.py — 给四图谱的静态分享页(/p/<id>.html)补「同一人物 · 姊妹站」链接。

背景(2026-08-16):SPA 端节点面板早有播客/纸站跳转,但静态分享页没有——爬虫和
无 JS 用户在分享页是死胡同,站群六域名之间也少了这批互链(全网外链≈0 的处境下,
六站互链是唯一能自己造的"外链")。

幂等:块用 <!--XLINKS_START/END--> 包裹,重跑覆盖旧块;无对应映射的人物不加块。
映射来自各图谱 index.html 的 PODCAST(节点id→播客pid)与 ai 图谱的 PAPER(节点id→纸站pid),
由 build_crosslinks.py 保持无缺口。
锚点:插在 `<a class="cta" href="/?node=` 之前(每页必有的主 CTA)。
用法:python3 pipeline/graph_share_xlinks.py [--check]   # --check 有缺口退出 1
"""
import re, sys
from pathlib import Path

SITES = {
    "ai":     Path("/Users/jason/ai-scholar-graph"),
    "hw":     Path("/Users/jason/hardware-startup-graph"),
    "inv":    Path("/Users/jason/investor-graph"),
    "design": Path("/Users/jason/designer-graph"),
}
POD = "https://aipodcast.jasonlin.tech/pp/{}/"
PAP = "https://aipaper.jasonlin.tech/pp/{}/"


def load_map(idx_html: str, name: str) -> dict:
    m = re.search(name + r"\s*=\s*(\{.*?\})\s*[;\n]", idx_html, re.S)
    if not m:
        return {}
    body = m.group(1)
    out = {}
    for k, v in re.findall(r"[\"']?([\w-]+)[\"']?\s*:\s*[\"']([\w-]+)[\"']", body):
        out[k] = v
    return out


def main() -> int:
    check = "--check" in sys.argv
    total = added = 0
    for key, root in SITES.items():
        idx = (root / "index.html").read_text(encoding="utf-8")
        pod = load_map(idx, "PODCAST")
        pap = load_map(idx, "PAPER") if key == "ai" else {}
        pdir = root / "p"
        if not pdir.is_dir():
            continue
        for f in sorted(pdir.glob("*.html")):
            nid = f.stem
            links = []
            if nid in pod:
                links.append(f'<a href="{POD.format(pod[nid])}">听 TA 的播客访谈（AI Podcast）</a>')
            if nid in pap:
                links.append(f'<a href="{PAP.format(pap[nid])}">读 TA 的论文与长文（AI Paper）</a>')
            if not links:
                continue
            total += 1
            block = ('<!--XLINKS_START--><p class="meta" style="font-size:13px;margin:10px 0">'
                     '同一人物 · 姊妹站：' + " · ".join(links) + "</p><!--XLINKS_END-->")
            h = f.read_text(encoding="utf-8")
            if "<!--XLINKS_START-->" in h:
                nh = re.sub(r"<!--XLINKS_START-->.*?<!--XLINKS_END-->", block, h, flags=re.S)
            else:
                anchor = re.search(r'<a class="cta" href="/\?node=', h)
                if not anchor:
                    print(f"  ! {key}/{f.name} 无 CTA 锚点,跳过")
                    continue
                nh = h[: anchor.start()] + block + h[anchor.start():]
            if nh != h:
                if not check:
                    f.write_text(nh, encoding="utf-8")
                added += 1
        print(f"  {key:<7} 映射 PODCAST {len(pod)} / PAPER {len(pap)}")
    print(f"共 {total} 页有映射, {'待补' if check else '写入'} {added} 页")
    return 1 if (check and added) else 0


if __name__ == "__main__":
    sys.exit(main())
