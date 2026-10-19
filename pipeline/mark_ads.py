#!/usr/bin/env python3
"""给每期逐字稿标出「赞助口播」段落,写进 mcp-data/ep/<id>.json 的 ads 字段,供前端「去广告」跳过。

ads = [{"sec": 节序号, "from": 起始 turn 序号, "to": 结束 turn 序号(含), "words": 英文词数}, ...]
  - 整节都是赞助(节标题就叫 Sponsor Message / Sponsor Break / Jane Street Ad …):规则直接标整节,不花模型。
  - 赞助混在正文节里(节标题正常,但某几个 turn 是 "This episode is brought to you by…"):
    先用线索正则筛出有嫌疑的节(全站约 220 节 / 160 期),再让 DeepSeek 在该节内圈出 turn 范围。
    模型只看英文原文,输出范围;不改任何正文。
  - 没嫌疑的节不标、不请求。幂等:已有 ads 字段的期跳过(--force 重标;--ids 只处理指定期)。

全站首跑约 220 次请求(deepseek-chat,每次几千 token),几分钟、几毛钱。
postingest.sh / auto_refresh 链里按新收 id 调用,只处理新期。
"""
import argparse, json, os, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE = Path(__file__).resolve().parent
EPDIR = BASE.parent / "mcp-data" / "ep"
URL = "https://api.deepseek.com/chat/completions"

# 节标题本身就是赞助段
TITLE_RE = re.compile(r"sponsor|advertis|\bads?\b|\bad break|brought to you|promo\b|commercial break|赞助|广告", re.I)
# 节标题是「Intro and Sponsor」这种混合节:标题含赞助词但也含别的内容,交给模型圈范围而不是整节标
MIXED_RE = re.compile(r"\b(and|&|\+|with|then|,)\b", re.I)
# 正文里的赞助口播线索(主持人念的广告)
CUE_RE = re.compile(
    r"brought to you by|is sponsored by|sponsored by|today'?s sponsors?|our sponsors?|thanks? to (our )?sponsors?|"
    r"promo code|use (the )?code\b|discount code|coupon|free trial|\d+% off|percent off|sign up (at|for) [a-z0-9.-]+\.|"
    r"(go|head) (over )?to [a-z0-9.-]+\.(com|ai|io|co|dev|net)\b|visit [a-z0-9.-]+\.(com|ai|io|co|dev|net)\b|"
    r"check (out|them out at) [a-z0-9.-]+\.(com|ai|io|co|dev)|this episode is (brought|sponsored|supported)|"
    r"\.com/[a-z]+ (and|to) (get|claim|start)|special offer|terms and conditions apply|not a bank", re.I)

def words(turn): return len((turn.get("en") or "").split())

def ds(key, sys_p, user, mx=1500):
    body = json.dumps({"model": "deepseek-chat", "messages": [
        {"role": "system", "content": sys_p}, {"role": "user", "content": user}],
        "response_format": {"type": "json_object"}, "max_tokens": mx, "temperature": 0}).encode()
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    last = None
    for a in range(3):
        try:
            req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"})
            r = json.load(op.open(req, timeout=120))
            ch = r["choices"][0]
            if ch.get("finish_reason") == "length": raise RuntimeError("截断")
            return json.loads(ch["message"]["content"])
        except Exception as e:
            last = e; time.sleep(2 + a * 3)
    raise RuntimeError(str(last)[:80])

SYS = ("你是播客转录的广告标注员。给你一个章节的逐条发言(编号 + 说话人 + 英文原文)。"
       "找出其中属于「赞助口播 / 广告」的发言:主持人为赞助商念的推广(sponsor read、产品优惠码、"
       "'brought to you by'、让听众去某网站注册、'this episode is sponsored by' 等),以及紧挨着它的"
       "过渡句(如 'now back to the show'),以及节目开头/结尾感谢赞助商或请听众支持赞助商的致谢。"
       "嘉宾与主持人的正常对话、即使提到某公司产品,也不是广告。"
       "范围的首条或末条发言如果是「广告 + 正常内容」混在一条里的,要用 mixedStart / mixedEnd 标出来(true)。"
       "只输出 JSON:{\"ranges\":[{\"from\":起始编号,\"to\":结束编号,\"mixedStart\":false,\"mixedEnd\":false},...]},"
       "编号闭区间,没有广告就输出 {\"ranges\":[]}。")

def model_ranges(key, sec):
    turns = sec.get("turns") or []
    lines = []
    for i, t in enumerate(turns):
        en = (t.get("en") or "").strip()
        if len(en) > 700: en = en[:700] + " …"
        lines.append(f"[{i}] {t.get('spk','')}: {en}")
    out = ds(key, SYS, "\n".join(lines))
    rng = []
    for r in out.get("ranges") or []:
        try:
            if isinstance(r, dict):
                a, b, ms, me = int(r["from"]), int(r["to"]), bool(r.get("mixedStart")), bool(r.get("mixedEnd"))
            else:
                a, b, ms, me = int(r[0]), int(r[1]), False, False
        except Exception:
            continue
        a, b = max(0, min(a, b)), min(len(turns) - 1, max(a, b))
        # 混合边界:那条发言既有广告又有正文。短的(≤120 词)整条藏掉无伤;长的会吞正文,剔出范围、宁可露出广告尾巴。
        if ms and words(turns[a]) > 120: a += 1
        if a <= b and me and words(turns[b]) > 120: b -= 1
        if a <= b: rng.append((a, b))
    return rng

def mark(f, key, force=False):
    j = json.loads(f.read_text(encoding="utf-8"))
    if "ads" in j and not force: return f.stem, "skip", 0
    ts = j.get("transcript") or []
    ads = []; calls = 0
    for si, s in enumerate(ts):
        turns = s.get("turns") or []
        if not turns: continue
        title = s.get("sec") or ""
        if TITLE_RE.search(title) and not MIXED_RE.search(title):
            ads.append({"sec": si, "from": 0, "to": len(turns) - 1, "words": sum(words(t) for t in turns)})
            continue
        if TITLE_RE.search(title) or any(CUE_RE.search(t.get("en") or "") for t in turns):
            try:
                calls += 1
                for a, b in model_ranges(key, s):
                    ads.append({"sec": si, "from": a, "to": b, "words": sum(words(t) for t in turns[a:b + 1])})
            except Exception as e:
                return f.stem, "ERR " + str(e)[:60], calls
    j["ads"] = ads
    f.write_text(json.dumps(j, ensure_ascii=False), encoding="utf-8")
    return f.stem, f"ok {len(ads)} 段/{sum(a['words'] for a in ads)} 词" if ads else "ok 0", calls

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", nargs="*", help="只处理这些单集 id(默认全站未标的期)")
    ap.add_argument("--force", action="store_true", help="已有 ads 的也重标")
    ap.add_argument("--dry-run", action="store_true", help="只统计规则命中,不请求模型、不写文件")
    ap.add_argument("--workers", type=int, default=6)
    a = ap.parse_args()
    key = os.environ.get("DEEPSEEK_API_KEY")
    if not key and not a.dry_run: sys.exit("需要 DEEPSEEK_API_KEY")
    files = [EPDIR / f"{i}.json" for i in a.ids] if a.ids else sorted(EPDIR.glob("*.json"))
    files = [f for f in files if f.exists()]
    if a.dry_run:
        tot = sec_t = sec_m = 0
        for f in files:
            j = json.loads(f.read_text(encoding="utf-8")); tot += 1
            for s in j.get("transcript") or []:
                title = s.get("sec") or ""
                if TITLE_RE.search(title) and not MIXED_RE.search(title): sec_t += 1
                elif TITLE_RE.search(title) or any(CUE_RE.search(t.get("en") or "") for t in (s.get("turns") or [])): sec_m += 1
        print(f"{tot} 期:整节规则 {sec_t} 节,需模型圈范围 {sec_m} 节"); return
    todo = [f for f in files if a.force or "ads" not in json.loads(f.read_text(encoding="utf-8"))]
    print(f"mark_ads: 待标 {len(todo)} / {len(files)} 期", file=sys.stderr)
    ok = err = calls = 0
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        for fut in as_completed({ex.submit(mark, f, key, a.force): f for f in todo}):
            name, st, c = fut.result(); calls += c
            if st.startswith("ok"): ok += 1
            elif st.startswith("ERR"): err += 1; print(" ", name, st, file=sys.stderr)
            if ok and ok % 50 == 0: print(f"  {ok} ok", file=sys.stderr)
    print(f"mark_ads 完成:{ok} 期标好,{err} 期失败,模型调用 {calls} 次")
    if err: sys.exit(1)

if __name__ == "__main__":
    main()
