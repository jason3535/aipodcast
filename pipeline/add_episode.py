#!/usr/bin/env python3
"""
add_episode.py — 一条命令把一期播客做成站内双语全文(含目录、共识/反共识)并写进 app.js。

流程:抓字幕(yt-dlp) → DeepSeek 分块翻译(双语 ts) → DeepSeek 共识/反共识 → 取标题/导语
     → 存 transcripts/ep_<vid>.json → 插入 app.js 的 EPISODES[] 并按日期重排。

依赖: yt-dlp;环境变量 DEEPSEEK_API_KEY。
用法:
  export DEEPSEEK_API_KEY=sk-...
  python add_episode.py --url https://youtu.be/XXXX \
    --pid jensen --guest Jensen \
    --pod-en "Dwarkesh Podcast" --pod-zh "Dwarkesh 播客" \
    --fields deep-learning,robotics
  # 标题/导语/时长/日期不填则自动生成(DeepSeek)或取自 YouTube。
注意:--pid 必须已存在于 app.js 的 PEOPLE 中(新增人物先跑 add_person.py)。
"""
import argparse, json, os, re, subprocess, sys, tempfile, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE = Path(__file__).resolve().parent
HTML = BASE.parent / "app.js"  # 2026-07-25 起:数据/逻辑已从 index.html 拆到独立 app.js
TRANS = BASE / "transcripts"; TRANS.mkdir(exist_ok=True)
GLOSS = json.load(open(BASE / "glossary.json", encoding="utf-8"))
GT = "\n".join(f"  {k} → {v}" for k, v in GLOSS.items() if not k.startswith("_"))
KEY = os.environ.get("DEEPSEEK_API_KEY") or sys.exit("需要环境变量 DEEPSEEK_API_KEY")
URL = "https://api.deepseek.com/chat/completions"


# 模型:2026-07-25 曾从 deepseek-chat 换成 deepseek-v4-flash,2026-08-02 换回。
# v4-flash 是推理模型,reasoning_tokens 也计入 max_tokens(实测单块烧 7-12k),原来的
# max_tokens=12000 只剩约 1.5k 写正文 → finish_reason=length → JSON 截断 → 08-01 那批 18 期变空壳。
# 同一段 7000 字符转录实测:两者产出结构完全相同(4 节/10 turn),chat 24s、v4-flash 71s + 6768
# 推理 token。翻译分节是格式转换任务,推理无增量价值;且全站 490 期里 470 期是 chat 翻的,
# 混用两个模型长期会让译文风格不统一。
#
# 下面两道防护与模型选择正交,换回 chat 也保留:
#   1) mx 默认给到 32000,留足余量(chat 实测接受到 65536)
#   2) finish_reason=="length" 一律当失败重试 —— 截断必然是坏 JSON,不能让它伪装成"内容就这么少"
def call(system, user, mx=32000, retries=3):
    body = json.dumps({"model": "deepseek-chat", "messages": [
        {"role": "system", "content": system}, {"role": "user", "content": user}],
        "response_format": {"type": "json_object"}, "max_tokens": mx, "temperature": 0.3}).encode()
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # 绕系统代理直连
    last = None
    for a in range(retries):
        try:
            req = urllib.request.Request(URL, data=body, headers={
                "Content-Type": "application/json", "Authorization": f"Bearer {KEY}"})
            r = json.load(op.open(req, timeout=300))
            ch = r["choices"][0]
            if ch.get("finish_reason") == "length":  # 截断必然是坏 JSON,别让它伪装成"内容就这么少"
                raise RuntimeError(f"输出被 max_tokens={mx} 截断(reasoning={ch.get('usage',{})})")
            return json.loads(ch["message"]["content"])
        except Exception as e:
            last = e; time.sleep(2 + a * 3)
    raise RuntimeError(str(last)[:200])


def vid_of(url):
    m = re.search(r"(?:v=|youtu\.be/|/shorts/|/embed/)([\w-]{11})", url)
    return m.group(1) if m else url


def yt_meta(url):
    # YouTube 会对密集请求限流,-J 返回空/`null` 会让旧代码 d.get 崩溃。重试 + 兜底(非致命)。
    for a in range(3):
        try:
            out = subprocess.run(["yt-dlp", "--proxy", "http://127.0.0.1:7890", "--skip-download", "--no-warnings", "-J", url],
                                 capture_output=True, text=True, timeout=90).stdout
            d = json.loads(out) if out.strip() else None
            if isinstance(d, dict):
                return d.get("title", ""), round((d.get("duration") or 0) / 60), (d.get("upload_date") or "")
        except Exception:
            pass
        if a < 2:
            time.sleep(15 + a * 20)
    print("  ⚠️ yt_meta 抓取失败(限流?),标题/时长改由 CLI 参数或 DeepSeek 兜底", file=sys.stderr)
    return "", 0, ""


SUB_END_MIN = 0   # 最后一条字幕的结束时刻(分钟);yt_meta 被限流拿不到时长时用它推算

def get_subs(url):
    # 字幕端点同样会被限流返回空;重试 + 退避 + --sleep-subtitles,尽量拿到自动字幕。
    # --write-subs 是 2026-08-14 补的:部分频道(如 WIRED)只上传**人工**英文字幕,自动字幕那栏
    # 只有 "en-en"(从英文机翻回英文)这种轨,--write-auto-subs --sub-lang en 一条都匹配不到 →
    # 拿到 0 字符直接判失败。两个开关一起给,yt-dlp 有人工就用人工(质量还更高),没有才退自动。
    global SUB_END_MIN
    for attempt in range(3):
        with tempfile.TemporaryDirectory() as td:
            subprocess.run(["yt-dlp", "--proxy", "http://127.0.0.1:7890", "--skip-download", "--write-subs", "--write-auto-subs", "--sub-lang", "en",
                "--sub-format", "vtt", "--sleep-subtitles", "2", "-o", f"{td}/s.%(ext)s", url],
                capture_output=True, timeout=180)
            v = list(Path(td).glob("*.vtt"))
            if v:
                out, prev, last_ts = [], None, 0
                for ln in v[0].read_text(encoding="utf-8").splitlines():
                    ln = ln.strip()
                    if "-->" in ln:   # 记住最后一条时间轴的结束时刻,用于推算时长
                        mt = re.search(r"-->\s*(?:(\d+):)?(\d{2}):(\d{2})", ln)
                        if mt:
                            last_ts = max(last_ts, int(mt.group(1) or 0) * 3600 + int(mt.group(2)) * 60 + int(mt.group(3)))
                        continue
                    if not ln or ln == "WEBVTT" or ln.isdigit() or re.match(r"^\d{2}:\d{2}", ln):
                        continue
                    if ln.startswith(("Kind:", "Language:")):
                        continue
                    ln = re.sub(r"<[^>]+>", "", ln); ln = re.sub(r"\[[^\]]*\]", "", ln).strip()
                    if ln and ln != prev:
                        out.append(ln); prev = ln
                text = re.sub(r"\s+", " ", " ".join(out)).strip()
                if len(text) >= 2000:
                    SUB_END_MIN = round(last_ts / 60)
                    return text
        if attempt < 2:
            time.sleep(20 + attempt * 25)
    return ""


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
- 【说话人判定铁律】主持人=提问方:向对方发问(「你觉得/你怎么看/请讲讲/我很好奇你…」)、引导话题、念赞助广告、开场结尾致谢;嘉宾=被问的人,用第一人称讲亲身经历与自己公司内部("我在 Apple 时/我们团队")。称呼对方为「你」并向其提问的一定是主持人。
- 长问题会被自动字幕切碎:提问的延续部分仍属主持人,绝不能把问题后半段并进嘉宾的 turn。若一个 turn 前半是提问、后半是回答,必须拆成两个 turn 分属两人。逐 turn 自检 spk 与内容是否矛盾。
- 【禁止合并两人的话】自动字幕没有说话人标记,一段连续文字里往往藏着两个人。以下四种必须拆成独立 turn(en 与 zh 同步在句边界切):
  ① **短插话**:「什么数据？」「真的吗？」「什么时候？」「多少？」这类突然打断的短问句,是对方插话,不能并进说话人的长句里。典型错误:「数据也反驳了你的说法。什么数据？所有关于犯罪的数据。」——中间那句是对方问的。
  ② **附和后反驳**:「我同意……但那不是我要说的」之后若立场反转为维护对方被质疑的对象,则反转处开始换人。没人会对自己刚说完的话说「我同意」。
  ③ **提议与接受**:发出邀请(「我们可以去 X 转转」)与接受邀请(「当然，很乐意」)必然是两个人。
  ④ **一问一答被并轮**:「最后一次是什么时候？」+「就是几年前」+ 之后的长篇论述,是「问—答—新论述」三段,分属两人。
- 【对制作方说的话属嘉宾】「这段请保留」「别剪掉」「keep this part in」是受访者对编辑提的要求,一定是嘉宾;主持人的对应回应是「我们会全部保留」。
- 【事实一致性自检】通篇核对谁是谁:谁住在哪、谁没去过哪、谁的公司是哪家、谁在为哪家媒体工作,前后不能互相矛盾。例:同一个人不能既说「我一直住在英国」又被问「你几年没去过英国了」;说「《经济学人》的缺点和我们世界观的缺点」的只能是该媒体的人。发现矛盾就是说话人标错了,回头改正。
- 每个 turn 同时给 en(清理后英文)和 zh(地道中文)。严格用术语表。
- zh 一律使用全角中文标点（，。？！；：、弯引号“”、括号（））,不得混用半角 , ; : ? ! ( ) 或直引号 ";中英文之间、中文与数字之间加一个半角空格（如「营收 17 亿」「用 Claude Code 开发」）。
- 只输出 JSON:{{"ts":[{{"sec":"...","turns":[{{"spk":"...","en":"...","zh":"..."}}]}}]}}
术语表:
{GT}""")
    cks = chunks(text)
    ts = [None] * len(cks)
    errs = {}
    with ThreadPoolExecutor(max_workers=5) as ex:
        futs = {ex.submit(call, sec_sys, "英文转录:\n" + c): i for i, c in enumerate(cks)}
        for f in as_completed(futs):
            i = futs[f]
            try: ts[i] = f.result().get("ts", [])
            except Exception as e: ts[i] = []; errs[i] = str(e)[:160]
    # 提交门禁:任何一块翻译失败都会让全文缺一段,但页面上看不出来。宁可整期不收,也不写半截稿。
    if errs:
        for i in sorted(errs): print(f"  ✗ 第 {i+1}/{len(cks)} 块失败:{errs[i]}", file=sys.stderr)
        raise RuntimeError(f"{len(errs)}/{len(cks)} 块翻译失败,中止(不写入任何文件)")
    empty = [i for i, p in enumerate(ts) if not p]
    if empty:
        raise RuntimeError(f"第 {[i+1 for i in empty]} 块翻译返回空,中止(不写入任何文件)")
    return [s for part in ts for s in (part or [])]


def insights(text):
    ins_sys = (f"""你是 AI Podcast 编辑。读访谈英文转录,提炼两组要点,输出 JSON:
{{"consensus":[{{"en":"...","zh":"..."}}],"contrarian":[{{"en":"...","zh":"..."}}]}}
- consensus(核心观点):嘉宾在本期最重要、最值得记住的主张与判断,4-6 条。
- contrarian(反共识):与主流/普遍预期相左的逆向、反直觉观点,4-6 条。
每条 en≤22 词 + 地道中文 zh,基于真实内容不杜撰。严格用术语表。只输出 JSON。
术语表:
{GT}""")
    return call(ins_sys, "英文转录:\n" + text[:120000])  # mx 用默认 32000:推理模型下 7000 会被 reasoning 吃光


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
    # yt_meta 被限流时 ydate/ymin 会是空:日期空会让这期排到列表最底、id 变成 `xxx-` 尾巴,必须显式补
    if not edate:
        sys.exit("日期为空(yt_meta 被限流且未传 --date),请补 --date YYYY-MM-DD 后重跑")
    emin = a.min or ymin or SUB_END_MIN   # 限流拿不到时长时,用字幕末尾时间戳推算(误差通常 <1 分钟)
    if not emin:
        sys.exit("时长为空(yt_meta 被限流、未传 --min,且字幕没有可用时间轴),请补 --min <分钟> 后重跑")
    if not (a.min or ymin):
        print(f"  ⚠️ yt_meta 无时长,按字幕末尾时间轴推算为 {emin} 分钟", file=sys.stderr)
    pod = {"en": a.pod_en, "zh": a.pod_zh}
    fields = [f.strip() for f in a.fields.split(",") if f.strip()]
    # 领域必须是站内已登记的 key,否则前端 fdot 渲染会挂(2026-07-02 曾因 efficiency 白屏)
    valid_fields = set(re.findall(r"'([a-z-]+)':\{en:", re.search(r"const FIELDS = \{(.*?)\n\};", open(BASE.parent / "app.js", encoding="utf-8").read(), re.S).group(1)))
    bad = [f for f in fields if f not in valid_fields]
    if bad:
        sys.exit(f"--fields 含未登记领域 {bad},可用: {sorted(valid_fields)}")
    src = f"https://youtu.be/{vid}"

    # 逐字稿权威源:写 mcp-data/ep/<id>.json(网页懒加载 + MCP 都用它);内联只存元数据,首屏才不臃肿
    epdir = BASE.parent / "mcp-data" / "ep"; epdir.mkdir(parents=True, exist_ok=True)
    json.dump({"id": eid, "pid": a.pid, "podEn": a.pod_en, "podZh": a.pod_zh,
               "date": edate, "min": emin, "fields": fields, "tEn": tEn, "tZh": tZh, "sEn": sEn, "sZh": sZh,
               "src": src, "insights": ins, "transcript": ts},
              open(epdir / f"{eid}.json", "w"), ensure_ascii=False)

    # 内联 EPISODES 只存元数据 + insights(不含 ts),保持 index.html 轻量
    ep = {"id": eid, "pid": a.pid, "pod": pod, "date": edate, "min": emin,
          "fields": fields, "src": src, "tEn": tEn, "tZh": tZh, "sEn": sEn, "sZh": sZh, "insights": ins,
          "addedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}   # 收录时间戳(UTC,精确到秒;最近上新按此精确排序)

    print(f"[4/5] 写入 app.js(元数据)+ mcp-data/ep(全文)", file=sys.stderr)
    html = HTML.read_text(encoding="utf-8")
    if a.pid not in html:
        print(f"  ⚠️ 提醒:PEOPLE 里似乎没有 '{a.pid}',请先用 add_person.py 新增人物+照片。", file=sys.stderr)
    eps, ai, bi = load_episodes(html)
    eps = [e for e in eps if e.get("id") != ep["id"]] + [ep]
    eps.sort(key=lambda e: e.get("date", ""), reverse=True)
    html = html[:ai] + "const EPISODES = " + json.dumps(eps, ensure_ascii=False) + ";\n\n" + html[bi:]
    HTML.write_text(html, encoding="utf-8")
    try:  # 保持首页轻量:把 insights/brief 抽到 data/ep-extra.json(首屏后前端非阻塞回填)
        subprocess.run(["python3", str(Path(__file__).parent / "split_extra.py")], check=False)
    except Exception as _e:
        print(f"  ⚠️ split_extra 未跑:{_e}", file=sys.stderr)
    try:  # 说话人错标质检(只报告不改;见 diarization-check skill)
        subprocess.run(["python3", str(Path(__file__).parent / "check_diarization.py"), eid], check=False)
    except Exception as _e:
        print(f"  ⚠️ check_diarization 未跑:{_e}", file=sys.stderr)
    print(f"[5/5] 完成:{eid} | {len(ts)} 章 + 共识{len(ins.get('consensus',[]))}/反{len(ins.get('contrarian',[]))}", file=sys.stderr)
    print(f"  提示:跑 `node pipeline/build_mcp_data.js` 刷新 MCP 检索索引,然后 git add mcp-data && push")


if __name__ == "__main__":
    main()
