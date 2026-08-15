#!/usr/bin/env python3
"""indexnow.py — 用 IndexNow 主动把 URL 推给搜索引擎(Bing / Yandex / Seznam / Naver)。

为什么需要它:2026-08-15 实测,jasonlin.tech 全家六个站在 Bing 里**一条都没被索引**。
技术准备是齐的(robots 放行、sitemap 817 条、单集有 3388 字的静态页 + canonical),
但爬虫是靠外链发现网站的,而全网没有一个外部链接指向这些域名 —— 于是从没有爬虫来过。
IndexNow 是唯一**不需要注册任何账号**就能主动通知搜索引擎的协议,正好绕开这个死结。

注意:**Google 不支持 IndexNow**。Google 那边只能靠 Search Console 提交 sitemap,
需要 Jason 本人的账号,这个脚本救不了。

机制:在站点根目录放一个 <key>.txt(内容就是 key)自证域名所有权,然后 POST 一批 URL。

用法:
  python3 pipeline/indexnow.py --all              # 六站全量推(首次用)
  python3 pipeline/indexnow.py --site aipodcast --urls https://... https://...
  python3 pipeline/indexnow.py --site aipodcast   # 只推该站 sitemap 里最近改动的
"""
import argparse, json, re, sys, urllib.request
from pathlib import Path

KEY = "8f3c1d7a9b2e4056c1a8d3f7e920b64c"      # 与各站根目录的 <KEY>.txt 一致
ENDPOINT = "https://api.indexnow.org/indexnow"

SITES = {
    "aipodcast": (Path("/Users/jason/CascadeProjects/aipodcast"), "aipodcast.jasonlin.tech"),
    "aipaper":   (Path("/Users/jason/Downloads/ai-paper-prototype"), "aipaper.jasonlin.tech"),
    "ai":        (Path("/Users/jason/ai-scholar-graph"), "ai.jasonlin.tech"),
    "hw":        (Path("/Users/jason/hardware-startup-graph"), "hardware.jasonlin.tech"),
    "inv":       (Path("/Users/jason/investor-graph"), "investor.jasonlin.tech"),
    "design":    (Path("/Users/jason/designer-graph"), "design.jasonlin.tech"),
}
BATCH = 9000          # 协议上限 10000,留余量


def sitemap_urls(root: Path):
    f = root / "sitemap.xml"
    if not f.exists():
        return []
    return re.findall(r"<loc>([^<]+)</loc>", f.read_text(encoding="utf-8"))


def submit(host, urls):
    if not urls:
        return "无 URL"
    out = []
    for i in range(0, len(urls), BATCH):
        chunk = urls[i:i + BATCH]
        body = json.dumps({
            "host": host, "key": KEY,
            "keyLocation": f"https://{host}/{KEY}.txt",
            "urlList": chunk,
        }).encode()
        req = urllib.request.Request(ENDPOINT, data=body,
                                     headers={"Content-Type": "application/json; charset=utf-8"})
        # 走直连,别经 Clash(与 DeepSeek 同理);IndexNow 端点本身可直连
        op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        try:
            with op.open(req, timeout=45) as r:
                out.append(f"{len(chunk)} 条 → HTTP {r.status}")
        except urllib.error.HTTPError as e:
            # 202 = 已接受待校验 key;422 = URL 与 host 不符;403 = key 校验失败
            out.append(f"{len(chunk)} 条 → HTTP {e.code} {e.read()[:120].decode('utf-8','ignore')}")
        except Exception as e:
            out.append(f"{len(chunk)} 条 → 失败 {str(e)[:80]}")
    return " · ".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", choices=list(SITES))
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--urls", nargs="*", default=[])
    a = ap.parse_args()

    targets = list(SITES) if a.all else ([a.site] if a.site else [])
    if not targets:
        sys.exit("需要 --site 或 --all")

    for k in targets:
        root, host = SITES[k]
        # key 文件必须先在线上可访问,否则 IndexNow 拒收
        if not (root / f"{KEY}.txt").exists():
            print(f"  ⚠ {k}: 缺 {KEY}.txt,跳过(先部署 key 文件)", file=sys.stderr)
            continue
        urls = a.urls if a.urls else sitemap_urls(root)
        urls = [u for u in urls if u.startswith(f"https://{host}/")]
        print(f"  {k:10s} {host:28s} {submit(host, urls)}")


if __name__ == "__main__":
    main()
