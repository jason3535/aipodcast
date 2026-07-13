#!/usr/bin/env python3
"""IndexNow 提交:把 sitemap 里的 URL 推给 Bing/Yandex 等(即时收录,无需站长账号)。
用法: python3 pipeline/indexnow.py   (部署后跑;幂等,重复提交无害)"""
import json, re, ssl, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
KEY = "40e65f6fed66c047d6cdc2ddef965886"
SITE = "https://aipodcast.jasonlin.tech" if "aipodcast" in str(ROOT) else "https://aipaper.jasonlin.tech"
HOST = SITE.split("//")[1]
urls = re.findall(r"<loc>([^<]+)</loc>", (ROOT / "sitemap.xml").read_text(encoding="utf-8"))
body = json.dumps({"host": HOST, "key": KEY, "keyLocation": f"{SITE}/{KEY}.txt", "urlList": urls[:10000]}).encode()
ctx = ssl.create_default_context()
req = urllib.request.Request("https://api.indexnow.org/indexnow", data=body,
                             headers={"Content-Type": "application/json; charset=utf-8"})
r = urllib.request.urlopen(req, timeout=30, context=ctx)
print(f"IndexNow: {len(urls)} URLs 提交 → HTTP {r.status}")
