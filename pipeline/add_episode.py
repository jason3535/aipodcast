#!/usr/bin/env python3
"""
add_episode.py — 一条命令把一期播客做成站内双语全文(含目录、共识/反共识)并写进 index.html。

流程:抓字幕(yt-dlp) → DeepSeek 分块翻译(双语 ts) → DeepSeek 共识/反共识 → 取标题/导语
     → 存 transcripts/ep_<vid>.json → 插入 index.html 的 EPISODES[] 并按日期重排。

依赖: yt-dlp;环境变量 DEEPSEEK_API_KEY。
用法:
  export DEEPSEEK_API_KEY=sk-...
  python add_episode.py --url https://youtu.be/XXXX \
    --pid jensen --guest Jensen \
    --pod-en "Dwarkesh Podcast" --pod-zh "Dwarkesh 播客" \
    --fields deep-learning,robotics
  # 标题/导语/时长/日期不填则自动生成(DeepSeek)或取自 YouTube。
注意:--pid 必须已存在于 index.html 的 PEOPLE 中(新增人物先跑 add_person.py)。
"""
import argparse, json, os, re, subprocess, sys, tempfile, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE = Path(__file__).resolve().parent
HTML = BASE.parent / "index.html"
TRANS = BASE / "transcripts"; TRANS.mkdir(exist_ok=True)
GLOSS = json.load(open(BASE / "glossary.json", encoding="utf-8"))
GT = "\n".join(f"  {k} → {v}" for k, v in GLOSS.items() if not k.startswith("_"))
KEY = os.environ.get("DEEPSEEK_API_KEY") or sys.exit("需要环境变量 DEEPSEEK_API_KEY")
URL = "https://api.deepseek.com/chat/completions"


def call(system, user, mx=8000, retries=3):
    body = json.dumps({"model": "deepseek-chat", "messages": [
        {"role": "system", "content": system}, {"role": "user", "content": user}],
        "response_format": {"type": "json_object"}, "max_tokens": mx, "temperature": 0.3}).encode()
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # 绕系统代理直连
    last = None
    for a in range(retries):
        try:
            req = urllib.request.Request(URL, data=body, headers={
                "Content-Type": "application/json", "Authorization": f"Bearer {KEY}"})
            r = json.load(op.open(req, timeout=180))
            return json.loads(r["choices"][0]["message"]["content"])
        except Exception as e:
            last = e; time.sleep(2 + a * 3)
    raise RuntimeError(str(last)[:90])


def vid_of(url):
    m = re.search(r"(?:v=|youtu\.be/|/shorts/|/embed/)([\w-]{11})", url)
    return m.group(1) if m else url


def yt_meta(url):
    d = json.loads(subprocess.run(["yt-dlp", "--skip-download", "--no-warnings", "-J", url],
                   capture_output=True, text=True, timeout=90).stdout)
    return d.get("title", ""), round((d.get("duration") or 0) / 60), (d.get("upload_date") or "")


def get_subs(url):
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(["yt-dlp", "--skip-download", "--write-auto-subs", "--sub-lang", "en",
            "--sub-format", "vtt", "-o", f"{td}/s.%(ext)s", url], capture_output=True, timeout=150)
        v = list(Path(td).glob("*.vtt"))
        if not v:
            return ""
        out, prev = [], None
        for ln in v[0].read_text(encoding="utf-8").splitlines():
            ln = ln.strip()
            if not ln or ln == "WEBVTT" or ln.isdigit() or "-->" in ln or re.match(r"^\d{2}:\d{2}", ln):
                continue
            if ln.startswith(("Kind:", "Language:")):
                continue
            ln = re.sub(r"<[^>]+>", "", ln); ln = re.sub(r"\[[^\]]*\]", "", ln).strip()
            if ln and ln != prev:
                out.append(ln); prev = ln
        return re.sub(r"\s+", " ", " ".join(out)).strip()


def chunks(t, size=7000):
    out, i, n = [], 0, len(t)
    while i < n:
        j = min(i + size, n)
        if j < n:
            k = t.rfind('. ', i + size // 2, j)
            if k == -1:
                k = t.rfind(' ', i + size // 2, j)
            if k != -1:
                j = k + 1
        out.append(t[i:j]); i = j
    return out


def translate(text, guest):
    sec_sys = (f"""你是 AI Podcast 的播客转录编辑兼译者。输入是 AI 人物访谈的英文自动字幕。
整理成「按主题分节、按发言人分段」的中英对照阅读稿,输出 JSON。
- 清理口语、修自动字幕错词、合并碎句;不改原意,不杜撰。
- 按主题切小节,sec 用简短英文短语。节内 spk:嘉宾发言用 "{guest}",主持人用 "Host"。
- 每个 turn 同时给 en(清理后英文)和 zh(地道中文)。严格用术语表。
- 只输出 JSON:{{"ts":[{{"sec":"...","turns":[{{"spk":"...","en":"...","zh":"..."}}]}}]}}
术语表:
{GT}""")
    cks = chunks(text)
    ts = [None] * len(cks)
    with ThreadPoolExecutor(max_workers=5) as ex:
        futs = {ex.submit(call, sec_sys, "英文转录:\n" + c): i for i, c in enumerate(cks)}
        for f in as_completed(futs):
            i = futs[f]
            try: ts[i] = f.result().get("ts", [])
            except Exception: ts[i] = []
    return [s for part in ts for s in (part or [])]


def insights(text):
    ins_sys = (f"""你是 AI Podcast 编辑。读访谈英文转录,提炼两组要点,输出 JSON:
{{"consensus":[{{"en":"...","zh":"..."}}],"contrarian":[{{"en":"...","zh":"..."}}]}}
- consensus(核心观点):嘉宾在本期最重要、最值得记住的主张与判断,4-6 条。
- contrarian(反共识):与主流/普遍预期相左的逆向、反直觉观点,4-6 条。
每条 en≤22 词 + 地道中文 zh,基于真实内容不杜撰。严格用术语表。只输出 JSON。
术语表:
{GT}""")
    return call(ins_sys, "英文转录:\n" + text[:120000], mx=4000)


def meta(text, guest):
    m_sys = ("""你是 AI Podcast 编辑。基于访谈开头转录,产出元信息 JSON:
{"tEn":"英文标题(精炼)","tZh":"中文标题","sEn":"英文一句话导语","sZh":"中文一句话导语"}。只输出 JSON。""")
    return call(m_sys, "英文转录:\n" + text[:6000])


def load_episodes(html):
    a = html.index("const EPISODES = ")
    b = html.index("/* ====== REAL ASSETS")
    arr = html[a + len("const EPISODES = "):b].rstrip().rstrip(";").rstrip()
    return json.loads(arr), a, b


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--pid", required=True)
    ap.add_argument("--guest", required=True, help="嘉宾名(spk 用,如 Jensen)")
    ap.add_argument("--pod-en", required=True); ap.add_argument("--pod-zh", required=True)
    ap.add_argument("--fields", required=True, help="逗号分隔,如 deep-learning,robotics")
    ap.add_argument("--date", default=""); ap.add_argument("--min", type=int, default=0)
    ap.add_argument("--title-en", default=""); ap.add_argument("--title-zh", default="")
    ap.add_argument("--sub-en", default=""); ap.add_argument("--sub-zh", default="")
    a = ap.parse_args()

    vid = vid_of(a.url)
    print(f"[1/5] 元数据 + 字幕 {vid}", file=sys.stderr)
    ytitle, ymin, ydate = yt_meta(a.url)
    text = get_subs(a.url)
    if len(text) < 2000:
        sys.exit(f"字幕不足({len(text)} 字符),无法生成。")

    print(f"[2/5] 翻译({len(text)} 字符)", file=sys.stderr)
    ts = translate(text, a.guest)
    print(f"[3/5] 共识/反共识", file=sys.stderr)
    ins = insights(text)
    tEn, tZh, sEn, sZh = a.title_en, a.title_zh, a.sub_en, a.sub_zh
    if not (tEn and tZh and sEn and sZh):
        print(f"[3.5] 自动标题/导语", file=sys.stderr)
        m = meta(text, a.guest)
        tEn = tEn or m.get("tEn", ytitle[:60]); tZh = tZh or m.get("tZh", "")
        sEn = sEn or m.get("sEn", ""); sZh = sZh or m.get("sZh", "")

    json.dump({"ts": ts, "insights": ins}, open(TRANS / f"ep_{vid}.json", "w"), ensure_ascii=False)

    eid = f"{a.pid}-{re.sub(r'[^a-z0-9]+','',a.pod_en.lower())[:8]}-{(a.date or (ydate[:4] if ydate else ''))[:4]}"
    # 同人同播客同年会撞 id;撞了自动加后缀 b/c/d…,绝不静默替换旧集(2026-07 naval 曾因此丢过一期)
    _existing = HTML.read_text(encoding="utf-8")
    if f'"id": "{eid}"' in _existing:
        for suf in "bcdefgh":
            if f'"id": "{eid}{suf}"' not in _existing:
                eid += suf
                print(f"  id 撞车,改用:{eid}", file=sys.stderr)
                break
        else:
            sys.exit(f"id {eid} 后缀 b-h 全被占用,请手工指定")
    edate = a.date or (f"{ydate[:4]}-{ydate[4:6]}-{ydate[6:]}" if ydate else "")
    pod = {"en": a.pod_en, "zh": a.pod_zh}
    fields = [f.strip() for f in a.fields.split(",") if f.strip()]
    # 领域必须是站内已登记的 key,否则前端 fdot 渲染会挂(2026-07-02 曾因 efficiency 白屏)
    valid_fields = set(re.findall(r"'([a-z-]+)':\{en:", re.search(r"const FIELDS = \{(.*?)\n\};", open(BASE.parent / "index.html", encoding="utf-8").read(), re.S).group(1)))
    bad = [f for f in fields if f not in valid_fields]
    if bad:
        sys.exit(f"--fields 含未登记领域 {bad},可用: {sorted(valid_fields)}")
    src = f"https://youtu.be/{vid}"

    # 逐字稿权威源:写 mcp-data/ep/<id>.json(网页懒加载 + MCP 都用它);内联只存元数据,首屏才不臃肿
    epdir = BASE.parent / "mcp-data" / "ep"; epdir.mkdir(parents=True, exist_ok=True)
    json.dump({"id": eid, "pid": a.pid, "podEn": a.pod_en, "podZh": a.pod_zh,
               "date": edate, "min": a.min or ymin, "fields": fields, "tEn": tEn, "tZh": tZh, "sEn": sEn, "sZh": sZh,
               "src": src, "insights": ins, "transcript": ts},
              open(epdir / f"{eid}.json", "w"), ensure_ascii=False)

    # 内联 EPISODES 只存元数据 + insights(不含 ts),保持 index.html 轻量
    ep = {"id": eid, "pid": a.pid, "pod": pod, "date": edate, "min": a.min or ymin,
          "fields": fields, "src": src, "tEn": tEn, "tZh": tZh, "sEn": sEn, "sZh": sZh, "insights": ins,
          "addedAt": time.strftime("%Y-%m-%d")}   # 收录日(上新徽标/最近上新/RSS 用)

    print(f"[4/5] 写入 index.html(元数据)+ mcp-data/ep(全文)", file=sys.stderr)
    html = HTML.read_text(encoding="utf-8")
    if a.pid not in html:
        print(f"  ⚠️ 提醒:PEOPLE 里似乎没有 '{a.pid}',请先用 add_person.py 新增人物+照片。", file=sys.stderr)
    eps, ai, bi = load_episodes(html)
    eps = [e for e in eps if e.get("id") != ep["id"]] + [ep]
    eps.sort(key=lambda e: e.get("date", ""), reverse=True)
    html = html[:ai] + "const EPISODES = " + json.dumps(eps, ensure_ascii=False) + ";\n\n" + html[bi:]
    HTML.write_text(html, encoding="utf-8")
    print(f"[5/5] 完成:{eid} | {len(ts)} 章 + 共识{len(ins.get('consensus',[]))}/反{len(ins.get('contrarian',[]))}", file=sys.stderr)
    print(f"  提示:跑 `node pipeline/build_mcp_data.js` 刷新 MCP 检索索引,然后 git add mcp-data && push")


if __name__ == "__main__":
    main()
