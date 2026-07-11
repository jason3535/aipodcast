#!/usr/bin/env python3
"""为每期生成「速览」(TL;DR + 本期回答的问题)并给每条核心观点/反共识标注对应章节(跳原文用)。
一次 DeepSeek 调用同时产出。幂等:只处理 index.html 内联 EPISODES 里还没有 brief 的期。
章节标题从 mcp-data/ep/<id>.json 的 transcript 读。需 DEEPSEEK_API_KEY。"""
import json, os, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
BASE = Path(__file__).resolve().parent; ROOT = BASE.parent; HTML = ROOT / "index.html"
EPDIR = ROOT / "mcp-data" / "ep"
KEY = os.environ.get("DEEPSEEK_API_KEY") or sys.exit("需要 DEEPSEEK_API_KEY")
URL = "https://api.deepseek.com/chat/completions"

def call(system, user, mx=1200):
    body = json.dumps({"model": "deepseek-chat", "messages": [
        {"role": "system", "content": system}, {"role": "user", "content": user}],
        "response_format": {"type": "json_object"}, "max_tokens": mx, "temperature": 0.2}).encode()
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    last = None
    for a in range(3):
        try:
            req = urllib.request.Request(URL, data=body, headers={
                "Content-Type": "application/json", "Authorization": f"Bearer {KEY}"})
            return json.loads(json.load(op.open(req, timeout=120))["choices"][0]["message"]["content"])
        except Exception as e: last = e; time.sleep(2 + a * 3)
    raise RuntimeError(str(last)[:80])

SYS = """你是 AI Podcast 编辑。给定一期访谈的:标题、按序号的章节标题列表、嘉宾的「核心观点」与「反共识」列表。产出 JSON:
{
 "tldr":[{"en":"...","zh":"..."}],   // 恰好 3 条:一句话讲清本期最值得记住的要点(不是套话),en≤22词
 "qs":[{"en":"...","zh":"..."}],      // 恰好 3 条:本期实际回答了的具体问题(疑问句),en≤14词
 "csec":[int,...],                    // 与「核心观点」等长:每条最贴切的章节序号(0 起);找不到填 -1
 "ksec":[int,...]                     // 与「反共识」等长:同上
}
只基于给定材料,不杜撰。中文地道。只输出 JSON。"""

def load_eps(h):
    a = h.index("const EPISODES = "); b = h.index("/* ====== REAL ASSETS")
    return json.loads(h[a + len("const EPISODES = "):b].rstrip().rstrip(";").rstrip()), a, b

def secs_of(eid):
    f = EPDIR / f"{eid}.json"
    if not f.exists(): return [], 0
    try:
        j = json.loads(f.read_text(encoding="utf-8")); ts = j.get("transcript") or []
        words = sum(len((t.get("en") or "").split()) for s in ts for t in (s.get("turns") or []))
        return [s.get("sec", "") for s in ts], words
    except Exception: return [], 0

def do(e):
    ins = e.get("insights") or {}
    cons = ins.get("consensus") or []; contr = ins.get("contrarian") or []
    secs, words = secs_of(e["id"])
    if not secs or not (cons or contr): return e["id"], None
    seclist = "\n".join(f"  [{i}] {s}" for i, s in enumerate(secs))
    u = (f"标题:{e.get('tEn','')}\n章节:\n{seclist}\n"
         f"核心观点:\n" + "\n".join(f"  - {x.get('en','')}" for x in cons) +
         f"\n反共识:\n" + "\n".join(f"  - {x.get('en','')}" for x in contr))
    try:
        r = call(SYS, u)
        n = len(secs)
        clamp = lambda v: v if isinstance(v, int) and 0 <= v < n else -1
        csec = (r.get("csec") or [])[:len(cons)] + [-1] * len(cons)
        ksec = (r.get("ksec") or [])[:len(contr)] + [-1] * len(contr)
        return e["id"], {"tldr": r.get("tldr", [])[:3], "qs": r.get("qs", [])[:3], "words": words,
                         "csec": [clamp(x) for x in csec[:len(cons)]], "ksec": [clamp(x) for x in ksec[:len(contr)]]}
    except Exception as ex:
        print("  ERR", e["id"], str(ex)[:50], file=sys.stderr); return e["id"], None

def main():
    h = HTML.read_text(encoding="utf-8")
    eps, ai, bi = load_eps(h)
    extra_p = ROOT / "data" / "ep-extra.json"
    extra = json.loads(extra_p.read_text(encoding="utf-8")) if extra_p.exists() else {}
    for e in eps:   # split_extra 把 insights 移去了 ep-extra,这里合回内存供生成;收尾 split 会再移出
        x = extra.get(e.get("id")) or {}
        if not e.get("insights") and x.get("insights"): e["insights"] = x["insights"]
    todo = [e for e in eps if not e.get("brief") and not (extra.get(e.get("id"), {}) or {}).get("brief")]
    print(f"待生成速览:{len(todo)} / {len(eps)} 期", file=sys.stderr)
    if not todo: print("全部已有 brief,跳过。", file=sys.stderr); return
    res = {}
    with ThreadPoolExecutor(max_workers=6) as ex:
        for f in as_completed({ex.submit(do, e): e for e in todo}):
            eid, b = f.result()
            if b: res[eid] = b
            if len(res) % 20 == 0: print(f"  {len(res)} ok", file=sys.stderr)
    # 注入
    for e in eps:
        b = res.get(e["id"])
        if not b: continue
        e["brief"] = {"tldr": b["tldr"], "qs": b["qs"], "words": b["words"]}
        ins = e.get("insights") or {}
        for i, x in enumerate(ins.get("consensus") or []):
            if i < len(b["csec"]): x["sec"] = b["csec"][i]
        for i, x in enumerate(ins.get("contrarian") or []):
            if i < len(b["ksec"]): x["sec"] = b["ksec"][i]
    h = h[:ai] + "const EPISODES = " + json.dumps(eps, ensure_ascii=False) + ";\n\n" + h[bi:]
    HTML.write_text(h, encoding="utf-8")
    print(f"注入 brief: {len(res)} 期", file=sys.stderr)
    import subprocess as _sp
    _sp.run([sys.executable, str(BASE / "split_extra.py")], check=False)   # 新 brief 移入 ep-extra,保持首页轻量

if __name__ == "__main__":
    main()
