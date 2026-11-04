#!/usr/bin/env python3
"""check_transcript.py — 转写质检门禁:专有名词误听 / 碎章节 / 明显标反的说话人。

背景:2026-11-03 Jason 问 laurentan-aiinside-2026「转写正常吗」,人工读出三类问题,现有门禁一条没拦:
  ①嘉宾自己的开源项目 pstack 被听成 P Sack ×8(中文章节名「P Sack 插件」跟着错)——
    check_guest_names 只管人名,fix_terms 只管 Anthropic 产品名;
  ②29 个章节一半以上只有一段话,「Another Piece」整节只有主持人一句 "Yeah, go for it.";
  ③一段嘉宾的话标成了 Host(前后是 嘉宾→Host→Host→嘉宾),check_diarization 走中文特征没报。

检查项(✗ 拦门禁 / ⚠ 只提示):
  ✗ glossary   pipeline/transcript_glossary.json 里登记过的误写形态(确定性:登记了就是错)
  ✗ junk-sec   整节只有 1 轮且不足 8 个英文词(章节切分把一句插话切成了一节)
  ⚠ bio-term   嘉宾简介里的专有名词在正文出现近似误写(启发式;确认后请登记进 glossary 升级成 ✗)
  ⚠ frag       章节过碎(≥15 节且一半以上只有 1 轮)
  ⚠ dup-sec    相邻两节标题几乎相同(如 Chef Analogy / The Head Chef Analogy)
  ⚠ speaker    嘉宾→Host→Host→嘉宾 且第一段 Host 是 ≥25 词的陈述(不是提问)—— 多半是嘉宾的话标成了 Host
说话人只给 ⚠:check_diarization 的原则是「宁可不改不可改错」,误报多了门禁会被整体无视(check_guest_names 头注释有前车之鉴)。

用法:python3 pipeline/check_transcript.py <epid...> | --all  [--check] [--quiet]
      --check 有 ✗ 则退出码 1(给 pre-push 门禁用)
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EPD = ROOT / "mcp-data" / "ep"
GLOSS = json.load(open(Path(__file__).with_name("transcript_glossary.json"), encoding="utf-8"))["terms"]
BL, BR = r"(?<![A-Za-z])", r"(?![A-Za-z])"     # 同 fix_terms:\b 会把 CJK 当词字符,紧贴中文时漏
for g in GLOSS:
    g["re"] = re.compile(BL + "(?:" + "|".join(g["variants"]) + ")" + BR, re.I)

try:
    DICT = {w.strip().lower() for w in open("/usr/share/dict/words", encoding="utf-8", errors="ignore")}
except OSError:
    DICT = set()

_app = (ROOT / "app.js").read_text(encoding="utf-8")
def bio_of(pid):
    m = re.search(r"'" + re.escape(pid) + r"':\{en:'(?:[^'\\]|\\.)*'.*?tiEn:'((?:[^'\\]|\\.)*)'.*?bioEn:'((?:[^'\\]|\\.)*)'", _app)
    return (m.group(1) + " " + m.group(2)) if m else ""

def lev(a, b):
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]

def strings(o, path=""):
    if isinstance(o, str):
        yield path, o
    elif isinstance(o, list):
        for i, x in enumerate(o):
            yield from strings(x, f"{path}[{i}]")
    elif isinstance(o, dict):
        for k, v in o.items():
            yield from strings(v, f"{path}.{k}" if path else k)

def where(path, d):
    """transcript[3].turns[2].zh → 「第 4 节《标题》第 3 轮(中)」"""
    m = re.match(r"transcript\[(\d+)\](?:\.turns\[(\d+)\])?\.?(\w+)?", path)
    if not m:
        return path
    si = int(m.group(1)); sec = d["transcript"][si].get("sec", "")
    s = f"第 {si+1} 节《{sec[:28]}》"
    if m.group(2) is not None:
        s += f"第 {int(m.group(2))+1} 轮"
    return s + {"zh": "(中)", "en": "(英)", "secZh": "标题(中)", "sec": "标题(英)"}.get(m.group(3) or "", "")

STOP = {"the", "a", "an", "and", "of", "to", "in", "on", "for", "with", "vs", "is", "&"}
def words(t):
    return re.findall(r"[A-Za-z0-9']+", t or "")

def scan(eid):
    E, W = [], []
    d = json.load(open(EPD / f"{eid}.json", encoding="utf-8"))
    pid = d.get("pid", "")
    # ① 登记过的误写
    for g in GLOSS:
        if g["pids"] and pid not in g["pids"]:
            continue
        hits = [(p, m.group(0)) for p, s in strings(d) for m in g["re"].finditer(s) if m.group(0) != g["canonical"]]
        if hits:
            forms = sorted({h[1] for h in hits})
            locs = sorted({where(p, d) for p, _ in hits})
            E.append(("glossary", f"「{'/'.join(forms)}」应为「{g['canonical']}」×{len(hits)}:" + "、".join(locs[:4]) + (f" 等 {len(locs)} 处" if len(locs) > 4 else "")))
    # ② 嘉宾简介里的专有名词 → 正文近似误写(⚠)
    text = " ".join(t.get("en", "") for s in d.get("transcript", []) for t in s.get("turns", []))
    toks = words(text)
    def known(w):   # 词典词或其屈折形式(agents/agentic 这类不是专有名词)
        w = w.lower()
        return w in DICT or any(w.endswith(x) and w[: -len(x)] in DICT for x in ("s", "es", "ed", "ing", "ic", "er"))
    def compound(w):  # datacenter / notetaker / superintelligence 这类两个常用词拼成的,拆写是正常变体
        w = w.lower()
        return any(known(w[:k]) and known(w[k:]) for k in range(3, len(w) - 2))
    for term in {w for w in words(bio_of(pid)) if len(w) >= 5 and not known(w) and not compound(w) and not w.isupper() and not w[0].isupper()}:
        tl = term.lower(); bad = {}
        for i in range(len(toks) - 1):
            a, b = toks[i].lower(), toks[i + 1].lower()
            if lev(a, tl) <= 1 or lev(b, tl) <= 1:      # 单个词本身就是这个名词(agents I)不算拆写
                continue
            j = a + b
            # 近似只认「单字母 + 词」(P Sack / G Stack 这类首字母被拆开再听错);完全拼合相等的任何拆写都算
            if j not in DICT and (j == tl or (min(len(a), len(b)) == 1 and lev(j, tl) == 1)):
                bad[toks[i] + " " + toks[i + 1]] = bad.get(toks[i] + " " + toks[i + 1], 0) + 1
        bad = {k: v for k, v in bad.items() if not any(g["re"].fullmatch(k) for g in GLOSS)}
        if sum(bad.values()) >= 2:
            W.append(("bio-term", f"简介里的「{term}」在正文疑似写成 " + "、".join(f"「{k}」×{v}" for k, v in bad.items()) + " —— 确认后登记进 transcript_glossary.json"))
    # ③ 章节
    ts = d.get("transcript", [])
    for si, s in enumerate(ts):
        tt = s.get("turns", [])
        n = sum(len(words(t.get("en", ""))) for t in tt)
        if len(tt) == 1 and n < 8:
            # 末节「Thanks, see you」只是难看,不拦;夹在中间的才是切错
            (W if si == len(ts) - 1 else E).append(("junk-sec", f"第 {si+1} 节《{s.get('sec','')}》整节只有 {tt[0].get('spk','?')} 一句「{tt[0].get('en','').strip()[:40]}」—— 应并入相邻章节"))
    single = sum(1 for s in ts if len(s.get("turns", [])) == 1)
    if len(ts) >= 15 and single * 2 >= len(ts):
        W.append(("frag", f"章节过碎:{len(ts)} 节里 {single} 节只有 1 轮"))
    for si in range(1, len(ts)):
        a = {w.lower() for w in words(ts[si - 1].get("sec", ""))} - STOP
        b = {w.lower() for w in words(ts[si].get("sec", ""))} - STOP
        # 一边是另一边的子集、只多 1 个词(Chef Analogy / The Head Chef Analogy)或完全相同;
        # 用 Jaccard≥0.6 时全库报 103 处,Favorite Show / Favorite Product 这类正常并列也被报
        if a and b and (a <= b or b <= a) and len(a ^ b) <= 1:
            W.append(("dup-sec", f"第 {si}/{si+1} 节标题几乎相同:《{ts[si-1]['sec']}》《{ts[si]['sec']}》"))
    # ④ 说话人:嘉宾→Host→Host→嘉宾,且第一段 Host 是长陈述
    flat = [(si, ti, t) for si, s in enumerate(ts) for ti, t in enumerate(s.get("turns", []))]
    spk = [t.get("spk") for _, _, t in flat]
    # 光看「Host 连说两轮」全库报 1515 处(主持人开场/赞助口播本来就常被切成几轮),没法用。
    # 收紧成:第一段是第一人称陈述(I/my/me ≥3 且不含 you)+ 第二段是短提问 —— 像「嘉宾答完,主持人追问」
    # 被并成了两段 Host。2026-11-04 全库 39 处,抽样多为真错标。
    if len(set(spk) - {"Host"}) <= 2:          # 多人圆桌/财报会不适用
        for i in range(1, len(flat) - 2):
            if spk[i] == spk[i + 1] == "Host" and spk[i - 1] != "Host" and spk[i + 2] != "Host":
                en, nxt = flat[i][2].get("en", ""), flat[i + 1][2].get("en", "")
                w = words(en)
                fp = sum(x in ("I", "I'm", "my", "me", "I've", "we're", "our") for x in w)
                you = sum(x.lower() in ("you", "your", "you're") for x in w)
                if len(w) >= 25 and "?" not in en and fp >= 3 and not you and "?" in nxt and len(words(nxt)) <= 30:
                    si, ti, _ = flat[i]
                    W.append(("speaker", f"第 {si+1} 节第 {ti+1} 轮标成 Host,但前后都是嘉宾、内容是第一人称陈述、下一轮才是提问:「{en[:60]}…」—— 疑似嘉宾的话"))
    return E, W

def main():
    a = sys.argv[1:]
    check, quiet = "--check" in a, "--quiet" in a
    ids = [x for x in a if not x.startswith("--")]
    if "--all" in a:
        ids = sorted(p.stem for p in EPD.glob("*.json"))
    if not ids:
        print(__doc__); sys.exit(2)
    ne = nw = nbad = 0
    for eid in ids:
        if not (EPD / f"{eid}.json").exists():
            print(f"✗ {eid}  找不到 mcp-data/ep/{eid}.json"); ne += 1; continue
        E, W = scan(eid)
        ne += len(E); nw += len(W); nbad += bool(E)
        if quiet and not (E or W):
            continue
        print(f"{'✗' if E else '⚠' if W else '✓'} {eid}" + ("" if E or W else "  转写检查通过"))
        for c, m in E:
            print(f"    ✗ [{c}] {m}")
        for c, m in W:
            print(f"    ⚠ [{c}] {m}")
    print(f"\n转写检查 {len(ids)} 期:✗ {ne} 处({nbad} 期)  ⚠ {nw} 处")
    sys.exit(1 if check and ne else 0)

if __name__ == "__main__":
    main()
