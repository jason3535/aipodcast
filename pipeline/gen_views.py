#!/usr/bin/env python3
"""为有 ≥2 期的人物生成「观点演变」(基于各期已提取的核心观点/反共识+日期),注入 index.html 的 VIEWS。
不重转录,只用已有 insights。需 DEEPSEEK_API_KEY。"""
import json, os, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
BASE=Path(__file__).resolve().parent; HTML=BASE.parent/"index.html"
GLOSS=json.load(open(BASE/"glossary.json",encoding="utf-8"))
GT="\n".join(f"  {k} → {v}" for k,v in GLOSS.items() if not k.startswith("_"))
KEY=os.environ.get("DEEPSEEK_API_KEY") or sys.exit("需要 DEEPSEEK_API_KEY")
URL="https://api.deepseek.com/chat/completions"
MIN_EPS=2

def call(system,user):
    body=json.dumps({"model":"deepseek-chat","messages":[{"role":"system","content":system},
        {"role":"user","content":user}],"response_format":{"type":"json_object"},
        "max_tokens":2500,"temperature":0.3}).encode()
    op=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    last=None
    for a in range(3):
        try:
            req=urllib.request.Request(URL,data=body,headers={"Content-Type":"application/json","Authorization":f"Bearer {KEY}"})
            r=json.load(op.open(req,timeout=120));return json.loads(r["choices"][0]["message"]["content"])
        except Exception as e: last=e;time.sleep(2+a*3)
    raise RuntimeError(str(last)[:80])

SYS=f"""你是 AI Podcast 的分析编辑。下面是某位 AI 人物在不同时间、不同播客上的多次访谈,每次都附「核心观点」与「反共识」。
请据此提炼这个人的【观点演变】:他的思考随时间如何变化、有哪些一以贯之的主线、哪些立场发生了转变或深化。3-5 条。
- **必须按时间从早到近排序**(数组第一条=最早,最后一条=最近)。
- 每条给 t:该观点对应的时间标签,尽量用年份,如 "2018"、"2023→26";贯穿始终的可写 "始终"。
- 每条给 en(≤26 词)+ 地道中文 zh,正文里也尽量点出时间/变化。只基于给定材料,不杜撰。严格用术语表。
- 只输出 JSON:{{"views":[{{"t":"2018","en":"...","zh":"..."}}]}}
术语表:
{GT}"""

def load_eps():
    h=HTML.read_text(encoding="utf-8")
    a=h.index("const EPISODES = ");b=h.index("/* ====== REAL ASSETS")
    eps=json.loads(h[a+len("const EPISODES = "):b].rstrip().rstrip(";").rstrip())
    _xp=HTML.parent/"data"/"ep-extra.json"   # 合回被 split_extra 移走的 insights
    if _xp.exists():
        _extra=json.loads(_xp.read_text(encoding="utf-8"))
        for _e in eps:
            _x=_extra.get(_e.get("id")) or {}
            if not _e.get("insights") and _x.get("insights"): _e["insights"]=_x["insights"]
    return eps

def brief(e):
    ins=e.get("insights") or {}
    c="; ".join(x["en"] for x in ins.get("consensus",[]))
    k="; ".join(x["en"] for x in ins.get("contrarian",[]))
    return f"[{e.get('date')} · {e['pod']['en']}] {e.get('tEn','')}\n  核心观点: {c}\n  反共识: {k}"

eps=load_eps()
bypid={}
for e in eps:
    if e.get("insights"): bypid.setdefault(e["pid"],[]).append(e)   # ts 已外置(懒加载),用 insights 判断有内容
targets={pid:sorted(v,key=lambda e:e.get('date','')) for pid,v in bypid.items() if len(v)>=MIN_EPS}
print(f"≥{MIN_EPS} 期的人物: {len(targets)} 位 → {list(targets)}",file=sys.stderr)

def do(pid):
    body="\n\n".join(brief(e) for e in targets[pid])
    r=call(SYS,f"人物档案(按时间):\n{body}")
    return pid,r.get("views",[])

VIEWS={}
with ThreadPoolExecutor(max_workers=6) as ex:
    for f in as_completed({ex.submit(do,p):p for p in targets}):
        try: pid,v=f.result();VIEWS[pid]=v;print(f"  {pid} ✓ {len(v)} 条",file=sys.stderr)
        except Exception as e: print("  ERR",e,file=sys.stderr)

h=HTML.read_text(encoding="utf-8")
newblock="/*VIEWS_START*/const VIEWS="+json.dumps(VIEWS,ensure_ascii=False)+";/*VIEWS_END*/"
h=re.sub(r"/\*VIEWS_START\*/.*?/\*VIEWS_END\*/",lambda m:newblock,h,count=1,flags=re.S)
HTML.write_text(h,encoding="utf-8")
print(f"注入 VIEWS: {len(VIEWS)} 位",file=sys.stderr)
