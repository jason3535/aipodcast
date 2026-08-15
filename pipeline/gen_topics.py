#!/usr/bin/env python3
"""把各期「核心观点/反共识」按议题归类,生成跨人物的【议题聚合】TOPICS,注入 index.html。
逐期分类(并发),累积到议题桶。需 DEEPSEEK_API_KEY。"""
import json,os,re,sys,time,urllib.request
from concurrent.futures import ThreadPoolExecutor,as_completed
from pathlib import Path

def _pick(r):
    """取 choices[0] 的 JSON 内容。finish_reason=="length" 说明被 max_tokens 截断,
    此时 content 必然是坏 JSON —— 显式当失败抛出,不能让它伪装成"内容就这么少"
    (2026-08-01 那批 18 期空壳就是这么静默产生的)。"""
    ch = r["choices"][0]
    if ch.get("finish_reason") == "length":
        raise RuntimeError("输出被 max_tokens 截断")
    return json.loads(ch["message"]["content"])

BASE=Path(__file__).resolve().parent;HTML=BASE.parent/"app.js"
KEY=os.environ.get("DEEPSEEK_API_KEY") or sys.exit("需要 DEEPSEEK_API_KEY")
URL="https://api.deepseek.com/chat/completions"
# 8 个核心议题(slug, 中文, 英文)
TOPICS_DEF=[
 ("self-improvement","递归自我改进与超级智能","Self-improvement & superintelligence"),   # 置顶:当前最热
 ("agi-timeline","AGI 时间表","Timeline to AGI"),
 ("scaling","规模化与瓶颈","Scaling & its limits"),
 ("rl","强化学习的角色","The role of RL"),
 ("alignment","对齐与安全","Alignment & safety"),
 ("open-closed","开源 vs 闭源","Open vs closed"),
 ("agents","智能体","Agents"),
 ("economy-jobs","就业与经济","Jobs & the economy"),
 ("architecture","架构与下一突破","Architectures & next breakthroughs"),
]
SLUGS={s for s,_,_ in TOPICS_DEF}
THEMELIST="\n".join(f"  {s}: {zh} / {en}" for s,zh,en in TOPICS_DEF)
# 2026-08-08 审计:约 20% 条目不贴合所归议题,architecture 桶被当成兜底(混入大量纯设计/招聘/
# 创业心法)。prompt 加硬性丢弃规则和负例;宁可少归不可硬塞。
SYS=f"""你是 AI Podcast 编辑。给定一位嘉宾在某期播客里的若干「观点」(中英),把每条归到最贴切的一个议题。
议题清单(只能用这些 slug):
{THEMELIST}
**丢弃规则(最重要)**:与 AI 无关的观点必须丢弃,不要硬塞进最接近的议题。以下内容一律丢弃:
- 纯设计方法论/审美品味/作品集建议(不涉及 AI 模型的)
- 招聘、管理、组织文化、职业建议
- 创业心法、融资故事、营销/品牌、人生哲学
- 纯航天/硬件财报/地缘政治(不涉及 AI 算力或模型的)
注意:architecture 只收「模型架构与技术突破」,不是产品架构或组织架构;
economy-jobs 要求真的谈就业/经济影响;agents 要求真的谈 AI 智能体。
宁可全部丢弃,也不要把不贴合的观点归进议题。
只输出 JSON:{{"items":[{{"slug":"...","en":"原英文","zh":"原中文"}}]}}。slug 必须来自清单;en/zh 原样复制不要改写。"""
def call(system,user):
    body=json.dumps({"model":"deepseek-chat","messages":[{"role":"system","content":system},{"role":"user","content":user}],
        "response_format":{"type":"json_object"},"max_tokens":5000,"temperature":0.1}).encode()
    op=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    last=None
    for a in range(3):
        try:
            req=urllib.request.Request(URL,data=body,headers={"Content-Type":"application/json","Authorization":f"Bearer {KEY}"})
            return _pick(json.load(op.open(req,timeout=120)))
        except Exception as e:last=e;time.sleep(2+a*3)
    raise RuntimeError(str(last)[:80])
h=HTML.read_text(encoding="utf-8")
eps=json.loads(h.match if False else re.search(r"const EPISODES = (\[.*?\]);\n\n/\* ====== REAL",h,re.S).group(1))
# split_extra 已把 insights 移到 data/ep-extra.json,合回内存(2026-07:曾因缺此步把 TOPICS 清空)
_xp=HTML.parent/"data"/"ep-extra.json"
if _xp.exists():
    _extra=json.loads(_xp.read_text(encoding="utf-8"))
    for _e in eps:
        _x=_extra.get(_e.get("id")) or {}
        if not _e.get("insights") and _x.get("insights"): _e["insights"]=_x["insights"]
PEOPLE=dict(re.findall(r"'([a-z]+)':\{en:'([^']+)'",h))  # pid->en(粗取,仅用于名字)
def do(e):
    ins=e.get("insights") or {}
    pts=(ins.get("consensus") or [])+(ins.get("contrarian") or [])
    pts=[p for p in pts if p.get("en")]
    if not pts: return e["id"],[]
    u=f"嘉宾:{e['pid']} 期:{e.get('tEn','')}\n观点:\n"+"\n".join(f"- en:{p['en']} | zh:{p.get('zh','')}" for p in pts)
    try:
        r=call(SYS,u)
        out=[]
        for it in r.get("items",[]):
            if it.get("slug") in SLUGS and it.get("en"):
                out.append({"slug":it["slug"],"pid":e["pid"],"ep":e["id"],"date":e.get("date",""),
                            "en":it["en"],"zh":it.get("zh","")})
        return e["id"],out
    except Exception as ex:
        return e["id"],[]
buckets={s:[] for s,_,_ in TOPICS_DEF}
done=0
with ThreadPoolExecutor(max_workers=8) as ex:
    futs={ex.submit(do,e):e for e in eps if e.get("insights")}
    for f in as_completed(futs):
        _id,items=f.result();done+=1
        for it in items: buckets[it["slug"]].append(it)
        if done%20==0: print(f"  分类 {done}/{len(futs)}",file=sys.stderr)
# 每议题按日期降序,去重(同 pid 同议题最多取 3 条,避免刷屏)
TOPICS={"defs":[{"slug":s,"zh":zh,"en":en} for s,zh,en in TOPICS_DEF],"items":{}}
for s,_,_ in TOPICS_DEF:
    rows=sorted(buckets[s],key=lambda x:x["date"],reverse=True)
    seen={};kept=[]
    for r in rows:
        seen[r["pid"]]=seen.get(r["pid"],0)+1
        if seen[r["pid"]]<=3: kept.append(r)
    TOPICS["items"][s]=kept
    print(f"  {s}: {len(kept)} 条 (来自 {len(set(r['pid'] for r in kept))} 人)",file=sys.stderr)
block="/*TOPICS_START*/const TOPICS="+json.dumps(TOPICS,ensure_ascii=False)+";/*TOPICS_END*/"
if "/*TOPICS_START*/" in h:
    h=re.sub(r"/\*TOPICS_START\*/.*?/\*TOPICS_END\*/",lambda m:block,h,count=1,flags=re.S)
else:
    # 首次:插到 VIEWS 块之后
    h=h.replace("/*VIEWS_END*/","/*VIEWS_END*/\n"+block,1)
tot=sum(len(v) for v in TOPICS["items"].values())
if tot < 100:   # 空输入护栏:insights 缺失时拒绝用空数据覆盖(2026-07 曾整块清空)
    sys.exit(f"✗ 拒绝写入:仅 {tot} 条观点(<100),疑似 insights 未加载,保留现有 TOPICS")
HTML.write_text(h,encoding="utf-8")

print(f"注入 TOPICS: {len(TOPICS_DEF)} 议题, 共 {tot} 条",file=sys.stderr)
