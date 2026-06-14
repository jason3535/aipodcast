#!/usr/bin/env python3
"""把所有已生成单集的 insights.consensus 重生成为「核心观点」(从已存 ts 重建原文,不再抓字幕);保留 contrarian。"""
import json, os, sys, time, urllib.request, glob
from concurrent.futures import ThreadPoolExecutor, as_completed
BASE=os.path.dirname(os.path.abspath(__file__)); TRANS=os.path.join(BASE,"transcripts")
GLOSS=json.load(open(os.path.join(BASE,"glossary.json"),encoding="utf-8"))
GT="\n".join(f"  {k} → {v}" for k,v in GLOSS.items() if not k.startswith("_"))
KEY=os.environ.get("DEEPSEEK_API_KEY") or sys.exit("需要 DEEPSEEK_API_KEY")
URL="https://api.deepseek.com/chat/completions"
SYS=f"""你是 AI Podcast 编辑。读这期 AI 人物访谈转录,提炼【核心观点】:嘉宾在本期最重要、最值得记住的主张与判断,4-6 条,让读者一眼抓住这期在讲什么。
每条 en≤22 词 + 地道中文 zh,基于真实内容不杜撰。严格用术语表。只输出 JSON:{{"key":[{{"en":"...","zh":"..."}}]}}
术语表:
{GT}"""

def call(text):
    body=json.dumps({"model":"deepseek-chat","messages":[{"role":"system","content":SYS},
        {"role":"user","content":"转录:\n"+text[:60000]}],"response_format":{"type":"json_object"},
        "max_tokens":3000,"temperature":0.3}).encode()
    op=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    for a in range(3):
        try:
            req=urllib.request.Request(URL,data=body,headers={"Content-Type":"application/json","Authorization":f"Bearer {KEY}"})
            r=json.load(op.open(req,timeout=180))
            return json.loads(r["choices"][0]["message"]["content"])
        except Exception as e:
            last=e;time.sleep(2+a*3)
    raise RuntimeError(str(last)[:80])

def en_text(ts): return " ".join(t.get("en","") for s in ts for t in s.get("turns",[]))

# (转录文件, 存 insights 的文件) — ep_*.json 自存;kp/dario 的 insights 在单独文件
jobs=[]
for f in sorted(glob.glob(os.path.join(TRANS,"ep_*.json"))): jobs.append((f,f))
jobs.append((os.path.join(TRANS,"kp_full.json"), os.path.join(TRANS,"kp_insights.json")))
jobs.append((os.path.join(TRANS,"dario_full.json"), os.path.join(TRANS,"dario_insights.json")))

def do(job):
    src,dst=job
    d=json.load(open(src,encoding="utf-8"))
    txt=en_text(d.get("ts",[]))
    if len(txt)<500: return f"{os.path.basename(src)} 跳过(无 ts)"
    r=call(txt); key=r.get("key",[])
    ins=json.load(open(dst,encoding="utf-8")).get("insights",{}) if dst!=src else d.get("insights",{})
    if dst.endswith(("kp_insights.json","dario_insights.json")):
        ins=json.load(open(dst,encoding="utf-8"))   # 这俩文件本身就是 insights 对象
    ins["consensus"]=key
    if dst==src:
        d["insights"]=ins; json.dump(d,open(dst,"w"),ensure_ascii=False)
    else:
        json.dump(ins,open(dst,"w"),ensure_ascii=False)
    return f"{os.path.basename(dst)} ✓ 核心观点 {len(key)} 条"

t0=time.time();done=0
with ThreadPoolExecutor(max_workers=6) as ex:
    futs={ex.submit(do,j):j for j in jobs}
    for fu in as_completed(futs):
        try: print(" ",fu.result(),flush=True)
        except Exception as e: print("  ERR",e,flush=True)
        done+=1
print(f"完成 {done}/{len(jobs)} | {int(time.time()-t0)}s")
