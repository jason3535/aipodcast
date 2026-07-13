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

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
HTML = ROOT / "index.html"
LOG = BASE / "auto_refresh.log"
KEY = os.environ.get("DEEPSEEK_API_KEY")
DS_URL = "https://api.deepseek.com/chat/completions"
HDR = {"User-Agent": "Mozilla/5.0"}

def log(msg):
    line = f"[{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}Z] {msg}"
    print(line, flush=True)
    try: LOG.open("a", encoding="utf-8").write(line + "\n")
    except Exception: pass

def ds(system, user, mx=400):
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
            return json.loads(json.load(op.open(req, timeout=90))["choices"][0]["message"]["content"])
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
    if out.returncode: sys.exit("解析 index.html 失败:" + out.stderr[:200])
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
                "cap": "en" in (d.get("automatic_captions") or {})}
    except Exception: return None

# ---- 选题闸门(DeepSeek 替代人工筛) ----
GATE_SYS = ("你是 AI Podcast 选题编辑。判断给定 YouTube 视频是否值得收录到一个「知名 AI 人物的英文播客双语全文阅读站」。"
    "收录标准:① 指定人物是**主要嘉宾/主讲**(不是被他人提及、不是多人圆桌里只占少量);"
    "② **英文**内容;③ 实质性的 AI/技术访谈、对谈或演讲(不是新闻短片、预告、混剪、纯发布会口播)。"
    "只输出 JSON:{\"keep\":true/false,\"reason\":\"简短中文理由\"}")

def gate(person, m):
    try:
        r = ds(GATE_SYS, f"人物:{person}\n标题:{m['t']}\n频道:{m['ch']}\n时长:{round(m['dur']/60)}分钟\n日期:{m['date']}")
        return bool(r.get("keep")), r.get("reason", "")
    except Exception as e:
        return False, "gate 失败:" + str(e)[:40]

# ---- 播客台登记(双语简介 + iTunes logo) ----
def slug(n): return re.sub(r"[^a-z0-9]", "", n.lower())[:14]

def register_pod(pod_en):
    """返回 (pod_zh, 是否新登记)。若已登记返回 (None, False)。"""
    h = HTML.read_text(encoding="utf-8")
    if f"'{pod_en}':{{zh:" in h or f'"{pod_en}":{{zh:' in h:
        return None, False
    try:
        info = ds("给定一个播客/频道名,产出双语简介 JSON:{\"zh\":\"中文台名\",\"host\":\"主持/机构\",\"en\":\"≤22词英文简介\",\"cn\":\"≤40字中文简介\"}。只输出 JSON。",
                  pod_en, mx=300)
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
    esc = lambda s: s.replace("\\", "\\\\").replace("'", "\\'")
    entry = (f" '{esc(pod_en)}':{{zh:'{esc(zh)}',host:'{esc(info.get('host', pod_en))}',\n"
             f"   en:'{esc(info.get('en', pod_en))}',\n   cn:'{esc(info.get('cn', zh))}'}},\n")
    h = h.replace("const POD_INFO={\n", "const POD_INFO={\n" + entry, 1)
    if logo:
        h = h.replace("const POD_LOGO={\n", "const POD_LOGO={\n   '" + esc(pod_en) + "':'" + logo + "',\n", 1)
    HTML.write_text(h, encoding="utf-8")
    log(f"  + 登记新台 {pod_en}（{zh}）logo={'有' if logo else '无'}")
    return zh, True

# ---- 频道维度发现:盯重点播客频道的最新上传(与人物维度互补) ----
# handle 已逐一用 yt-dlp 核验(2026-07-03)。左=站内 pod.en 登记名,右=频道 /videos 页。
CHANNELS = [
    ("Lex Fridman Podcast", "https://www.youtube.com/@lexfridman/videos"),
    ("Dwarkesh Podcast", "https://www.youtube.com/@DwarkeshPatel/videos"),
    ("No Priors", "https://www.youtube.com/@NoPriorsPodcast/videos"),
    ("Machine Learning Street Talk", "https://www.youtube.com/@MachineLearningStreetTalk/videos"),
    ("Y Combinator", "https://www.youtube.com/@ycombinator/videos"),
    ("Lenny\u2019s Podcast", "https://www.youtube.com/@LennysPodcast/videos"),
    ("Training Data", "https://www.youtube.com/@sequoiacapital/videos"),
    ("20VC", "https://www.youtube.com/@20VC/videos"),
    ("Google DeepMind", "https://www.youtube.com/@GoogleDeepMind/videos"),
    ("The a16z Podcast", "https://www.youtube.com/@a16z/videos"),
    ("Unsupervised Learning", "https://www.youtube.com/@RedpointAI/videos"),
    ("The TWIML AI Podcast", "https://www.youtube.com/@twimlai/videos"),
]
CH_GATE_SYS = ("你是 AI Podcast 选题编辑。给定一个播客视频与站内人物名单,判断:"
    "① 视频的**主要嘉宾**是否为名单中的某个人(必须是主嘉宾/主讲,不是多人圆桌一员、不是被提及);"
    "② 英文、实质性 AI/技术访谈(不是新闻短片、预告、混剪、发布会口播)。"
    '只输出 JSON:{"keep":true/false,"pid":"名单中匹配的 pid,无则空串","guest":"嘉宾英文名","reason":"简短中文理由"}')

def discover_channels(people, vids, days, per_channel_cap=2):
    """每频道拉最近 10 条上传,主嘉宾必须是站内已有人物才收(新人物交给人物维度/人工)。"""
    from datetime import timedelta
    exist = set(vids)
    floor = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y%m%d")
    roster = "\n".join(f"{p['pid']}: {p['en']}" for p in people)
    pid_map = {p["pid"]: p for p in people}
    plan = []
    for pod_en, url in CHANNELS:
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
            if not m["t"].isascii(): continue
            try:
                r = ds(CH_GATE_SYS, f"频道:{pod_en}\n标题:{m['t']}\n时长:{round(m['dur']/60)}分钟\n日期:{m['date']}\n\n站内人物名单(pid: 姓名):\n{roster}", mx=300)
            except Exception as ex:
                log(f"  [频道] {pod_en} gate 失败:{str(ex)[:40]}"); continue
            pid = (r.get("pid") or "").strip()
            ok = bool(r.get("keep")) and pid in pid_map
            log(f"  [频道] {pod_en[:20]:20} {m['date']} [{round(m['dur']/60)}m] {m['t'][:44]} → {'收:'+pid if ok else '弃'}({str(r.get('reason',''))[:26]})")
            if ok:
                p = pid_map[pid]
                plan.append({"pid": pid, "vid": m["vid"], "date": f"{m['date'][:4]}-{m['date'][4:6]}-{m['date'][6:]}",
                             "podEn": pod_en, "min": round(m["dur"] / 60),
                             "fields": ",".join(p["fields"]), "guest": p["en"].split()[0]})
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
            if not m or not m["cap"] or not m["t"].isascii(): continue
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
                             "fields": ",".join(p["fields"]), "guest": name.split()[0]})
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
    a = ap.parse_args()
    if not KEY: sys.exit("需要 DEEPSEEK_API_KEY")
    log(f"=== auto_refresh 启动 (days={a.days} max={a.max} dry={a.dry_run}) ===")

    st = load_state()
    log(f"在站:{len(st['people'])} 人 / {len(st['vids'])} 期")
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
    for x in plan:
        pod_zh, _ = register_pod(x["podEn"])
        if pod_zh is None:  # 已登记:取其 zh 名
            h = HTML.read_text(encoding="utf-8")
            mm = re.search(r"'" + re.escape(x["podEn"]) + r"':\{zh:'([^']*)'", h)
            pod_zh = mm.group(1) if mm else x["podEn"]
        cmd = ["python3", "pipeline/add_episode.py", "--url", f"https://youtu.be/{x['vid']}",
               "--pid", x["pid"], "--guest", x["guest"], "--pod-en", x["podEn"], "--pod-zh", pod_zh,
               "--fields", x["fields"], "--date", x["date"]]
        rc, outp = run_cmd(cmd)
        if rc == 0 and "完成" in outp: added += 1; log(f"  ✓ 收录 {x['pid']} {x['date']}")
        else: log(f"  ✗ 失败 {x['pid']}: {outp.strip().splitlines()[-1][:80] if outp.strip() else rc}")

    if not added:
        log("无成功收录,不提交。"); return

    log("重生成 观点演变 / 议题 / MCP 索引 / 分享页 …")
    for cmd in [["python3", "pipeline/gen_views.py"], ["python3", "pipeline/gen_topics.py"],
                ["python3", "pipeline/gen_brief.py"], ["python3", "pipeline/gen_sectitles.py"],
                ["node", "pipeline/build_mcp_data.js"], ["node", "pipeline/build_share_pages.js"]]:
        rc, outp = run_cmd(cmd)
        log(f"  {'✓' if rc == 0 else '✗'} {cmd[1].split('/')[-1]} {('' if rc==0 else outp[-120:])}")

    # JS 校验,过了才提交
    rc, _ = run_cmd(["node", "--check", "/dev/stdin"]) if False else (0, "")
    chk = subprocess.run(["node", "-e",
        "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');"
        "const b=[...h.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)].map(x=>x[1]).filter(s=>s.includes('EPISODES'))[0];"
        "new Function(b);"
        # 数据校验:领域 key 必须已登记(2026-07-02 曾因 efficiency 白屏)、id 不重复
        "const eps=JSON.parse(h.match(/const EPISODES = (\\[[\\s\\S]*?\\]);/)[1]);"
        "const fk=new Set([...h.match(/const FIELDS = \\{([\\s\\S]*?)\\n\\};/)[1].matchAll(/'([a-z-]+)':\\{en:/g)].map(m=>m[1]));"
        "const badf=eps.filter(e=>(e.fields||[]).some(f=>!fk.has(f)));"
        "if(badf.length)throw new Error('未登记领域:'+badf.map(e=>e.id).join(','));"
        "const ids=eps.map(e=>e.id);if(new Set(ids).size!==ids.length)throw new Error('重复 id');"
        "console.log('ok')"], capture_output=True, text=True, cwd=str(ROOT))
    if "ok" not in chk.stdout:
        log("⚠️ JS 校验失败,放弃提交(保留改动供人工检查):" + chk.stderr[:150]); return

    run_cmd(["git", "add", "-A"])
    msg = f"chore: 自动保鲜 +{added} 期（{', '.join(x['pid'] for x in plan[:added])}）"
    rc, outp = run_cmd(["git", "commit", "-q", "-m", msg,
        "-m", "由 pipeline/auto_refresh.py 自动收录\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"])
    rc2, outp2 = run_cmd(["git", "push", "-q", "origin", "master"])
    rc_ix, _ = run_cmd(["python3", "pipeline/indexnow.py"])   # 新收录 URL 即时推给 Bing 系(失败不影响主流程)
    log(f"  {'✓' if rc_ix == 0 else '✗'} indexnow")
    log(f"提交推送:{'✓ 已上线 +' + str(added) + ' 期' if rc2 == 0 else '✗ push 失败:' + outp2[-120:]}")
    log("=== 完成 ===")

if __name__ == "__main__":
    main()
