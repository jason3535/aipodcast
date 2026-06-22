#!/usr/bin/env python3
"""给每期转录的章节标题补中文(secZh),写进 mcp-data/ep/<id>.json。
中文模式目录用它。幂等:所有节都已有 secZh 的期跳过。需 DEEPSEEK_API_KEY。"""
import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
BASE = Path(__file__).resolve().parent; EPDIR = BASE.parent / "mcp-data" / "ep"
KEY = os.environ.get("DEEPSEEK_API_KEY") or sys.exit("需要 DEEPSEEK_API_KEY")
URL = "https://api.deepseek.com/chat/completions"

def call(titles):
    sys_p = ("把下列英文播客章节标题逐条译成简洁地道的中文(每条≤14字,保留专有名词如 GPT/AGI/RLHF 原文)。"
             "只输出 JSON:{\"zh\":[\"...\",...]},顺序与数量与输入完全一致。")
    body = json.dumps({"model": "deepseek-chat", "messages": [
        {"role": "system", "content": sys_p},
        {"role": "user", "content": "\n".join(f"{i}. {t}" for i, t in enumerate(titles))}],
        "response_format": {"type": "json_object"}, "max_tokens": 1500, "temperature": 0.2}).encode()
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    last = None
    for a in range(3):
        try:
            req = urllib.request.Request(URL, data=body, headers={"Content-Type": "application/json", "Authorization": f"Bearer {KEY}"})
            return json.loads(json.load(op.open(req, timeout=120))["choices"][0]["message"]["content"]).get("zh", [])
        except Exception as e: last = e; time.sleep(2 + a * 3)
    raise RuntimeError(str(last)[:80])

def do(f):
    j = json.loads(f.read_text(encoding="utf-8"))
    ts = j.get("transcript") or []
    if not ts or all(s.get("secZh") for s in ts): return f.name, "skip"
    titles = [s.get("sec", "") for s in ts]
    try:
        zh = call(titles)
        for i, s in enumerate(ts):
            s["secZh"] = zh[i] if i < len(zh) and zh[i] else s.get("sec", "")
        f.write_text(json.dumps(j, ensure_ascii=False), encoding="utf-8")
        return f.name, "ok"
    except Exception as e:
        return f.name, "ERR " + str(e)[:40]

files = sorted(EPDIR.glob("*.json"))
todo = [f for f in files if not all(s.get("secZh") for s in (json.loads(f.read_text(encoding='utf-8')).get("transcript") or []) or [{}])]
print(f"待补中文章节标题:{len(todo)} / {len(files)} 期", file=sys.stderr)
ok = 0
with ThreadPoolExecutor(max_workers=6) as ex:
    for fut in as_completed({ex.submit(do, f): f for f in todo}):
        name, st = fut.result()
        if st == "ok": ok += 1
        if st.startswith("ERR"): print(" ", name, st, file=sys.stderr)
        if ok % 20 == 0 and ok: print(f"  {ok} ok", file=sys.stderr)
print(f"完成:{ok} 期补了 secZh", file=sys.stderr)
