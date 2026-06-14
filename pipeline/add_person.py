#!/usr/bin/env python3
"""
add_person.py — 新增人物:抓 Wikimedia 头像存到 assets/people/<pid>.jpg,并打印 PEOPLE 条目模板。
打印的条目手动粘进 index.html 的 PEOPLE{};pid 也要加进同文件的 PHOTOS 集合(若抓到照片)。

用法:
  python add_person.py --pid jensen --wiki "Jensen Huang" \
    --en "Jensen Huang" --zh "黄仁勋" --ti-en "Founder & CEO, NVIDIA" --ti-zh "NVIDIA 创始人兼 CEO" \
    --fields deep-learning,robotics
"""
import argparse, json, sys, urllib.request
from io import BytesIO
from pathlib import Path

BASE = Path(__file__).resolve().parent
PEOPLE_DIR = BASE.parent / "assets" / "people"; PEOPLE_DIR.mkdir(parents=True, exist_ok=True)
HDR = {"User-Agent": "AIPodcast/1.0 (prototype)"}


def fetch_photo(pid, wiki):
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(
            f"https://en.wikipedia.org/api/rest_v1/page/summary/{wiki.replace(' ','_')}", headers=HDR), timeout=15))
        u = (d.get("thumbnail") or {}).get("source") or (d.get("originalimage") or {}).get("source")
        if not u:
            return False
        raw = urllib.request.urlopen(urllib.request.Request(u, headers=HDR), timeout=20).read()
        try:
            from PIL import Image
            im = Image.open(BytesIO(raw)).convert("RGB"); w, h = im.size; s = min(w, h)
            im.crop(((w - s)//2, (h - s)//3, (w - s)//2 + s, (h - s)//3 + s)).resize((256, 256), Image.LANCZOS)\
              .save(PEOPLE_DIR / f"{pid}.jpg", quality=86)
        except ImportError:
            (PEOPLE_DIR / f"{pid}.jpg").write_bytes(raw)
        return True
    except Exception as e:
        print(f"  照片抓取失败: {e}", file=sys.stderr); return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pid", required=True); ap.add_argument("--wiki", required=True, help="维基条目名")
    ap.add_argument("--en", required=True); ap.add_argument("--zh", required=True)
    ap.add_argument("--ti-en", required=True); ap.add_argument("--ti-zh", required=True)
    ap.add_argument("--fields", required=True)
    ap.add_argument("--bio-en", default="(待补：一两句英文简介)"); ap.add_argument("--bio-zh", default="(待补：一两句中文简介)")
    a = ap.parse_args()
    init = "".join(w[0] for w in a.en.split()[:2]).upper()
    has = fetch_photo(a.pid, a.wiki)
    fields = "[" + ",".join(f"'{f.strip()}'" for f in a.fields.split(",")) + "]"
    print(f"\n照片: {'✓ assets/people/'+a.pid+'.jpg' if has else '未抓到,头像将回退字母 '+init}")
    print(f"\n① 把下面这条加进 index.html 的 PEOPLE{{}}：\n")
    print(f"""  '{a.pid}':{{en:'{a.en}',zh:'{a.zh}',init:'{init}',tiEn:'{a.ti_en}',tiZh:'{a.ti_zh}',fields:{fields},
    bioEn:'{a.bio_en}',
    bioZh:'{a.bio_zh}'}},""")
    if has:
        print(f"\n② 把 '{a.pid}' 加进 index.html 的 PHOTOS 集合：const PHOTOS=new Set([...,'{a.pid}']);")
    print(f"\n③ 然后跑 add_episode.py --pid {a.pid} ... 生成他的播客全文。")


if __name__ == "__main__":
    main()
