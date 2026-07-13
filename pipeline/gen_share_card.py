#!/usr/bin/env python3
"""分享素材一键产出:每期生成 即刻图(1080×1350) + X 图(1200×675) + 两平台文案。

用法:
  python3 pipeline/gen_share_card.py --ep <episode-id>     # 指定单集
  python3 pipeline/gen_share_card.py --latest 3            # 最近收录 N 期
输出: share_cards/<id>/{jike.png, x.png, copy.md}
文案用 DeepSeek 提炼(需 DEEPSEEK_API_KEY,缺省时回退模板文案)。
"""
import argparse, json, os, re, sys, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://aipodcast.jasonlin.tech"
OUT = ROOT / "share_cards"

# ---------- 字体 ----------
F_SONG = "/System/Library/Fonts/Supplemental/Songti.ttc"     # index1=SC Bold, 3=SC Light
F_HIRA = "/System/Library/Fonts/Hiragino Sans GB.ttc"        # index0=W3
F_HEITI = "/System/Library/Fonts/STHeiti Medium.ttc"
F_HELV = "/System/Library/Fonts/Helvetica.ttc"
def font(path, size, index=0):
    return ImageFont.truetype(path, size, index=index)

# ---------- 领域色(与站内 FIELDS 一致) ----------
FCOLOR = {"deep-learning": "#5B8DEF", "nlp": "#9B6BF2", "vision": "#2BB8A3",
          "rl": "#E8833A", "safety": "#D95970", "robotics": "#5AA867"}

def load_data():
    h = (ROOT / "index.html").read_text(encoding="utf-8")
    eps = json.loads(re.search(r"const EPISODES = (\[.*?\]);", h, re.S).group(1))
    extra_p = ROOT / "data" / "ep-extra.json"
    extra = json.loads(extra_p.read_text(encoding="utf-8")) if extra_p.exists() else {}
    for e in eps:
        x = extra.get(e["id"]) or {}
        if not e.get("insights") and x.get("insights"): e["insights"] = x["insights"]
        if not e.get("brief") and x.get("brief"): e["brief"] = x["brief"]
    blk = re.search(r"const PEOPLE = \{(.*?)\n\};", h, re.S).group(1)
    people = {}
    for m in re.finditer(r"'([a-z0-9]+)':\{en:'((?:[^'\\]|\\.)*)',zh:'((?:[^'\\]|\\.)*)',init:'([A-Z]{1,3})',tiEn:'((?:[^'\\]|\\.)*)',tiZh:'((?:[^'\\]|\\.)*)'", blk):
        people[m.group(1)] = {"en": m.group(2).replace("\\'", "'"), "zh": m.group(3),
                              "init": m.group(4), "tiZh": m.group(6).replace("\\'", "'")}
    return eps, people

def wrap(draw, text, fnt, maxw, max_lines):
    lines, cur = [], ""
    for ch in text:
        if draw.textlength(cur + ch, font=fnt) > maxw:
            lines.append(cur); cur = ch
            if len(lines) == max_lines: break
        else: cur += ch
    if cur and len(lines) < max_lines: lines.append(cur)
    if len(lines) == max_lines and draw.textlength(text, font=fnt) > maxw * max_lines * 0.98:
        lines[-1] = lines[-1][:-1] + "…"
    return lines

def avatar_img(pid, p, size):
    f = ROOT / "assets" / "people" / f"{pid}.jpg"
    if f.exists():
        im = Image.open(f).convert("RGB").resize((size, size), Image.LANCZOS)
    else:  # 字母头像
        im = Image.new("RGB", (size, size), FCOLOR.get("deep-learning", "#5B8DEF"))
        d = ImageDraw.Draw(im)
        fnt = font(F_HELV, int(size * 0.38))
        tw = d.textlength(p["init"], font=fnt)
        d.text(((size - tw) / 2, size * 0.30), p["init"], font=fnt, fill="#fff")
    mask = Image.new("L", (size * 2, size * 2), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * 2, size * 2), fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    return im, mask

def pick_points(e, n):
    ins = e.get("insights") or {}
    pts = [x["zh"] for x in (ins.get("consensus") or [])[:2]] + \
          [x["zh"] for x in (ins.get("contrarian") or [])[:1]]
    if not pts and e.get("brief"): pts = [x["zh"] for x in (e["brief"].get("tldr") or [])]
    return [p for p in pts if p][:n]

INK, SUB, BG = "#1B1B1F", "#6E6E76", "#FAFAF8"

def paint_common(W, H, e, p, pid):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    cols = [FCOLOR.get(f, "#5B8DEF") for f in (e.get("fields") or ["deep-learning"])]
    c1 = cols[0]; c2 = cols[1] if len(cols) > 1 else cols[0]
    # 顶部渐变条
    for x in range(W):
        t = x / W
        rgb = tuple(int(int(c1[i:i+2], 16) * (1 - t) + int(c2[i:i+2], 16) * t) for i in (1, 3, 5))
        d.line([(x, 0), (x, 10)], fill=rgb)
    return img, d, c1

def card_jike(e, p, pid, out):
    W, H = 1080, 1350
    img, d, c1 = paint_common(W, H, e, p, pid)
    P = 84
    # 品牌行
    d.ellipse((P, 78, P + 22, 100), fill=c1)
    d.text((P + 36, 70), "AI Podcast", font=font(F_HELV, 40), fill=INK)
    pod = (e.get("pod") or {}).get("zh", "")
    fnt = font(F_HIRA, 30)
    d.text((W - P - d.textlength(f"{pod} · {e.get('date','')}", font=fnt), 78),
           f"{pod} · {e.get('date','')}", font=fnt, fill=SUB)
    # 人物
    AV = 176
    av, mask = avatar_img(pid, p, AV)
    img.paste(av, (P, 170), mask)
    d.text((P + AV + 40, 190), p["en"], font=font(F_HELV, 54), fill=INK)
    d.text((P + AV + 40, 262), p["zh"], font=font(F_HIRA, 36), fill=INK)
    for i, ln in enumerate(wrap(d, p.get("tiZh", ""), font(F_HIRA, 27), W - P * 2 - AV - 40, 2)):
        d.text((P + AV + 40, 316 + i * 38), ln, font=font(F_HIRA, 27), fill=SUB)
    # 标题(宋体 Bold)
    y = 430
    tf = font(F_SONG, 62, index=1)
    for ln in wrap(d, e.get("tZh", ""), tf, W - P * 2, 3):
        d.text((P, y), ln, font=tf, fill=INK); y += 86
    y += 18
    d.line([(P, y), (P + 64, y)], fill=c1, width=6); y += 44
    # 精华 3 条
    bf = font(F_HIRA, 33)
    for pt in pick_points(e, 3):
        d.ellipse((P + 2, y + 14, P + 14, y + 26), fill=c1)
        lines = wrap(d, pt, bf, W - P * 2 - 44, 2)
        for ln in lines:
            d.text((P + 36, y), ln, font=bf, fill="#333338"); y += 48
        y += 22
        if y > H - 260: break
    # 页脚
    fy = H - 150
    d.line([(P, fy - 26), (W - P, fy - 26)], fill="#E4E4E0", width=2)
    d.text((P, fy), "aipodcast.jasonlin.tech", font=font(F_HELV, 36), fill=INK)
    hint = "中英对照全文 · 核心观点 · 免费阅读"
    hf = font(F_HIRA, 28)
    d.text((W - P - d.textlength(hint, font=hf), fy + 6), hint, font=hf, fill=SUB)
    img.save(out / "jike.png")

def card_x(e, p, pid, out):
    W, H = 1200, 675
    img, d, c1 = paint_common(W, H, e, p, pid)
    P = 72
    AV = 200
    av, mask = avatar_img(pid, p, AV)
    img.paste(av, (P, 150), mask)
    nf = font(F_HELV, 28)
    ny = 372
    for ln in wrap(d, p["en"], nf, AV + 60, 2):          # 名字限宽在左栏内
        d.text((P, ny), ln, font=nf, fill=INK); ny += 36
    d.text((P, ny + 2), p["zh"], font=font(F_HIRA, 23), fill=SUB)
    d.ellipse((P, 78, P + 18, 96), fill=c1)
    d.text((P + 30, 70), "AI Podcast", font=font(F_HELV, 32), fill=INK)
    X0 = P + AV + 80
    y = 96
    tf = font(F_SONG, 47, index=1)
    for ln in wrap(d, e.get("tZh", ""), tf, W - X0 - P, 2):
        d.text((X0, y), ln, font=tf, fill=INK); y += 66
    y += 16
    d.line([(X0, y), (X0 + 56, y)], fill=c1, width=5); y += 32
    bf = font(F_HIRA, 27)
    for pt in pick_points(e, 2):
        d.ellipse((X0 + 2, y + 11, X0 + 12, y + 21), fill=c1)
        for ln in wrap(d, pt, bf, W - X0 - P - 36, 2):
            d.text((X0 + 30, y), ln, font=bf, fill="#333338"); y += 40
        y += 16
        if y > H - 140: break
    d.text((X0, H - 90), "aipodcast.jasonlin.tech · 中英对照全文", font=font(F_HIRA, 26), fill=SUB)
    img.save(out / "x.png")

def gen_copy(e, p):
    url = f"{SITE}/#/episode/{e['id']}"
    pts = pick_points(e, 3)
    fallback = (f"【{p['zh']}|{e.get('tZh','')}】\n\n" +
                "\n".join(f"· {x}" for x in pts) +
                f"\n\n双语全文:{url}")
    key = os.environ.get("DEEPSEEK_API_KEY")
    if not key:
        return {"jike": fallback, "x": fallback[:200] + f"\n{url}"}
    sys_p = """你是社交媒体编辑。基于播客信息写两条中文分享文案,输出 JSON {"jike":"...","x":"..."}:
- jike(即刻,200-280字):口语化、有观点钩子,开头一句抓人,中间 2-3 个要点(每行一个、用 · 开头),结尾自然引导阅读,不放链接(链接单独贴)。可用 1-2 个 emoji,不要过多。
- x(X/Twitter,≤220字):更凝练,1 个钩子句 + 2 个要点 + 1-2 个中文话题标签(如 #AI),不放链接。
中英文之间加空格。不要编造内容。"""
    user = (f"人物: {p['en']} / {p['zh']}({p.get('tiZh','')})\n"
            f"标题: {e.get('tZh','')} | {e.get('tEn','')}\n"
            f"频道: {(e.get('pod') or {}).get('zh','')} · {e.get('date','')}\n"
            f"要点:\n" + "\n".join(f"- {x}" for x in pts))
    body = json.dumps({"model": "deepseek-chat", "messages": [
        {"role": "system", "content": sys_p}, {"role": "user", "content": user}],
        "response_format": {"type": "json_object"}, "max_tokens": 900, "temperature": 0.7}).encode()
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    req = urllib.request.Request("https://api.deepseek.com/chat/completions", data=body,
                                 headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    try:
        r = json.loads(json.load(op.open(req, timeout=120))["choices"][0]["message"]["content"])
        return {"jike": r.get("jike", fallback), "x": r.get("x", fallback[:200])}
    except Exception as ex:
        print("  文案生成失败,用模板:", str(ex)[:60], file=sys.stderr)
        return {"jike": fallback, "x": fallback[:200]}

def run(e, people):
    pid = e["pid"]; p = people.get(pid) or {"en": pid, "zh": "", "init": pid[:2].upper(), "tiZh": ""}
    out = OUT / e["id"]; out.mkdir(parents=True, exist_ok=True)
    card_jike(e, p, pid, out)
    card_x(e, p, pid, out)
    c = gen_copy(e, p)
    url = f"{SITE}/#/episode/{e['id']}"
    static = f"{SITE}/e/{e['id']}/"
    (out / "copy.md").write_text(
        f"# {e.get('tZh','')}\n\n## 即刻\n\n{c['jike']}\n\n{url}\n\n## X\n\n{c['x']}\n\n{static}\n", encoding="utf-8")
    print(f"✓ {e['id']} → share_cards/{e['id']}/")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ep"); ap.add_argument("--latest", type=int)
    a = ap.parse_args()
    eps, people = load_data()
    if a.ep:
        e = next((x for x in eps if x["id"] == a.ep), None) or sys.exit(f"未找到 {a.ep}")
        run(e, people)
    elif a.latest:
        for e in sorted(eps, key=lambda x: x.get("addedAt", ""), reverse=True)[:a.latest]:
            run(e, people)
    else:
        ap.print_help()

if __name__ == "__main__":
    main()
