#!/usr/bin/env python3
"""
auto_refresh.py — AI Podcast 内容自动保鲜(无人值守)。

流程:发现各人物最近的新播客 → DeepSeek 选题闸门(替代人工筛) → add_episode 抓取双语全文
     → 重生成 观点演变/议题/MCP索引/分享页 → git 提交推送(Pages 自动部署)。

约束:必须在本机跑(yt-dlp 需住宅 IP;YouTube 封云 IP)。需 DEEPSEEK_API_KEY。
保守策略:每人最多收 1 期最新、全局每轮最多 MAX_ADD 期;没新内容不提交;单人失败不影响整体。

用法:
  export DEEPSEEK_API_KEY=sk-...
  python3 pipeline/auto_refresh.py            # 正式:发现→收录→推送
  python3 pipeline/auto_refresh.py --dry-run  # 只发现+选题,打印将收录什么,不抓取不推送
  python3 pipeline/auto_refresh.py --days 120 --max 6
"""
import argparse, json, os, re, subprocess, sys, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

def _pick(r):
    """取 choices[0] 的 JSON 内容。finish_reason=="length" 说明被 max_tokens 截断,
    此时 content 必然是坏 JSON —— 显式当失败抛出,不能让它伪装成"内容就这么少"
    (2026-08-01 那批 18 期空壳就是这么静默产生的)。"""
    ch = r["choices"][0]
    if ch.get("finish_reason") == "length":
        raise RuntimeError("输出被 max_tokens 截断")
    return json.loads(ch["message"]["content"])


BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
HTML = ROOT / "app.js"  # 2026-07-25 起:数据/逻辑已从 index.html 拆到独立 app.js(首屏瘦身,外链 defer 加载)
LOG = BASE / "auto_refresh.log"
KEY = os.environ.get("DEEPSEEK_API_KEY")
DS_URL = "https://api.deepseek.com/chat/completions"
HDR = {"User-Agent": "Mozilla/5.0"}

def log(msg):
    line = f"[{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}Z] {msg}"
    print(line, flush=True)
    try: LOG.open("a", encoding="utf-8").write(line + "\n")
    except Exception: pass

def ds(system, user, mx=3000):
    """DeepSeek 直连(绕 Clash 系统代理)。"""
    body = json.dumps({"model": "deepseek-chat", "messages": [
        {"role": "system", "content": system}, {"role": "user", "content": user}],
        "response_format": {"type": "json_object"}, "max_tokens": mx, "temperature": 0.1}).encode()
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    last = None
    for a in range(3):
        try:
            req = urllib.request.Request(DS_URL, data=body, headers={
                "Content-Type": "application/json", "Authorization": f"Bearer {KEY}"})
            return _pick(json.load(op.open(req, timeout=90)))
        except Exception as e: last = e; time.sleep(2 + a * 3)
    raise RuntimeError(str(last)[:80])

# ---- 从 index.html 取人物 + 已有单集(用 node,避免解析 JS 对象的坑) ----
def load_state():
    js = r'''
    const fs=require('fs');const h=fs.readFileSync(process.argv[1],'utf8');
    const EP=JSON.parse(h.match(/const EPISODES = (\[[\s\S]*?\]);\n\n\/\* ====== REAL/)[1]);
    const P=eval('('+h.match(/const PEOPLE = (\{[\s\S]*?\n\});/)[1]+')');
    const POD=h.match(/const POD_INFO=(\{[\s\S]*?\n\});\nconst POD_SLUG/);
    const podKeys=POD?[...POD[1].matchAll(/'([^']+)':\{zh:/g)].map(m=>m[1]):[];
    const vids=EP.map(e=>(e.src||'').split('/').pop());
    const latest={};EP.forEach(e=>{if(!latest[e.pid]||e.date>latest[e.pid])latest[e.pid]=e.date;});
    const people=Object.keys(P).map(pid=>({pid,en:P[pid].en,fields:P[pid].fields,latest:latest[pid]||''}));
    process.stdout.write(JSON.stringify({people,vids,podKeys}));
    '''
    out = subprocess.run(["node", "-e", js, str(HTML)], capture_output=True, text=True)
    if out.returncode: sys.exit("解析 app.js 失败:" + out.stderr[:200])
    return json.loads(out.stdout)

# ---- yt-dlp ----
def flat(q):
    try:
        d = json.loads(subprocess.run(["yt-dlp", "--skip-download", "--no-warnings", "--flat-playlist",
            "--dump-single-json", f"ytsearch10:{q}"], capture_output=True, text=True, timeout=110).stdout) or {}
        return [e for e in (d.get("entries") or []) if e]
    except Exception: return []

def meta(vid):
    try:
        d = json.loads(subprocess.run(["yt-dlp", "--skip-download", "--no-warnings", "-J",
            f"https://youtu.be/{vid}"], capture_output=True, text=True, timeout=50).stdout)
        return {"vid": vid, "date": d.get("upload_date") or "", "ch": d.get("channel") or "",
                "dur": d.get("duration") or 0, "t": d.get("title") or "",
                "desc": (d.get("description") or "")[:700],
                "cap": "en" in (d.get("automatic_captions") or {})}
    except Exception: return None


# 标题语言判定。**不能用 str.isascii()** —— 排版破折号(–)、弯引号(’)、重音字母(é)都是非 ASCII,
# 而 Dwarkesh 等频道的标准标题格式就是「嘉宾名 – 标题」。2026-08-02 之前用 isascii() 导致这些
# 频道绝大多数单集在进闸门前就被静默跳过(Adam Brown / Imas&Trammell 等都是这么丢的)。
# 正确做法:只在出现 CJK/西里尔/阿拉伯/希伯来/泰/天城文等非拉丁文字时判定为非英文。
NON_LATIN = re.compile(r"[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0400-\u04ff"
                       r"\u0590-\u05ff\u0600-\u06ff\u0e00-\u0e7f\u0900-\u097f]")

def latin_title(t):
    """标题看起来是英文(不含非拉丁文字)。"""
    return not NON_LATIN.search(t or "")

# ---- 选题闸门(DeepSeek 替代人工筛) ----
GATE_SYS = ("你是 AI Podcast 选题编辑。判断给定 YouTube 视频是否值得收录到一个「知名 AI 人物的英文播客双语全文阅读站」。"
    "收录标准:① 指定人物是**主要嘉宾/主讲**(不是被他人提及、不是多人圆桌里只占少量);"
    "② **英文**内容;③ 实质性的 AI/技术访谈、对谈或演讲(不是新闻短片、预告、混剪、纯发布会口播)。"
    "只输出 JSON:{\"keep\":true/false,\"reason\":\"简短中文理由\"}")

def gate(person, m):
    try:
        r = ds(GATE_SYS, f"人物:{person}\n标题:{m['t']}\n频道:{m['ch']}\n时长:{round(m['dur']/60)}分钟\n"
                         f"日期:{m['date']}\n简介:{m.get('desc','')[:400]}")
        return bool(r.get("keep")), r.get("reason", "")
    except Exception as e:
        return False, "gate 失败:" + str(e)[:40]

# ---- 播客台登记(双语简介 + iTunes logo) ----
def slug(n): return re.sub(r"[^a-z0-9]", "", n.lower())[:14]

def register_pod(pod_en, desc=""):
    """返回 (pod_zh, 是否新登记)。若已登记返回 (None, False)。
    desc = 该频道某期的视频简介,喂给模型当依据 —— 只给台名会瞎猜:
    "Sourcery with Molly O'Shea"(VC 访谈节目)被先后编成"探索魔法与神秘主义"和"厨师分享食谱"。"""
    h = HTML.read_text(encoding="utf-8")
    # 存进文件时单引号是转义过的(Molly O\'Shea),查重必须用同样的转义形式,
    # 否则带撇号的台名永远查不到 → 每轮重复登记一条(实测攒出 3 条重复)。
    esc = lambda s: s.replace("\\", "\\\\").replace("'", "\\'")
    if f"'{esc(pod_en)}':{{zh:" in h or f'"{pod_en}":{{zh:' in h:
        return None, False
    try:
        info = ds("根据播客/频道名和它某一期的视频简介,产出双语简介 JSON:"
                  "{\"zh\":\"中文台名\",\"host\":\"主持/机构\",\"en\":\"≤22词英文简介\",\"cn\":\"≤40字中文简介\"}。"
                  "只依据给出的材料,材料不足就写得笼统些,不要凭台名联想。只输出 JSON。",
                  f"频道名: {pod_en}\n视频简介: {desc[:600] or '(无)'}", mx=300)
    except Exception:
        info = {"zh": pod_en, "host": pod_en, "en": pod_en, "cn": pod_en}
    zh = info.get("zh", pod_en)
    # logo
    logo = None
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(
            f"https://itunes.apple.com/search?{urllib.parse.urlencode({'term': pod_en, 'media': 'podcast', 'limit': 1})}",
            headers=HDR), timeout=12))
        if d.get("results"):
            r = d["results"][0]
            if pod_en.split()[0].lower() in (r["collectionName"] + r.get("artistName", "")).lower():
                from PIL import Image
                raw = urllib.request.urlopen(urllib.request.Request(r["artworkUrl600"], headers=HDR), timeout=20).read()
                Image.open(BytesIO(raw)).convert("RGB").resize((256, 256), Image.LANCZOS).save(ROOT / "assets" / "pods" / f"{slug(pod_en)}.jpg", quality=85)
                logo = slug(pod_en)
    except Exception: pass
    entry = (f" '{esc(pod_en)}':{{zh:'{esc(zh)}',host:'{esc(info.get('host', pod_en))}',\n"
             f"   en:'{esc(info.get('en', pod_en))}',\n   cn:'{esc(info.get('cn', zh))}'}},\n")
    h = h.replace("const POD_INFO={\n", "const POD_INFO={\n" + entry, 1)
    if logo:
        h = h.replace("const POD_LOGO={\n", "const POD_LOGO={\n   '" + esc(pod_en) + "':'" + logo + "',\n", 1)
    HTML.write_text(h, encoding="utf-8")
    log(f"  + 登记新台 {pod_en}（{zh}）logo={'有' if logo else '无'}")
    return zh, True

# ---- 频道维度发现:盯重点播客频道的最新上传(与人物维度互补) ----
# handle 已逐一用 yt-dlp 核验(2026-07-03;Dive Club / Latent Space 于 2026-08-02 补入并核验)。
# 左=站内 pod.en 登记名,中=频道 /videos 页,右=是否核心频道。
#
# 核心频道(core=True):站内内容量最大的 8 个来源,**主嘉宾不在站内也收** —— 自动建人物档
# (头像回退字母,pid 记进 pending_avatars.json 供事后补真照)。非核心频道仍只收站内已有人物。
# 这条口子是 2026-08-02 加的:此前 `pid in pid_map` 一刀切,核心频道请新面孔时永远漏收
# (Dwarkesh 7/10 Adam Brown 那期就是这么丢的)。
CHANNELS = [
    ("Dive Club", "https://www.youtube.com/channel/UCkCnraWwlnBw1_i7C9-3p0w/videos", True),
    ("Lenny\u2019s Podcast", "https://www.youtube.com/@LennysPodcast/videos", True),
    ("Lex Fridman Podcast", "https://www.youtube.com/@lexfridman/videos", True),
    ("Dwarkesh Podcast", "https://www.youtube.com/@DwarkeshPatel/videos", True),
    ("Latent Space", "https://www.youtube.com/@LatentSpacePod/videos", True),
    ("Training Data", "https://www.youtube.com/@sequoiacapital/videos", True),
    ("Y Combinator", "https://www.youtube.com/@ycombinator/videos", True),
    ("Unsupervised Learning", "https://www.youtube.com/@RedpointAI/videos", True),
    ("No Priors", "https://www.youtube.com/@NoPriorsPodcast/videos", False),
    ("Machine Learning Street Talk", "https://www.youtube.com/@MachineLearningStreetTalk/videos", False),
    ("Google DeepMind", "https://www.youtube.com/@GoogleDeepMind/videos", False),
    ("The a16z Podcast", "https://www.youtube.com/@a16z/videos", False),
    ("The TWIML AI Podcast", "https://www.youtube.com/@twimlai/videos", False),
    ("20VC", "https://www.youtube.com/@20VC/videos", False),
]
FIELD_KEYS = ["deep-learning", "nlp", "product", "rl", "safety", "robotics", "bio"]

# ---- 集级领域标签:按「这一期讲什么」分类,不继承人物标签 ----
# 2026-08-08 审计:此前每期 fields 直接抄人物档(Elon 谈育儿也带 robotics、Altman 每期都带
# safety),514 期里 82% 与人物标签逐字相同,抽样准确率仅 ~64%。人物标签只作分类失败的回退。
FIELDS_SYS = ("你是 AI Podcast 编辑。根据一期播客的标题和简介,从领域清单里选 1-2 个最贴合**这一期内容**的标签。\n"
    "清单:deep-learning(深度学习/模型研究), nlp(大模型/LLM), product(产品与设计/商业/创业), "
    "rl(强化学习), safety(对齐与安全/AI 风险), robotics(机器人/具身/自动驾驶), "
    "bio(生物医药:蛋白质/药物发现/基因组/临床医疗/神经科学等 AI for bio&medicine)。\n"
    "只看这一期讲什么,不要按嘉宾身份或名气推断(安全研究员谈创业史 → product,不是 safety)。"
    "内容与 AI 技术无关(纯创业史/财报/管理/人生哲学)就只选 product。\n"
    '只输出 JSON:{"fields":["..."]}')

def classify_fields(title, desc, fallback):
    """按这一期的标题+简介选 fields;失败才回退 fallback(人物标签)。"""
    try:
        r = ds(FIELDS_SYS, f"标题:{title}\n简介:{(desc or '')[:500]}", mx=100)
        fl = [x for x in (r.get("fields") or []) if x in FIELD_KEYS][:2]
        if fl:
            return fl
    except Exception:
        pass
    return [x for x in (fallback or []) if x in FIELD_KEYS][:2] or ["nlp"]
CH_GATE_SYS = ("你是 AI Podcast 选题编辑。给定一个播客视频与站内人物名单,判断:"
    "① 视频的**主要嘉宾**是否为名单中的某个人(必须是主嘉宾/主讲,不是多人圆桌一员、不是被提及);"
    "② 英文、实质性 AI/技术访谈(不是新闻短片、预告、混剪、发布会口播)。"
    '只输出 JSON:{"keep":true/false,"pid":"名单中匹配的 pid,无则空串","guest":"嘉宾英文名","reason":"简短中文理由"}')

# 核心频道用的闸门:允许新人物,但要求模型连同人物档一起产出。
# 身份闸门比话题闸门重要 —— 本站收的是"这个人的思考",所以 DeepMind 的物理学家谈广义相对论要收,
# 历史学家谈马基雅维利、地缘政治学者谈普京不收(嘉宾本身不是 AI/技术/设计从业者)。
CORE_GATE_SYS = ("你是 AI Podcast 选题编辑。站点收录「AI/技术/产品设计领域知名人物」的英文长访谈,做双语全文。\n"
    "给定一个视频 + 站内已有人物名单,判断是否收录。\n"
    "**收录标准(全部满足)**:\n"
    "① 有明确的**单一主嘉宾**(主讲/被访者)。多人圆桌、纯主持人独白、无嘉宾的教程 → 弃。\n"
    "② 嘉宾**身份**属于:AI/ML 研究者、实验室或模型团队建设者、技术工程师、AI 产品/设计从业者。\n"
    "   → 纯财经投资人、纯媒体人、历史学家、政治/地缘学者、临床医生等非技术身份 → 弃(哪怕很有名)。\n"
    "③ 英文内容,实质性访谈/对谈/演讲(不是新闻短片、预告、混剪、发布会口播、直播切片)。\n"
    "**话题不设限**:只要嘉宾身份合格,他谈物理、数学、组织管理都收。\n\n"
    "若嘉宾已在名单中:pid 填其 pid、isNew=false、person 填 null。\n"
    "若嘉宾不在名单中且符合标准:pid 留空、isNew=true,并补全 person 人物档:\n"
    "  en=英文全名; zh=中文译名; tiEn=≤6 词英文头衔(职务, 机构); tiZh=对应中文头衔;\n"
    "  fields=从 [deep-learning, nlp, product, rl, safety, robotics] 里选 1-2 个最贴切的;\n"
    "  bioEn=1-2 句英文简介; bioZh=对应中文简介(中英文/数字之间加空格)。\n"
    '只输出 JSON:{"keep":true/false,"pid":"","guest":"嘉宾英文全名","isNew":true/false,'
    '"person":{"en":"","zh":"","tiEn":"","tiZh":"","fields":[],"bioEn":"","bioZh":""},"reason":"简短中文理由"}')


def make_pid(name, taken):
    """英文全名 → pid(小写去非字母数字)。撞车则依次追加字母/数字。"""
    base = re.sub(r"[^a-z0-9]", "", (name or "").lower()) or "person"
    pid = base[:20]
    if pid not in taken:
        return pid
    for suf in list("abcdefghijklmnopqrstuvwxyz") + [str(i) for i in range(2, 10)]:
        if pid + suf not in taken:
            return pid + suf
    return pid + str(int(time.time()))[-4:]


def ensure_person(pid, p):
    """把新人物写进 app.js 的 PEOPLE{}。**不加进 PHOTOS** —— 头像回退字母,
    pid 记进 pipeline/pending_avatars.json,事后由 avatar-hunting 流程补真照。"""
    h = HTML.read_text(encoding="utf-8")
    if "'" + pid + "':{en:" in h:
        return False
    esc = lambda s: str(s or "").replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ")
    fields = [x for x in (p.get("fields") or []) if x in FIELD_KEYS] or ["nlp"]
    init = "".join(w[0] for w in str(p.get("en") or pid).split()[:2]).upper()
    entry = ("  '" + pid + "':{en:'" + esc(p.get("en")) + "',zh:'" + esc(p.get("zh") or p.get("en")) +
             "',init:'" + esc(init) + "',tiEn:'" + esc(p.get("tiEn")) + "',tiZh:'" + esc(p.get("tiZh")) +
             "',fields:" + json.dumps(fields) + ",bioEn:'" + esc(p.get("bioEn")) +
             "',bioZh:'" + esc(p.get("bioZh")) + "'},\n")
    h = h.replace("const PEOPLE = {\n", "const PEOPLE = {\n" + entry, 1)
    HTML.write_text(h, encoding="utf-8")
    log(f"  + 新建人物 {pid}（{p.get('en')} / {p.get('zh')}）头像=字母 {init}，待补真照")
    return True


def note_pending_avatar(pid, p, pod_en):
    """记一笔待补头像,供事后批量补真照。"""
    fp = BASE / "pending_avatars.json"
    try:
        cur = json.loads(fp.read_text(encoding="utf-8"))
    except Exception:
        cur = []
    if any(x.get("pid") == pid for x in cur):
        return
    cur.append({"pid": pid, "en": p.get("en"), "zh": p.get("zh"), "tiEn": p.get("tiEn"),
                "from": pod_en, "added": datetime.now(timezone.utc).strftime("%Y-%m-%d")})
    fp.write_text(json.dumps(cur, ensure_ascii=False, indent=1), encoding="utf-8")


def drop_person(pid):
    """回滚:把刚建的人物条目从 app.js 移除(收录失败时用,避免留下 0 期的空人物页)。"""
    h = HTML.read_text(encoding="utf-8")
    pat = re.compile(r"^  '" + re.escape(pid) + r"':\{en:.*?\},\n", re.S | re.M)
    h2, n = pat.subn("", h, count=1)
    if n:
        HTML.write_text(h2, encoding="utf-8")
        log(f"  ↩ 回滚新建人物 {pid}（该期收录失败）")
    fp = BASE / "pending_avatars.json"
    try:
        cur = [x for x in json.loads(fp.read_text(encoding="utf-8")) if x.get("pid") != pid]
        fp.write_text(json.dumps(cur, ensure_ascii=False, indent=1), encoding="utf-8")
    except Exception:
        pass


def drop_pod(pod_en):
    """回滚:把刚登记的节目从 app.js 移除(收录失败时用)。
    人物档早有 drop_person(),节目登记一直没有 —— 2026-08-08 那轮 cron 就登记了
    「My First Million」但该期收录失败,留下一条 0 单集、简介还是猜的僵尸登记。"""
    esc = lambda x: x.replace("\\", "\\\\").replace("'", "\\'")
    h = HTML.read_text(encoding="utf-8")
    e = re.escape(esc(pod_en))
    h2 = re.sub(r"^\s*'" + e + r"':'[^']*',\n", "", h, flags=re.M)                      # POD_LOGO
    h2, n = re.subn(r"^ '" + e + r"':\{zh:.*?\n(?:.*?\n)*?.*?\},\n", "", h2, flags=re.M)  # POD_INFO
    if h2 != h:
        HTML.write_text(h2, encoding="utf-8")
        log(f"  ↩ 回滚新登记节目 {pod_en}（该期收录失败）")
    try: (ROOT / "assets" / "pods" / f"{slug(pod_en)}.jpg").unlink()
    except Exception: pass
    try: (ROOT / "assets" / "pods" / f"{slug(pod_en)}.webp").unlink()
    except Exception: pass


def discover_channels(people, vids, days, per_channel_cap=2):
    """每频道拉最近 10 条上传。
    核心频道(core=True):主嘉宾是站外新人也收 —— 闸门连同人物档一起产出,收录前自动建档;
    非核心频道:仍只收站内已有人物(新面孔留给人物维度/人工)。"""
    from datetime import timedelta
    exist = set(vids)
    floor = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y%m%d")
    roster = "\n".join(f"{p['pid']}: {p['en']}" for p in people)
    pid_map = {p["pid"]: p for p in people}
    taken = set(pid_map)          # 已占用 pid(含本轮新建的),防撞车
    plan = []
    for pod_en, url, core in CHANNELS:
        try:
            d = json.loads(subprocess.run(["yt-dlp", "--skip-download", "--no-warnings", "--flat-playlist",
                "--playlist-end", "10", "--dump-single-json", url],
                capture_output=True, text=True, timeout=110).stdout) or {}
            entries = [e for e in (d.get("entries") or []) if e]
        except Exception as e:
            log(f"  [频道] {pod_en} 拉取失败:{str(e)[:40]}"); continue
        kept = 0
        for e in entries:
            vid = e.get("id"); dur = e.get("duration") or 0
            if not vid or vid in exist or (dur and dur < 1500): continue
            m = meta(vid)
            if not m or not m["cap"] or m["date"] < floor: continue
            if not latin_title(m["t"]): continue
            payload = (f"频道:{pod_en}\n标题:{m['t']}\n时长:{round(m['dur']/60)}分钟\n日期:{m['date']}\n"
                       f"视频简介(判断嘉宾身份主要靠它):\n{m.get('desc','')}\n\n"
                       f"站内人物名单(pid: 姓名):\n{roster}")
            try:
                r = ds(CORE_GATE_SYS if core else CH_GATE_SYS, payload, mx=900 if core else 300)
            except Exception as ex:
                log(f"  [频道] {pod_en} gate 失败:{str(ex)[:40]}"); continue

            pid = (r.get("pid") or "").strip()
            keep = bool(r.get("keep"))
            newp = None
            if keep and core and (r.get("isNew") or pid not in pid_map):
                # 新人物:闸门给的人物档必须字段齐全才敢自动建,缺就弃(不留半张档)
                cand = r.get("person") or {}
                if cand.get("en") and cand.get("zh") and cand.get("tiEn"):
                    pid = make_pid(cand["en"], taken)
                    newp = cand
                else:
                    keep = False
                    r["reason"] = "新人物但人物档不全"
            ok = keep and (newp is not None or pid in pid_map)

            tag = ("新收:" + pid if newp else "收:" + pid) if ok else "弃"
            log(f"  [频道] {pod_en[:20]:20} {m['date']} [{round(m['dur']/60)}m] {m['t'][:44]} → {tag}({str(r.get('reason',''))[:26]})")
            if ok:
                if newp:
                    pfields = [x for x in (newp.get("fields") or []) if x in FIELD_KEYS] or ["nlp"]
                    guest = newp["en"].split()[0]
                    taken.add(pid)
                else:
                    p = pid_map[pid]; pfields = p["fields"]; guest = p["en"].split()[0]
                fields = classify_fields(m["t"], m.get("desc", ""), pfields)
                plan.append({"pid": pid, "vid": m["vid"], "date": f"{m['date'][:4]}-{m['date'][4:6]}-{m['date'][6:]}",
                             "podEn": pod_en, "min": round(m["dur"] / 60),
                             "fields": ",".join(fields), "guest": guest, "newPerson": newp})
                exist.add(vid); kept += 1
                if kept >= per_channel_cap: break
    return plan

# ---- 主流程 ----
def discover(people, vids, days, per_person_cap=1):
    """每人发现 ≤per_person_cap 期:近 days 天、比在站最新更新、英文长访谈、过选题闸门。"""
    exist = set(vids)
    cutoff = (datetime.now(timezone.utc).strftime("%Y%m%d"))
    from datetime import timedelta
    floor = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y%m%d")

    def per(p):
        pid, name = p["pid"], p["en"]
        key = name.split()[-1]  # 姓氏(粗筛;精筛交给闸门)
        cands = []
        for e in flat(f"{name} AI podcast interview"):
            vid = e.get("id"); dur = e.get("duration") or 0; t = e.get("title") or ""
            if not vid or vid in exist or dur < 1800: continue
            if key.lower() not in t.lower(): continue
            cands.append(vid)
        picks = []
        for vid in cands[:6]:
            m = meta(vid)
            if not m or not m["cap"] or not latin_title(m["t"]): continue
            if not (floor <= m["date"] <= cutoff): continue
            on = p["latest"].replace("-", "")
            if on and m["date"] <= on: continue   # 不比在站的旧
            picks.append(m)
        picks.sort(key=lambda x: x["date"], reverse=True)
        kept = []
        for m in picks:
            ok, why = gate(name, m)
            log(f"  {pid:12} {m['date']} [{round(m['dur']/60)}m] {m['t'][:48]} → {'收' if ok else '弃'}({why[:30]})")
            if ok:
                kept.append({"pid": pid, "vid": m["vid"], "date": f"{m['date'][:4]}-{m['date'][4:6]}-{m['date'][6:]}",
                             "podEn": m["ch"], "min": round(m["dur"] / 60),
                             "fields": ",".join(classify_fields(m["t"], m.get("desc", ""), p["fields"])),
                             "guest": name.split()[0]})
                if len(kept) >= per_person_cap: break
        return kept

    plan = []
    with ThreadPoolExecutor(max_workers=6) as ex:
        for res in ex.map(per, people):
            plan.extend(res)
    return plan

def run_cmd(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, cwd=str(ROOT), env={**os.environ})
    return r.returncode, (r.stderr or "") + (r.stdout or "")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--days", type=int, default=120)
    ap.add_argument("--max", type=int, default=6)
    ap.add_argument("--channels-only", action="store_true",
                    help="只跑频道维度(跳过慢的人物维度 ytsearch),用于定向补收核心频道")
    a = ap.parse_args()
    if not KEY: sys.exit("需要 DEEPSEEK_API_KEY")
    log(f"=== auto_refresh 启动 (days={a.days} max={a.max} dry={a.dry_run}) ===")

    st = load_state()
    log(f"在站:{len(st['people'])} 人 / {len(st['vids'])} 期")
    if a.channels_only:
        plan = []
        log("--channels-only:跳过人物维度")
    else:
        plan = discover(st["people"], st["vids"], a.days)
        log(f"人物维度:{len(plan)} 期;开始频道维度…")
    plan += discover_channels(st["people"], st["vids"], a.days)
    # 双维度去重(同视频) + 每人最多 2 期 + 全局限量(优先最新)
    from collections import Counter
    seen, cnt, uniq = set(), Counter(), []
    for x in sorted(plan, key=lambda x: x["date"], reverse=True):
        if x["vid"] in seen or cnt[x["pid"]] >= 2: continue
        seen.add(x["vid"]); cnt[x["pid"]] += 1; uniq.append(x)
    plan = uniq[:a.max]
    log(f"选题闸门通过、计划收录 {len(plan)} 期:" + ", ".join(f"{x['pid']}({x['date']})" for x in plan))

    if a.dry_run:
        log("dry-run:不抓取不推送。"); print(json.dumps(plan, ensure_ascii=False, indent=1)); return
    if not plan:
        log("没有新内容,结束(不提交)。"); return

    added = 0
    new_ids = []   # 收录成功的集 id,供后面做完整性审计门禁
    new_people = []          # 本轮自动建档的新人物 pid,供提交信息/待补头像清单
    for x in plan:
        np = x.get("newPerson")
        if np:
            if ensure_person(x["pid"], np):
                note_pending_avatar(x["pid"], np, x["podEn"])
                new_people.append(x["pid"])
        pod_zh, new_pod = register_pod(x["podEn"], (meta(x["vid"]) or {}).get("desc", ""))
        if pod_zh is None:  # 已登记:取其 zh 名
            h = HTML.read_text(encoding="utf-8")
            mm = re.search(r"'" + re.escape(x["podEn"].replace("'", "\\'")) + r"':\{zh:'((?:[^'\\]|\\.)*)'", h)
            pod_zh = mm.group(1) if mm else x["podEn"]
        cmd = ["python3", "pipeline/add_episode.py", "--url", f"https://youtu.be/{x['vid']}",
               "--pid", x["pid"], "--guest", x["guest"], "--pod-en", x["podEn"], "--pod-zh", pod_zh,
               "--fields", x["fields"], "--date", x["date"]]
        rc, outp = run_cmd(cmd)
        if rc == 0 and "完成" in outp:
            added += 1; log(f"  ✓ 收录 {x['pid']} {x['date']}")
            m_eid = re.search(r"完成:(\S+)", outp)
            if m_eid: new_ids.append(m_eid.group(1))
        else:
            log(f"  ✗ 失败 {x['pid']}: {outp.strip().splitlines()[-1][:80] if outp.strip() else rc}")
            if np and x["pid"] in new_people:      # 人物是为这期新建的,这期没成 → 回滚,别留空人物页
                drop_person(x["pid"]); new_people.remove(x["pid"])
            if new_pod: drop_pod(x["podEn"])

    if not added:
        log("无成功收录,不提交。"); return

    log("重生成 公司归属 / 观点演变 / 议题 / MCP 索引 / 分享页 …")
    for cmd in [["node", "pipeline/build_person_org.js"],
                ["python3", "pipeline/gen_views.py"], ["python3", "pipeline/gen_topics.py"],
                ["python3", "pipeline/gen_brief.py"], ["python3", "pipeline/gen_sectitles.py"],
                ["python3", "pipeline/fix_spacing.py"], ["python3", "pipeline/fix_terms.py"], ["python3", "pipeline/split_data.py"],
                ["node", "pipeline/build_mcp_data.js"], ["node", "pipeline/build_share_pages.js"]]:
        rc, outp = run_cmd(cmd)
        log(f"  {'✓' if rc == 0 else '✗'} {cmd[1].split('/')[-1]} {('' if rc==0 else outp[-120:])}")

    # JS 校验,过了才提交
    rc, _ = run_cmd(["node", "--check", "/dev/stdin"]) if False else (0, "")
    chk = subprocess.run(["node", "-e",
        "const fs=require('fs');const h=fs.readFileSync('app.js','utf8');"
        "new Function(h);"
        # 数据校验:领域 key 必须已登记(2026-07-02 曾因 efficiency 白屏)、id 不重复
        "const eps=JSON.parse(h.match(/const EPISODES = (\\[[\\s\\S]*?\\]);/)[1]);"
        "const fk=new Set([...h.match(/const FIELDS = \\{([\\s\\S]*?)\\n\\};/)[1].matchAll(/'([a-z-]+)':\\{en:/g)].map(m=>m[1]));"
        "const badf=eps.filter(e=>(e.fields||[]).some(f=>!fk.has(f)));"
        "if(badf.length)throw new Error('未登记领域:'+badf.map(e=>e.id).join(','));"
        "const ids=eps.map(e=>e.id);if(new Set(ids).size!==ids.length)throw new Error('重复 id');"
        "console.log('ok')"], capture_output=True, text=True, cwd=str(ROOT))
    if "ok" not in chk.stdout:
        log("⚠️ JS 校验失败,放弃提交(保留改动供人工检查):" + chk.stderr[:150]); return

    # 完整性审计门禁:只审本轮新收的集(全库有存量损坏,不能让它挡住每次自动运行)。
    # 2026-08-01 那批"空壳"集就是缺这道闸门才上线的 —— 语法是对的,内容是空的。
    if new_ids:
        rc_a, out_a = run_cmd(["node", "pipeline/audit_completeness.js"] + new_ids)
        if rc_a != 0:
            log("⚠️ 完整性审计不通过,放弃提交(保留改动供人工检查):\n" + out_a[-600:]); return
        log(f"  ✓ 完整性审计 {len(new_ids)} 期通过")

    # 术语门禁:fix_terms 跑过之后不该再有 Claude 误听残留(自动字幕把 Claude 听成
    # Cloud/Claw/Cloth/Clock 是常态,漏网就会一路发到线上)。
    rc_t, out_t = run_cmd(["python3", "pipeline/fix_terms.py", "--check"])
    if rc_t != 0:
        log("⚠️ 术语检查未通过(仍有 Claude 误听残留),放弃提交:\n" + out_t[-300:]); return

    run_cmd(["git", "add", "-A"])
    msg = f"chore: 自动保鲜 +{added} 期（{', '.join(x['pid'] for x in plan[:added])}）"
    if new_people:
        msg += f" +{len(new_people)} 新人物"
        log(f"本轮新建人物 {len(new_people)} 位（头像待补）:{', '.join(new_people)}")
    rc, outp = run_cmd(["git", "commit", "-q", "-m", msg,
        "-m", "由 pipeline/auto_refresh.py 自动收录\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"])
    rc2, outp2 = run_cmd(["git", "push", "-q", "origin", "master"])
    rc_ix, _ = run_cmd(["python3", "pipeline/indexnow.py"])   # 新收录 URL 即时推给 Bing 系(失败不影响主流程)
    log(f"  {'✓' if rc_ix == 0 else '✗'} indexnow")
    log(f"提交推送:{'✓ 已上线 +' + str(added) + ' 期' if rc2 == 0 else '✗ push 失败:' + outp2[-120:]}")
    log("=== 完成 ===")

if __name__ == "__main__":
    main()
