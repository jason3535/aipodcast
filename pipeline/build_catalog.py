#!/usr/bin/env python3
"""用真实节目重建 EPISODES[]:2 期全文(Karpathy/Dario) + 17 期真实登记(stub)。"""
import json, re, os
BASE=os.path.dirname(os.path.abspath(__file__))
TRANS=os.path.join(BASE,"transcripts")

HTML = os.path.join(BASE, "..", "index.html")

def norm(s):
    return (s.replace("‘","「").replace("’","」").replace("“","「").replace("”","」")
            if isinstance(s,str) else s)

def fix_spk(ts, guest):
    for sec in ts:
        for t in sec.get("turns", []):
            t["zh"] = norm(t.get("zh",""))
            t["en"] = t.get("en","")
            sp = (t.get("spk") or "").strip().lower()
            if sp in ("host","interviewer","dwarkesh","dwarkesh patel"): t["spk"]="Dwarkesh"
            elif sp in (guest.lower(), guest.split()[0].lower(), "guest"): t["spk"]=guest.split()[0]
    return ts

kp = json.load(open(os.path.join(TRANS,"kp_full.json"), encoding="utf-8"))
da = json.load(open(os.path.join(TRANS,"dario_full.json"), encoding="utf-8"))
kp_ts = fix_spk(kp["ts"], "Andrej")
da_ts = fix_spk(da["ts"], "Dario")
da_quotes = [{"en":q["en"],"zh":norm(q["zh"])} for q in da.get("quotes",[])][:3]

def load_ins(path):
    d=json.load(open(path,encoding="utf-8"))
    for grp in ("consensus","contrarian"):
        for x in d.get(grp,[]): x["zh"]=norm(x.get("zh",""))
    return d
kp_ins = load_ins(os.path.join(TRANS,"kp_insights.json"))
da_ins = load_ins(os.path.join(TRANS,"dario_insights.json"))

D = lambda s: f"{s[:4]}-{s[4:6]}-{s[6:]}"  # 20251125 -> 2025-11-25

# 真实节目登记(stub):pid, vid, podEn, podZh, date, min, fields, tEn,tZh,sEn,sZh
STUBS = [
 ("ilya","aR20FWCCjAs","Dwarkesh Podcast","Dwarkesh 播客","2025-11-25",96,["deep-learning","safety"],
  "From the age of scaling to the age of research","从规模的时代,到研究的时代",
  "Why pure scaling is ending, and what research-driven progress looks like next.","为何纯粹堆规模的时代正在结束,以及接下来「以研究驱动」的进展会是什么样。"),
 ("demis","C0gErQtnNFE","Huge If True","Huge If True","2026-04-07",65,["deep-learning","rl"],
  "The hardest problem AI ever solved","AI 解决过的最难的问题",
  "AlphaFold, scientific discovery, and how far AGI really is.","AlphaFold、科学发现,以及 AGI 究竟还有多远。"),
 ("dario","GcqQ1ebBqkc","Cheeky Pint","Cheeky Pint","2025-08-06",63,["nlp","safety"],
  "A cheeky pint with Dario Amodei","与达里奥·阿莫迪小酌一杯",
  "Over a beer: building Anthropic, scaling, and the economics of AI.","就着一杯啤酒:创办 Anthropic、Scaling,以及 AI 的经济学。"),
 ("dario","N5JDzS9MQYI","Interesting Times","Interesting Times","2026-02-12",63,["nlp","safety"],
  "‘We don’t know if the models are conscious’","「我们不知道模型是否有意识」",
  "Consciousness, risk, and governing powerful AI, with Ross Douthat.","与罗斯·杜塔特谈意识、风险,以及如何治理强大的 AI。"),
 ("karpathy","kwSVtQ7dziU","No Priors","No Priors 播客","2026-03-20",67,["nlp"],
  "Skill issue: code agents and autoresearch","Skill Issue:代码智能体与自动化研究",
  "Where coding agents fall short, and the loopy road to autonomous research.","代码智能体还差在哪,以及通往自主研究那条「绕圈」的路。"),
 ("karpathy","96jN2OCOfLs","Training Data","Training Data","2026-04-29",30,["nlp"],
  "From vibe coding to agentic engineering","从「氛围编程」到智能体工程",
  "What changes when agents write the code and you engineer the agent.","当智能体来写代码、而你来「工程化」这个智能体,会有什么不同。"),
 ("feifei","Ctjiatnd6Xk","Lenny’s Podcast","Lenny’s Podcast","2025-11-16",80,["vision"],
  "Jobs, robots, and why world models are next","工作、机器人,以及为何世界模型是下一步",
  "The godmother of AI on spatial intelligence and a human-centered future.","「AI 教母」谈空间智能,以及以人为本的未来。"),
 ("feifei","60iW8FZ7MJU","Latent Space","Latent Space","2025-11-25",61,["vision"],
  "After LLMs: spatial intelligence and world models","LLM 之后:空间智能与世界模型",
  "Why language alone isn’t enough, and what World Labs is building.","为何仅有语言还不够,以及 World Labs 在造什么。"),
 ("bengio","PZqDFs2sbiY","80,000 Hours","80,000 小时","2026-05-07",155,["deep-learning","safety"],
  "How to make safe superintelligent AI","如何造出安全的超级智能",
  "The Turing laureate on the ‘Scientist AI’ paradigm and avoiding catastrophe.","图灵奖得主谈「科学家 AI」范式,以及如何避免灾难。"),
 ("bengio","zQ1POHiR8m8","The Diary Of A CEO","The Diary Of A CEO","2025-12-18",100,["deep-learning","safety"],
  "We have two years before everything changes","在一切改变之前,我们还有两年",
  "A stark warning on timelines, risk, and what we still can’t control.","关于时间表、风险,以及我们仍无法控制之物的严正警告。"),
 ("hinton","l6ZcFa8pybE","StarTalk","StarTalk","2026-02-28",94,["deep-learning","safety"],
  "Is AI hiding its full power?","AI 是否在隐藏它的全部实力?",
  "Hinton with Neil deGrasse Tyson on minds, risk, and digital intelligence.","辛顿与尼尔·泰森谈心智、风险,与数字智能。"),
 ("hinton","jrK3PsD3APk","The Weekly Show","The Weekly Show","2025-10-09",98,["deep-learning","safety"],
  "AI: what could go wrong?","AI:可能会出什么错?",
  "Hinton with Jon Stewart on the risks of the technology he helped invent.","辛顿与乔恩·斯图尔特谈他亲手参与发明的技术所带来的风险。"),
 ("lecun","ngBraLDqzdI","Unsupervised Learning","Unsupervised Learning","2026-05-15",82,["deep-learning","vision"],
  "What comes after LLMs","LLM 之后会是什么",
  "The case against pure language models, and the bet on world models.","对「纯语言模型」的质疑,以及对世界模型的押注。"),
 ("lecun","XnnnAx5lrx8","This Is The World","This Is The World","2026-03-11",51,["deep-learning","vision"],
  "‘LLMs are a dead end’","「LLM 是一条死路」",
  "Why today’s language models won’t get us to real intelligence.","为何当今的语言模型,到不了真正的智能。"),
 ("suleyman","Z4bwAjR7azM","Decoder","Decoder","2026-06-08",72,["nlp","safety"],
  "Superintelligence is near — but make it humanist","超级智能将至——但要「以人为本」",
  "Microsoft AI’s chief on companions, boundaries, and humanist superintelligence.","微软 AI 负责人谈 AI 伙伴、边界,与「以人为本的超级智能」。"),
 ("suleyman","MUEKVoeeRoA","Bloomberg","Bloomberg","2025-12-12",48,["nlp","safety"],
  "On superintelligence and the Microsoft–OpenAI deal","谈超级智能与微软–OpenAI 交易",
  "Where AI is headed, and what Microsoft is building.","AI 走向何方,以及微软在造什么。"),
 ("leike","ZP_N4q5U3eE","80,000 Hours","80,000 小时","2023-08-22",176,["safety","nlp"],
  "OpenAI’s push to make superintelligence safe","OpenAI 让超级智能变安全的努力",
  "The case for superalignment and scalable oversight.","为「超级对齐」与「可扩展监督」辩护。"),
 # ── 2026 新增人物 ──
 ("jensen","Hrbq66XqtCo","Dwarkesh Podcast","Dwarkesh 播客","2026-04-15",103,["deep-learning","robotics"],
  "Will Nvidia’s moat persist?","英伟达的护城河守得住吗?",
  "The compute kingpin on GPUs, the AI buildout, and physical AI.","算力之王谈 GPU、AI 基建,以及物理 AI。"),
 ("jensen","2UpQbeAZuqA","Training Data","Training Data","2026-06-10",41,["deep-learning","robotics"],
  "Building the dynamo of the intelligence revolution","打造智能革命的「发电机」",
  "Jensen Huang on inference, scaling laws, and what comes next.","黄仁勋谈推理、缩放定律,以及接下来是什么。"),
 ("altman","hmtuvNfytjM","Huge If True","Huge If True","2025-08-08",65,["nlp","safety"],
  "Sam Altman shows off GPT-5 — and what’s next","奥尔特曼展示 GPT-5——以及接下来是什么",
  "A hands-on look at GPT-5 and OpenAI’s road ahead, with Cleo Abram.","与 Cleo Abram 一起上手 GPT-5,以及 OpenAI 的前路。"),
 ("altman","2P27Ef-LLuQ","Big Technology","Big Technology","2025-12-18",58,["nlp","safety"],
  "How OpenAI wins, and ChatGPT’s future","OpenAI 如何取胜,以及 ChatGPT 的未来",
  "Altman on competition, the buildout, and where ChatGPT goes next.","奥尔特曼谈竞争、基建,以及 ChatGPT 的下一步。"),
 ("murati","A_jIpryR5js","Bloomberg","Bloomberg","2026-06-04",28,["nlp"],
  "Thinking Machines on AI’s next chapter","Thinking Machines 谈 AI 的下一章",
  "Mira Murati on her new lab and building understandable AI.","米拉·穆拉蒂谈她的新实验室,以及构建可理解的 AI。"),
]

def slugid(pid, podEn):
    return pid + "-" + re.sub(r"[^a-z0-9]+","", podEn.lower())[:8]

eps = []
# 全文:Karpathy(精选标题+人工金句) + Dario(精选标题+机器金句)
eps.append({
 "id":"karpathy-dwarkesh","pid":"karpathy","pod":{"en":"Dwarkesh Podcast","zh":"Dwarkesh 播客"},
 "date":"2025-10-17","min":146,"fields":["nlp","rl"],"real":True,"feat":True,
 "src":"https://youtu.be/lXUZvyajciY",
 "tEn":"We’re summoning ghosts, not building animals","tZh":"我们在召唤幽灵,而不是在造动物",
 "sEn":"Why it’s the decade of agents (not the year), the real bottlenecks, and a 15-year intuition.",
 "sZh":"为何是「智能体的十年」而非「元年」、真正的瓶颈,以及来自 15 年从业的直觉。",
 "ts":kp_ts,"insights":kp_ins,
 "quotes":[
   {"en":"We’re not building animals. We’re building ghosts — ethereal, fully digital entities that mimic humans. It’s a different kind of intelligence.",
    "zh":"我们造的不是动物,而是幽灵——一种缥缈的、完全数字化的存在,模仿着人类。那是一种不同的智能。"},
   {"en":"Reinforcement learning is terrible. It just so happens that everything we had before is much worse.",
    "zh":"强化学习很糟糕。只不过恰好,我们此前拥有的一切都还要糟糕得多。"}],
})
eps.append({
 "id":"dario-dwarkesh","pid":"dario","pod":{"en":"Dwarkesh Podcast","zh":"Dwarkesh 播客"},
 "date":"2026-02-13","min":142,"fields":["nlp","safety"],"real":True,
 "src":"https://youtu.be/n1E9IZfvGMA",
 "tEn":"We are near the end of the exponential","tZh":"我们已接近指数曲线的尽头",
 "sEn":norm(da.get("sEn","Scaling, timelines, and the tension at the heart of Anthropic.")),
 "sZh":norm(da.get("sZh","Scaling、时间表,以及 Anthropic 核心处的张力。")),
 "ts":da_ts,"quotes":da_quotes,"insights":da_ins,
})
# 真实节目:若批量产出了全文(/tmp/ep_<vid>.json)则挂全文+共识,否则 stub
nfull=0
for pid,vid,pe,pz,date,mn,fl,tEn,tZh,sEn,sZh in STUBS:
    d={"id":slugid(pid,pe),"pid":pid,"pod":{"en":pe,"zh":pz},"date":date,"min":mn,
       "fields":fl,"src":f"https://youtu.be/{vid}",
       "tEn":tEn,"tZh":norm(tZh),"sEn":sEn,"sZh":norm(sZh)}
    p=os.path.join(TRANS,f"ep_{vid}.json")
    if os.path.exists(p):
        ej=json.load(open(p,encoding="utf-8"))
        ts=ej.get("ts",[])
        for sec in ts:
            for t in sec.get("turns",[]): t["zh"]=norm(t.get("zh",""))
        ins=ej.get("insights",{}) or {}
        for g in ("consensus","contrarian"):
            for x in ins.get(g,[]): x["zh"]=norm(x.get("zh",""))
        if ts: d["ts"]=ts; nfull+=1
        if ins.get("consensus") or ins.get("contrarian"): d["insights"]=ins
        if "ts" not in d: d["stub"]=True
    else:
        d["stub"]=True
    eps.append(d)
print("  其中批量全文:", nfull)

# 按日期降序(全文/精选不强制置顶,纯时间)
eps.sort(key=lambda e:e["date"], reverse=True)

html = open(HTML, encoding="utf-8").read()
a = html.index("const EPISODES = [")
b = html.index("/* ====== REAL ASSETS")
html = html[:a] + "const EPISODES = " + json.dumps(eps, ensure_ascii=False) + ";\n\n" + html[b:]
open(HTML,"w",encoding="utf-8").write(html)
print(f"重建 EPISODES: {len(eps)} 期 (全文 2 + 登记 {len(STUBS)})")
print("按日期:", [e['date'] + ' ' + e['pid'] for e in eps[:6]], "...")
