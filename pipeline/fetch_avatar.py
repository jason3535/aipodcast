#!/usr/bin/env python3
"""fetch_avatar.py — 给维基上没有条目的人物找头像(add_person.py 只会抓 Wikipedia,抓不到就回退字母)。

按可靠度依次尝试,命中即停:
  1. wikidata   Wikidata 的 P18 图像(比 enwiki 摘要缩略图覆盖广一点)
  2. github     GitHub 用户头像(研究者/工程师常有)
  3. url        直接给一张图片 URL / 一个网页 URL(网页则取其 og:image)
  4. youtube    该人物某期播客的视频封面 → 人脸检测 → 裁最大那张脸(封面多为嘉宾正脸)

统一输出 assets/people/<pid>.jpg,256×256,与 add_person.py 同规格。
命中后记得把 pid 加进 app.js 的 PHOTOS 集合(本脚本只负责图片,不改 app.js)。

用法:
  python3 pipeline/fetch_avatar.py --pid albertgu --wikidata "Albert Gu" --github albertfgu
  python3 pipeline/fetch_avatar.py --pid tomverrilli --url "https://example.com/team"      # 取 og:image
  python3 pipeline/fetch_avatar.py --pid charliedeets --youtube "https://youtu.be/xxxx"
  python3 pipeline/fetch_avatar.py --pid xx --url "https://.../photo.jpg" --no-face         # 已是正方形头像
"""
import argparse
import json
import re
import sys
import urllib.parse
import unicodedata
import urllib.request
from io import BytesIO
from pathlib import Path

BASE = Path(__file__).resolve().parent
OUT = BASE.parent / "assets" / "people"
HDR = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                     "(KHTML, like Gecko) Chrome/126 Safari/537.36"}


def fold(s):
    """去重音 + 小写,让 Martín / Martin 这类写法能对上。"""
    return "".join(c for c in unicodedata.normalize("NFD", s or "")
                   if not unicodedata.combining(c)).lower()


def get(url, timeout=25):
    return urllib.request.urlopen(urllib.request.Request(url, headers=HDR), timeout=timeout).read()


def save(pid, raw, face=True, zoom=2.6, allow_faceless=False):
    """裁成 256×256:能检出人脸就以最大那张脸为中心裁,否则退回居中偏上(证件照构图)。
    zoom = 裁边长 ÷ 脸宽,越小脸越大;封面上人脸靠边、周围压着标题文字时调小(如 1.9)。"""
    from PIL import Image
    im = Image.open(BytesIO(raw)).convert("RGB")
    w, h = im.size
    box = None
    if face:
        try:
            import cv2
            import numpy as np
            cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
            g = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2GRAY)
            mn = (max(40, w // 12), max(40, h // 12))
            fs = cas.detectMultiScale(g, 1.1, 5, minSize=mn)
            if not len(fs):      # 正脸没检到再试侧脸(访谈截图常是侧身)
                fs = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml") \
                    .detectMultiScale(g, 1.1, 5, minSize=mn)
            if len(fs):
                x, y, fw, fh = max(fs, key=lambda f: f[2] * f[3])
                cx, cy = x + fw / 2, y + fh / 2
                s = min(w, h, int(max(fw, fh) * zoom))         # 默认脸占约 38%,留出头顶和肩膀
                left = min(max(0, int(cx - s / 2)), w - s)
                top = min(max(0, int(cy - s * 0.46)), h - s)   # 脸略高于正中
                box = (left, top, left + s, top + s)
                print(f"  检出 {len(fs)} 张脸,取最大的 {fw}×{fh}")
        except Exception as e:
            print(f"  人脸检测跳过: {e}", file=sys.stderr)
    if box is None:
        if face and not allow_faceless:
            # 这一步很关键:GitHub/og:image 常常给的是 logo、剪影、品牌图标而不是人像
            # (踩过三次:Albert Gu 的几何图标、Jonathan Ho 的粉色方块、苏剑林的剪影插画)。
            # 检不到脸就判这个来源不可用,让调用方自动去试下一个源,而不是把 logo 当头像装上。
            raise RuntimeError("这张图里检不到人脸(多半是 logo/插画),不采用;确认要用加 --allow-faceless")
        s = min(w, h)
        box = ((w - s) // 2, (h - s) // 3, (w - s) // 2 + s, (h - s) // 3 + s)
    OUT.mkdir(parents=True, exist_ok=True)
    im.crop(box).resize((256, 256), Image.LANCZOS).save(OUT / f"{pid}.jpg", quality=88)
    return OUT / f"{pid}.jpg"


def from_wikidata(name, expect):
    """expect:必须出现在 Wikidata 描述里的关键词(小写子串,逗号分隔任一命中即可)。
    没有 expect 就不允许用这个源——同名重灾区(曾把 Albert Gu 匹配成 19 世纪动物学家 Albert Günther)。"""
    if not expect:
        raise RuntimeError("wikidata 源必须配 --expect 校验,否则同名会张冠李戴")
    q = urllib.parse.quote(name)
    d = json.loads(get(f"https://www.wikidata.org/w/api.php?action=wbsearchentities&search={q}"
                       f"&language=en&format=json&limit=5"))
    want = [w.strip().lower() for w in expect.split(",") if w.strip()]
    for hit in d.get("search", []):
        desc = (hit.get("description") or "").lower()
        # 名字比对:去重音 + 要求查询里每个词都是标签里的一个完整词。
        # 不用全等——"Warren McCulloch" 的条目标签是 "Warren Sturgis McCulloch",带中间名;
        # "Martin Arjovsky" 的标签是 "Martín Arjovsky",带重音。但也不放宽成子串,否则
        # "Albert Gu" 会被 "Albert Günther" 的 gu- 前缀蒙混过去。
        lab_words = set(fold(hit.get("label") or "").split())
        if not set(fold(name).split()) <= lab_words or not any(w in desc for w in want):
            print(f"  跳过 {hit['id']} 「{hit.get('label')}」({desc[:44]}) — 与 --expect 不符")
            continue
        ent = json.loads(get(f"https://www.wikidata.org/wiki/Special:EntityData/{hit['id']}.json"))
        claims = list(ent["entities"].values())[0].get("claims", {})
        for c in claims.get("P18", []):
            f = c["mainsnak"]["datavalue"]["value"].replace(" ", "_")
            print(f"  Wikidata {hit['id']} ({desc[:44]}) → {f}")
            return get(f"https://commons.wikimedia.org/wiki/Special:FilePath/{urllib.parse.quote(f)}?width=600")
    return None


def from_github(user, expect):
    """expect:真名,必须与 GitHub 账号的 name 字段匹配(去掉大小写/中间名)。
    光凭 handle 撞名太容易拿错人(github.com/thariq 并不是 Anthropic 那位 Thariq)。"""
    d = json.loads(get(f"https://api.github.com/users/{user}"))
    real = (d.get("name") or "").lower()
    bio = (d.get("bio") or "")
    print(f"  GitHub @{user} → name='{d.get('name')}' bio='{bio[:60]}'")
    if not expect:
        raise RuntimeError("github 源必须配 --expect(真名)校验")
    want = expect.lower().split()
    if not real or not (want[0] in real and want[-1] in real):
        raise RuntimeError(f"账号真名 '{d.get('name')}' 与期望 '{expect}' 对不上,不采用")
    return get(d["avatar_url"] + "&s=600")


def from_url(url):
    if re.search(r"\.(jpe?g|png|webp)(\?|$)", url, re.I):
        return get(url)
    html = get(url).decode("utf-8", "ignore")
    for pat in (r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
                r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)'):
        m = re.search(pat, html, re.I)
        if m:
            u = urllib.parse.urljoin(url, m.group(1))
            print(f"  og:image → {u[:100]}")
            return get(u)
    raise RuntimeError("页面里没有 og:image")


def from_youtube(url, region=None):
    """region: left/right —— 双嘉宾封面(两人对谈)先切一半再检脸,避免裁到另一位。"""
    m = re.search(r"(?:youtu\.be/|v=)([\w-]{11})", url)
    vid = m.group(1)
    raw = None
    for q in ("maxresdefault", "sddefault", "hqdefault"):
        try:
            raw = get(f"https://i.ytimg.com/vi/{vid}/{q}.jpg"); break
        except Exception:
            continue
    if raw is None:
        raise RuntimeError("取不到封面")
    if region:
        from PIL import Image
        im = Image.open(BytesIO(raw)).convert("RGB"); w, h = im.size
        im = im.crop((0, 0, int(w * .5), h) if region == "left" else (int(w * .5), 0, w, h))
        buf = BytesIO(); im.save(buf, "JPEG", quality=95); raw = buf.getvalue()
        print(f"  只取封面{'左' if region == 'left' else '右'}半")
    return raw


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--pid", required=True)
    a.add_argument("--wikidata"); a.add_argument("--github")
    a.add_argument("--url"); a.add_argument("--youtube")
    a.add_argument("--expect", help="身份校验:wikidata 用描述关键词(如 'computer scientist,researcher'),github 用真名")
    a.add_argument("--region", choices=["left","right"], help="双人封面只取半边再检脸")
    a.add_argument("--zoom", type=float, default=2.6, help="裁边长÷脸宽,默认2.6;人脸靠边或周围有文字时调小")
    a.add_argument("--no-face", action="store_true", help="图已是方形人像,跳过检测直接居中裁")
    a.add_argument("--allow-faceless", action="store_true", help="明知不是人脸也要用(如机构 logo)")
    g = a.parse_args()

    for name, fn in (("wikidata", lambda: from_wikidata(g.wikidata, g.expect) if g.wikidata else None),
                     ("github", lambda: from_github(g.github, g.expect) if g.github else None),
                     ("url", lambda: from_url(g.url) if g.url else None),
                     ("youtube", lambda: from_youtube(g.youtube, g.region) if g.youtube else None)):
        try:
            raw = fn()
            if not raw:
                continue
            # save 也放进 try:检不到人脸会抛错,那就当这个来源不可用,自动去试下一个
            p = save(g.pid, raw, face=not g.no_face, zoom=g.zoom, allow_faceless=g.allow_faceless)
        except Exception as e:
            print(f"  {name} 不可用: {e}", file=sys.stderr); continue
        print(f"✓ {g.pid} ← {name} | {p} ({p.stat().st_size // 1024}KB)")
        print(f"  记得把 '{g.pid}' 加进 app.js 的 PHOTOS")
        return
    print(f"✗ {g.pid} 所有来源都没拿到", file=sys.stderr); sys.exit(1)


if __name__ == "__main__":
    main()
