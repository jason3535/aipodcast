#!/usr/bin/env python3
"""gen_og_cards.py — 给播客站 / 纸站的每一期、每一位人物生成专属分享卡(OG 图,1200×630 JPEG)。

背景(2026-09-05):两站 900+ 单集页与 500+ 人物页的 og:image 全指向同一张 assets/og.png——
分享到微信/X/Slack 时所有链接长得一模一样,点开前不知道是谁、讲什么。四图谱早就有每人一张
OG 卡(/og/<id>.png),这里补齐两站,视觉沿用图谱的深色卡:站名眉题、节目/来源丸、
中文大标题(≤2 行)、英文小标题、人物·日期·时长、右侧圆头像、底部域名 + CTA。
输出 <repo>/og/e/<id>.jpg(播客单集)、<repo>/og/p/<id>.jpg(论文)、<repo>/og/pp/<pid>.jpg(人物)。
JPEG q80 约 40–70KB;PNG 会到 150KB+,900 张下来仓库多 100MB,不划算。
幂等:已存在就跳过(--force 重做;--only id1,id2 只做这些)。build_share_pages.js 会在文件存在时
把 og:image 指过来,不存在则回退 assets/og.png,所以生成失败也不会出坏链接。
用法:python3 pipeline/gen_og_cards.py --site aipodcast|aipaper [--force] [--only ids]
"""
import argparse, json, re, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

SITES = {
  "aipodcast": dict(root=Path("/Users/jason/CascadeProjects/aipodcast"), label="AI PODCAST  ·  AI 播客", domain="aipodcast.jasonlin.tech",
                    cta="读双语全文  →", item_dir="e", accent=(10, 132, 255)),
  "aipaper":   dict(root=Path("/Users/jason/Downloads/ai-paper-prototype"), label="AI PAPER  ·  双语论文", domain="aipaper.jasonlin.tech",
                    cta="读双语全文  →", item_dir="p", accent=(94, 92, 230)),
}
W, H = 1200, 630
def font(sz, bold=False):
    return ImageFont.truetype("/System/Library/Fonts/Hiragino Sans GB.ttc", sz, index=2 if bold else 0)
def wrap(d, text, f, maxw, maxlines):
    """按像素宽贪心折行(中英混排 textwrap 按字符数会失准)。超出行数末行加 …"""
    lines, cur = [], ""
    for ch in text:
        if d.textlength(cur + ch, font=f) <= maxw: cur += ch
        else:
            # 英文单词不拆:回退到最近的空格断行("Myth|os" 这种拆法 2026-09-05 试出来过)
            if ch.isascii() and ch.isalnum() and " " in cur and cur.rfind(" ") > len(cur) * 0.4:
                k = cur.rfind(" "); lines.append(cur[:k]); cur = cur[k + 1:] + ch
            else:
                lines.append(cur); cur = ch
            if len(lines) == maxlines: break
    if len(lines) < maxlines and cur: lines.append(cur)
    if len(lines) == maxlines and (d.textlength(text, font=f) > maxw * maxlines * 0.98 or cur and cur not in lines):
        last = lines[-1]
        while d.textlength(last + "…", font=f) > maxw and last: last = last[:-1]
        lines[-1] = last + "…"
    return lines
def base(site):
    img = Image.new("RGB", (W, H), (11, 13, 16)); d = ImageDraw.Draw(img)
    for y in range(H): d.line([(0, y), (W, y)], fill=(11 + y * 8 // H, 13 + y * 8 // H, 16 + y * 10 // H))
    d.text((80, 58), site["label"], font=font(24, True), fill=(142, 142, 147))
    d.text((80, 546), site["domain"], font=font(24), fill=(142, 142, 147))
    cta = site["cta"]; d.text((W - 80 - d.textlength(cta, font=font(28, True)), 540), cta, font=font(28, True), fill=(41, 151, 255))
    return img, d
def avatar(img, d, site, pid, name, cx=960, cy=300, r=160):
    ph = site["root"] / "assets" / "people" / f"{pid}.jpg"
    d.ellipse([cx - r - 8, cy - r - 8, cx + r + 8, cy + r + 8], fill=(18, 26, 40))
    if ph.exists():
        av = ImageOps.fit(Image.open(ph).convert("RGB"), (2 * r, 2 * r))
        mask = Image.new("L", (2 * r, 2 * r), 0); ImageDraw.Draw(mask).ellipse([0, 0, 2 * r, 2 * r], fill=255)
        img.paste(av, (cx - r, cy - r), mask)
    else:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=site["accent"])
        ini = "".join(w[0] for w in re.findall(r"[A-Za-z]+", name)[:2]).upper() or name[:1]
        f2 = font(120, True); d.text((cx - d.textlength(ini, font=f2) / 2, cy - 78), ini, font=f2, fill=(245, 245, 247))
def pill(d, x, y, text, color):
    f = font(24, True); w = d.textlength(text, font=f)
    d.rounded_rectangle([x, y, x + w + 44, y + 44], 22, fill=(20, 32, 54)); d.ellipse([x + 16, y + 16, x + 28, y + 28], fill=color)
    d.text((x + 38, y + 8), text, font=f, fill=(41, 151, 255))
def item_card(site, it, person, out):
    img, d = base(site); accent = site["accent"]
    src = it.get("podZh") or it.get("podEn") or it.get("venue") or it.get("org") or ""
    if src: pill(d, 80, 108, src[:28], accent)
    y = 176
    for ln in wrap(d, it.get("tZh") or it.get("tEn") or "", font(50, True), 700, 2): d.text((80, y), ln, font=font(50, True), fill=(245, 245, 247)); y += 66
    en = it.get("tEn") or ""
    if en and en != it.get("tZh"):
        d.text((82, y + 4), wrap(d, en, font(24), 700, 1)[0] if en else "", font=font(24), fill=(170, 170, 175)); y += 44
    who = " ".join(x for x in [person.get("zh", ""), person.get("en", "")] if x and x != person.get("en", "")) or person.get("en", "")
    meta = "  ·  ".join(x for x in [who, it.get("date", ""), (f'{it["min"]} min' if it.get("min") else "")] if x)
    d.text((82, y + 18), meta[:60], font=font(26), fill=(200, 200, 205))
    avatar(img, d, site, it["pid"], person.get("en") or "")
    out.parent.mkdir(parents=True, exist_ok=True); img.save(out, "JPEG", quality=80, optimize=True)
def person_card(site, p, n_items, out):
    img, d = base(site); accent = site["accent"]
    zh, en = p.get("zh") or "", p.get("en") or ""
    d.text((80, 150), (zh if zh and zh != en else en)[:16], font=font(64, True), fill=(245, 245, 247))
    if zh and zh != en: d.text((82, 236), en[:40], font=font(34), fill=(210, 210, 215))
    d.text((82, 296), (p.get("tiZh") or p.get("tiEn") or "")[:40], font=font(28), fill=(41, 151, 255))
    unit = "期双语播客全文" if site["item_dir"] == "e" else "篇双语论文全文"
    # 人物卡的 CTA 换成「看 TA 的全部」,单集卡才是「读双语全文」
    d.rectangle([W - 400, 530, W - 60, 590], fill=(11 + 8, 13 + 8, 16 + 10))
    cta = "看全部访谈  →" if site["item_dir"] == "e" else "看全部论文  →"
    d.text((W - 80 - d.textlength(cta, font=font(28, True)), 540), cta, font=font(28, True), fill=(41, 151, 255))
    d.text((82, 344), f"收录 {n_items} {unit}", font=font(26), fill=(200, 200, 205))
    y = 400
    for ln in wrap(d, p.get("bioZh") or p.get("bioEn") or "", font(24), 700, 2): d.text((82, y), ln, font=font(24), fill=(160, 160, 165)); y += 36
    avatar(img, d, site, p["pid"], en)
    out.parent.mkdir(parents=True, exist_ok=True); img.save(out, "JPEG", quality=80, optimize=True)
def load(site):
    root = site["root"]
    if site["item_dir"] == "e":
        items = json.load(open(root / "mcp-data" / "index.json", encoding="utf-8"))["episodes"]
        people = json.load(open(root / "mcp-data" / "people.json", encoding="utf-8"))["people"]
    else:
        # 纸站 data/index.json 没有 pid/venue,权威元数据在 app.js 内联 PAPERS(JSON 数组)
        s = open(root / "app.js", encoding="utf-8").read()
        m = re.search(r"const PAPERS\s*=\s*(\[[\s\S]*?\]);\s*/\* PAPERS_END", s)
        items = json.loads(m.group(1))
        pj = json.load(open(root / "data" / "people.json", encoding="utf-8")); people = pj.get("people") or pj
    return items, people
def main():
    a = argparse.ArgumentParser(); a.add_argument("--site", required=True, choices=SITES); a.add_argument("--force", action="store_true"); a.add_argument("--only", default="")
    a = a.parse_args(); site = SITES[a.site]; root = site["root"]; only = set(x for x in a.only.split(",") if x)
    items, people = load(site); P = {p["pid"]: p for p in people}
    per = {}
    for it in items: per[it["pid"]] = per.get(it["pid"], 0) + 1
    made = skip = 0
    for it in items:
        if only and it["id"] not in only: continue
        out = root / "og" / site["item_dir"] / f'{it["id"]}.jpg'
        if out.exists() and not a.force: skip += 1; continue
        item_card(site, it, P.get(it["pid"], {"en": it.get("person", ""), "zh": it.get("personZh", "")}), out); made += 1
    for p in people:
        if only and p["pid"] not in only: continue
        out = root / "og" / "pp" / f'{p["pid"]}.jpg'
        if out.exists() and not a.force: skip += 1; continue
        person_card(site, p, per.get(p["pid"], 0), out); made += 1
    print(f"gen_og_cards[{a.site}]: 新生成 {made} 张,已有跳过 {skip} 张 → {root}/og/")
if __name__ == "__main__": main()
