#!/usr/bin/env python3
"""graph_share_pages.py — 四图谱每人物静态分享页(/p/<id>.html)+ OG 图(/og/<id>.png)的
增量生成器。当初这批页面是一次性脚本生成的(脚本没留仓库),之后加的节点全都缺页
——2026-08-10 Jason 点到 investor.jasonlin.tech/p/garrytan.html 404 才暴露。固化于此。

只补缺失,不重写已有页(既有页可能有人工调整);--check 有缺口退出 1(门禁用)。
样式/脚本从该仓库任一既有页提取(保证视觉一致);OG 图按既有版式用 PIL 复刻
(深底、站名眉题、领域丸、大名、org/title、双行 bio、右侧圆头像、底部域名+CTA)。
用法:python3 pipeline/graph_share_pages.py [--apply] [--check]
"""
import html, json, re, sys, textwrap
from pathlib import Path

SITES = {
    "ai":     dict(path=Path("/Users/jason/ai-scholar-graph"),     zh="AI 学者图谱",   en="AI SCHOLAR GRAPH",   domain="ai.jasonlin.tech",       pfx="graph-ai"),
    "hw":     dict(path=Path("/Users/jason/hardware-startup-graph"),zh="智能硬件图谱", en="HARDWARE STARTUP GRAPH", domain="hardware.jasonlin.tech", pfx="graph-hw"),
    "inv":    dict(path=Path("/Users/jason/investor-graph"),       zh="投资人图谱",    en="TECH INVESTOR GRAPH", domain="investor.jasonlin.tech",  pfx="graph-inv"),
    "design": dict(path=Path("/Users/jason/designer-graph"),       zh="设计师图谱",    en="DESIGNER GRAPH",      domain="design.jasonlin.tech",    pfx="graph-design"),
}
# 匿名统计 beacon —— 片段本体在 pipeline/beacon.js(六站共用一份)。
# 2026-08-29 之前这里内联着一份「打开即发」的旧版,正是它把 8/22 那 720 次分布式
# 抓取原样记成了 720 个 UV。现在换成带停留门槛的共用版:view 口径不变(历史可比),
# 另发 type='read'(可见满 4 秒或有交互才发)作为干净的那条流。理由详见 beacon.js 头注释。
_BEACON_SRC = (Path(__file__).resolve().parent / "beacon.js").read_text(encoding="utf-8")
BEACON = (_BEACON_SRC[_BEACON_SRC.index("<script>"):_BEACON_SRC.rindex("</script>") + len("</script>")]
          .replace("%PATH%", "'%PFX%:'+location.pathname+location.search"))   # %PFX% 仍由下面按站替换
FIELD_COLOR = {  # 领域丸/字母头像渐变的主色(与站内 fdot 一致的近似值)
    "nlp":"#0a84ff","deep-learning":"#0a84ff","vision":"#30d158","rl":"#ff9f0a","safety":"#ff453a",
    "consumer":"#0a84ff","robotics":"#bf5af2","ai-infra":"#64d2ff","ar-vr":"#5e5ce6","drones":"#30d158",
    "health":"#ff375f","smart-home":"#ff9f0a","overseas":"#64d2ff",
    "us-vc":"#0a84ff","china-vc":"#ff453a","cvc":"#5e5ce6","early":"#30d158","angel":"#ff9f0a","corporate":"#64d2ff",
}

def esc(s): return html.escape(s or "", quote=True)

def parse_graph(p: Path):
    s = (p / "index.html").read_text(encoding="utf-8")
    nodes = {}
    for m in re.finditer(r'\{\s*"?id"?:\s*"([\w-]+)"\s*,\s*"?name"?:\s*"((?:[^"\\]|\\.)*)"([^\n]*)', s):
        gid, name, rest = m.group(1), m.group(2), m.group(3)
        def f(key, src):
            mm = re.search(key + r'\s*:\s*"((?:[^"\\]|\\.)*)"', src)
            return mm.group(1) if mm else ""
        # bio/papers 可能跨行:从 id 起取到下一个节点边界
        blk_end = s.find('id:"', m.end())
        blk = s[m.start(): blk_end if blk_end > 0 else m.start() + 2500]
        fields = re.findall(r'"([a-z-]+)"', (re.search(r'field:\s*\[([^\]]*)\]', blk) or [None, ""])[1] if re.search(r'field:\s*\[([^\]]*)\]', blk) else "")
        papers = re.findall(r'\{y:\s*"([^"]*)"\s*,\s*t:\s*"((?:[^"\\]|\\.)*)"\}', blk)
        nodes[gid] = dict(name=name, org=f("org", blk), title=f("title", blk),
                          bio=f("bio", blk), fields=fields, papers=papers)
    zh = {}
    zm = re.search(r"const scholarZh\s*=\s*\{(.*?)\n\};", s, re.S)
    if zm:
        for m in re.finditer(r'(\w+)\s*:\s*\{\s*zhName:\s*"((?:[^"\\]|\\.)*)"\s*,\s*title:\s*"((?:[^"\\]|\\.)*)"\s*,\s*bio:\s*"((?:[^"\\]|\\.)*)"', zm.group(1)):
            zh[m.group(1)] = dict(zhName=m.group(2), title=m.group(3), bio=m.group(4))
    conns = re.findall(r'\{source:\s*"([\w-]+)"\s*,\s*target:\s*"([\w-]+)"\s*,\s*type:\s*"[^"]*"\s*,\s*label:\s*"((?:[^"\\]|\\.)*)"\}', s)
    pod = dict(re.findall(r"([\w-]+)\s*:\s*'([^']*)'", (re.search(r"var PODCAST=\{([^;]*)\};", s) or [None, ""])[1]))
    pap = dict(re.findall(r"([\w-]+)\s*:\s*'([^']*)'", (re.search(r"var PAPER=\{([^;]*)\};", s) or [None, ""])[1]))
    photos = set(re.findall(r'"([\w-]+)"', (re.search(r"LOCAL_PHOTOS = new Set\(\[(.*?)\]\)", s, re.S) or [None, ""])[1]))
    return nodes, zh, conns, pod, pap, photos

def donor_parts(p: Path):
    """从既有任一 /p 页提取 <style> 与底部 lang script,保证视觉一致。"""
    donor = sorted((p / "p").glob("*.html"))[0].read_text(encoding="utf-8")
    style = re.search(r"<style>.*?</style>", donor, re.S).group(0)
    script = re.search(r"<script>\(function\(\)\{var b=document\.getElementById\('langtoggle'.*?</script>", donor, re.S).group(0)
    return style, script

def build_page(site, gid, n, z, neigh, pod_pid, pap_pid, has_photo, style, script):
    name, zname = n["name"], (z.get("zhName") or n["name"])
    title_zh, title_en = (z.get("title") or n["title"]), n["title"]
    bio_zh, bio_en = (z.get("bio") or n["bio"]), n["bio"]
    desc = (bio_zh or bio_en)[:150]
    url = f'https://{site["domain"]}/p/{gid}.html'
    og = f'https://{site["domain"]}/og/{gid}.png'
    c = FIELD_COLOR.get((n["fields"] or ["nlp"])[0], "#0a84ff")
    initials = "".join(w[0] for w in re.findall(r"[A-Za-z]+", name)[:2]).upper() or "??"
    avatar = (f'<img class="avatar" src="/assets/people/{gid}.jpg" alt="{esc(name)}" width="108" height="108" loading="eager">'
              if has_photo else
              f'<div class="avatar mono" style="background:linear-gradient(145deg,{c}eb,{c}80);box-shadow:0 0 0 1px rgba(255,255,255,.08),0 0 0 7px {c}24">{initials}</div>')
    tags = "".join(f'<span class="tag">{esc(f)}</span>' for f in n["fields"])
    tl = "".join(f'<li><span class="y">{esc(y)}</span> {esc(t)}</li>' for y, t in n["papers"])
    nbrs = "".join(f'<a class="nbr" href="/p/{esc(nid)}.html"><b>{esc(nm)}</b><span>{esc(lb)}</span></a>' for nid, nm, lb in neigh)
    cta2 = (f'\n<a class="cta2" href="https://aipodcast.jasonlin.tech/#/person/{esc(pod_pid)}" rel="noopener"><span class="i18n-zh">听 {esc(name)} 的 AI 播客 →</span><span class="i18n-en">Listen on AI Podcast →</span></a>' if pod_pid else "")
    cta3 = (f'\n<a class="cta2" href="https://aipaper.jasonlin.tech/#/person/{esc(pap_pid)}" rel="noopener"><span class="i18n-zh">读 {esc(name)} 的论文与长文 →</span><span class="i18n-en">Read on AI Paper →</span></a>' if pap_pid else "")
    ld = json.dumps({"@context": "https://schema.org", "@type": "ProfilePage", "mainEntity": {
        "@type": "Person", "name": name, "alternateName": zname, "jobTitle": title_en,
        "worksFor": {"@type": "Organization", "name": n["org"]}, "description": desc,
        "url": url, "image": og}}, ensure_ascii=False)
    return f'''<!doctype html><html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#000000">
<style>/* 纯深色页:钉死 dark 并把背景写在 html 上,否则 iOS Safari 状态栏区域按浅色画,
   深色页面顶上留一条白边(2026-08-15 实测) */
:root{{color-scheme:dark}}html{{background:#000}}</style>
<script>try{{document.documentElement.className=(localStorage.getItem('graphLang')==='en')?'lang-en':'lang-zh'}}catch(e){{document.documentElement.className='lang-zh'}}</script>
<title>{esc(name)} · {esc(n["org"])} | {site["zh"]}</title>
<meta name="description" content="{esc(desc)}…">
<link rel="canonical" href="{url}">
<meta property="og:type" content="profile"><meta property="og:url" content="{url}">
<meta property="og:title" content="{esc(name)} · {esc(title_en[:60])}">
<meta property="og:description" content="{esc(desc)}…">
<meta property="og:site_name" content="{site["zh"]}"><meta property="og:locale" content="zh_CN">
<meta property="og:image" content="{og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(name)}"><meta name="twitter:description" content="{esc(desc)}…">
<meta name="twitter:image" content="{og}">
<script type="application/ld+json">{ld}</script>
{style}</head><body>
<button class="langtoggle" id="langtoggle" type="button" aria-label="切换语言 / Toggle language"><span class="i18n-zh">EN</span><span class="i18n-en">中</span></button>
<div class="wrap">
<a class="eyebrow" href="/"><span class="i18n-zh">{site["zh"]}</span><span class="i18n-en">{site["en"].title()}</span> ↗</a>
{avatar}
<h1><span class="i18n-zh">{esc(zname if zname != name else name)}</span><span class="i18n-en">{esc(name)}</span></h1>
<p class="org">{esc(n["org"])}</p>
<p class="role"><span class="i18n-zh">{esc(title_zh)}</span><span class="i18n-en">{esc(title_en)}</span></p>
<div class="fields">{tags}</div>
<div class="bio i18n-zh">{esc(bio_zh)}</div><div class="bio i18n-en">{esc(bio_en)}</div>
<a class="cta" href="/?node={gid}"><span class="i18n-zh">在关系图谱中查看 {esc(name)} →</span><span class="i18n-en">View {esc(name)} in the graph →</span></a>{cta2}{cta3}

<h2><span class="i18n-zh">时间线</span><span class="i18n-en">Timeline</span></h2><ul>{tl}</ul>
<h2><span class="i18n-zh">关系网络</span><span class="i18n-en">Connections</span></h2>{nbrs}
<a class="back" href="/"><span class="i18n-zh">← 返回完整图谱</span><span class="i18n-en">← Back to the graph</span></a>
</div>
{script}
{BEACON.replace("%PFX%", site["pfx"])}
</body></html>'''

def build_og(site, gid, n, z, has_photo, out):
    from PIL import Image, ImageDraw, ImageFont
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), (11, 13, 16))
    d = ImageDraw.Draw(img)
    for y in range(H):  # 轻微对角渐变
        d.line([(0, y), (W, y)], fill=(11 + y * 8 // H, 13 + y * 8 // H, 16 + y * 10 // H))
    def font(sz, bold=False):
        # PingFang.ttc 在新 macOS 是 stub,PIL 打不开(实测 OSError);Hiragino Sans GB
        # 才是可用的 CJK 字体:index 0=W3 常规,2=W6 粗体。加载失败宁可抛错,
        # 也不静默回落 load_default(那会出全豆腐块的 OG 图,2026-08-10 踩过)。
        return ImageFont.truetype("/System/Library/Fonts/Hiragino Sans GB.ttc", sz, index=2 if bold else 0)
    grey = (142, 142, 147); blue = (41, 151, 255); white = (245, 245, 247)
    d.text((84, 64), f'{site["zh"]}  ·  {site["en"]}', font=font(26, True), fill=grey)
    c = FIELD_COLOR.get((n["fields"] or ["nlp"])[0], "#0a84ff")
    cc = tuple(int(c[i:i+2], 16) for i in (1, 3, 5))
    fld = (n["fields"] or [""])[0]
    if fld:
        fw = d.textlength(fld, font=font(24, True))
        d.rounded_rectangle([80, 138, 80 + fw + 56, 186], 24, fill=(20, 32, 54))
        d.ellipse([102, 156, 114, 168], fill=cc)
        d.text((126, 148), fld, font=font(24, True), fill=blue)
    name = n["name"]
    d.text((80, 210), name[:24], font=font(64, True), fill=white)
    d.text((82, 300), (n["org"] or "")[:40], font=font(34), fill=(210, 210, 215))
    d.text((82, 360), ((z.get("title") or n["title"]) or "")[:44], font=font(28), fill=(200, 200, 205))
    bio = (z.get("bio") or n["bio"] or "")
    lines = textwrap.wrap(bio, 26)[:2]
    if len(lines) == 2: lines[1] = lines[1][:24] + "…"
    d.text((80, 420), "\n".join(lines), font=font(26), fill=(160, 160, 165), spacing=14)
    d.text((84, 540), site["domain"], font=font(26), fill=grey)
    cta = "在关系图谱中查看  →"
    d.text((W - 90 - d.textlength(cta, font=font(28, True)), 536), cta, font=font(28, True), fill=blue)
    # 右侧圆头像
    ph = site["path"] / "assets" / "people" / f"{gid}.jpg"
    cx, cy, r = 930, 315, 188
    if has_photo and ph.exists():
        from PIL import ImageOps
        av = Image.open(ph).convert("RGB")
        av = ImageOps.fit(av, (2 * r, 2 * r))
        mask = Image.new("L", (2 * r, 2 * r), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, 2 * r, 2 * r], fill=255)
        d.ellipse([cx - r - 8, cy - r - 8, cx + r + 8, cy + r + 8], fill=(18, 26, 40))
        img.paste(av, (cx - r, cy - r), mask)
    else:
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*cc, ))
        ini = "".join(w[0] for w in re.findall(r"[A-Za-z]+", name)[:2]).upper()
        f2 = font(150, True)
        d.text((cx - d.textlength(ini, font=f2) / 2, cy - 95), ini, font=f2, fill=white)
    img.save(out)

def main():
    apply_ = "--apply" in sys.argv; check = "--check" in sys.argv
    missing_total = 0
    for key, site in SITES.items():
        p = site["path"]
        nodes, zh, conns, pod, pap, photos = parse_graph(p)
        have = {f.stem for f in (p / "p").glob("*.html")}
        missing = [g for g in nodes if g not in have]
        if not missing:
            print(f"  {key}: {len(nodes)} 节点,分享页齐"); continue
        missing_total += len(missing)
        print(f"  {key}: 缺 {len(missing)} 页 → {missing}")
        if not apply_: continue
        style, script = donor_parts(p)
        names = {g: (zh.get(g, {}).get("zhName") or nodes[g]["name"]) for g in nodes}
        for gid in missing:
            neigh = []
            for a, b, lb in conns:
                o = b if a == gid else (a if b == gid else None)
                if o and o in nodes: neigh.append((o, names[o] if names[o] == nodes[o]["name"] else f'{names[o]} {nodes[o]["name"]}', lb))
            pg = build_page(site, gid, nodes[gid], zh.get(gid, {}), neigh[:6],
                            pod.get(gid), pap.get(gid), gid in photos, style, script)
            (p / "p" / f"{gid}.html").write_text(pg, encoding="utf-8")
            build_og(site, gid, nodes[gid], zh.get(gid, {}), gid in photos, p / "og" / f"{gid}.png")
            print(f"      ✓ {gid} 页+OG 已生成")
        # sitemap 追加
        sm = p / "sitemap.xml"
        if sm.exists():
            s = sm.read_text(encoding="utf-8")
            add = [g for g in missing if f"/p/{g}.html" not in s]
            if add:
                frag = "".join(f'<url><loc>https://{site["domain"]}/p/{g}.html</loc></url>' for g in add)
                s = s.replace("</urlset>", frag + "</urlset>")
                sm.write_text(s, encoding="utf-8")
                print(f"      ✓ sitemap +{len(add)}")
    if missing_total and not apply_:
        print(f"\n共缺 {missing_total} 页(--apply 生成)")
    if check and missing_total: sys.exit(1)

if __name__ == "__main__":
    main()
