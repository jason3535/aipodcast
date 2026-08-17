#!/usr/bin/env python3
"""build_crosslinks.py — 六站人物互链 map 的自动补全(只增不删,幂等)。

背景:站群互链靠 11 张手工 map(播客 GRAPH_ID/HW_GRAPH/INV_GRAPH/POD2PAPER/DESIGN_IDS,
纸站 PAPER2POD/PAPER_GRAPH,四图谱各自的 PODCAST + ai 图谱的 PAPER)。人是同一批,
map 各写各的,每次加人都可能漏(2026-08-09 我给图谱加 7 人,7 条反向链全漏了一天)。

原则:
- **只增不删**:按姓名归一找到的新配对才追加;既有条目一律保留;计算值与既有值冲突时
  保留既有并告警(既有条目多为人工核验过的)。
- **两侧无歧义才配**:同一姓名在任一站命中多人 → 该姓名弃配,列入告警人工处理。
- 姓名归一带全部已知教训:NFKD 去重音 + 德语转写双通道(Jürgen/Juergen)+ ł→l +
  两词名交换顺序(图谱对华人用「姓 名」)。
用法:
  python3 pipeline/build_crosslinks.py            # 只报告缺什么
  python3 pipeline/build_crosslinks.py --apply    # 补写全部仓库的 map(改文件不提交)
  python3 pipeline/build_crosslinks.py --check    # 有缺口则退出码 1(门禁用)
  --write-pod-only  # 配合 --apply:只写播客站 app.js 自己的 map,其他仓库只报告
                    # (无人值守 cron 用,避免跨仓库留未提交改动)
"""
import json, os, re, sys, unicodedata
from pathlib import Path

# 仓库路径:两台 Mac 布局不同(个人 Mac ~/CascadeProjects 等,工作 Mac 直接在 ~ 下),
# 按候选路径取第一个存在的。也可用环境变量强制指定,如 SITE_ROOT_AI=/path/to/repo。
# 找不到的仓库不再让整个脚本崩掉:_people_block 会跳过并计入告警。
def repo_file(key, rel, *roots):
    env = os.environ.get("SITE_ROOT_" + key.upper())
    if env:
        return Path(env) / rel
    for r in roots:
        if (Path(r) / rel).exists():
            return Path(r) / rel
    return Path(roots[0]) / rel

POD = repo_file("aipodcast", "app.js", "/Users/jason/CascadeProjects/aipodcast",
                "/Users/jason.lin/aipodcast")
PAPER = repo_file("aipaper", "app.js", "/Users/jason/Downloads/ai-paper-prototype",
                  "/Users/jason.lin/aipaper")
GRAPHS = {
    "ai": repo_file("ai", "index.html", "/Users/jason/ai-scholar-graph",
                    "/Users/jason.lin/ai-scholar-graph"),
    "hw": repo_file("hw", "index.html", "/Users/jason/hardware-startup-graph",
                    "/Users/jason.lin/hardware-startup-graph"),
    "inv": repo_file("inv", "index.html", "/Users/jason/investor-graph",
                     "/Users/jason.lin/investor-graph"),
    "design": repo_file("design", "index.html", "/Users/jason/designer-graph",
                        "/Users/jason.lin/designer-graph"),
}
# 已知同名不同人/不配对的黑名单:(corpusA, idA, corpusB, idB)
BLOCK = set()

def norms(name):
    """一个名字的全部归一变体。"""
    out = set()
    for base in {name, name.replace("ü","ue").replace("ö","oe").replace("ä","ae").replace("ß","ss")}:
        s = base.replace("ł","l").replace("Ł","L")
        s = unicodedata.normalize("NFKD", s)
        s = "".join(c for c in s if not unicodedata.combining(c))
        toks = re.findall(r"[a-z]+", s.lower())
        if not toks: continue
        out.add("".join(toks))
        if len(toks) == 2:                       # 姓名顺序互换(图谱华人用「姓 名」)
            out.add(toks[1] + toks[0])
        if len(toks) >= 3:                       # 去中间名
            out.add(toks[0] + toks[-1]); out.add(toks[-1] + toks[0])
    return out

def index(people):
    """{id:name} → {norm: id};歧义 norm 直接丢弃。"""
    idx, bad = {}, set()
    for pid, name in people.items():
        for n in norms(name):
            if n in idx and idx[n] != pid: bad.add(n)
            else: idx[n] = pid
    for n in bad: idx.pop(n, None)
    return idx

def match(a, b):
    """两个 {id:name} 的无歧义姓名配对 → {ida: idb}。"""
    ia, ib = index(a), index(b)
    out = {}
    for n, pa in ia.items():
        pb = ib.get(n)
        if pb: out.setdefault(pa, pb)
    return out

# ---- 抽取 ----
def _people_block(path):
    """只在 const PEOPLE = { ... }; 块内抽人——否则 FIELDS 表('deep-learning':{en:'Deep Learning'})
    也长得像人物条目,会配出 deep-learning↔deep-learning 这种鬼(首轮实测)。"""
    if not path.exists():
        print(f"  ⚠ 跳过(本机无此仓库): {path}", file=sys.stderr)
        return {}
    s = path.read_text(encoding="utf-8")
    m = re.search(r"const PEOPLE\s*=\s*\{(.*?)\n\};", s, re.S)
    blk = m.group(1) if m else s
    return {mm.group(1): mm.group(2).replace("\\'", "'")
            for mm in re.finditer(r"'([\w.-]+)':\{en:'((?:[^'\\]|\\.)*)'", blk)}

def pod_people(): return _people_block(POD)

def paper_people(): return _people_block(PAPER)

def graph_people(path):
    if not path.exists():
        print(f"  ⚠ 跳过(本机无此仓库): {path}", file=sys.stderr)
        return {}
    s = path.read_text(encoding="utf-8")
    return {m.group(1): m.group(2)
            for m in re.finditer(r'\{\s*"?id"?:\s*"([\w-]+)"\s*,\s*"?name"?:\s*"((?:[^"\\]|\\.)*)"', s)}

def read_map(path, name):
    if not path.exists(): return None
    s = path.read_text(encoding="utf-8")
    m = re.search(name + r"\s*=\s*\{(.*?)\};", s, re.S)
    if not m: return None
    # 兼容三种写法:k:'v' / 'k':'v' / "k":"v"(PAPER_GRAPH 是双引号 JSON 风格,
    # 首轮只认单引号导致整表 56 条被误判缺失)
    body = m.group(1)
    out = dict(re.findall(r"['\"]?([\w.-]+)['\"]?\s*:\s*['\"]([^'\"]*)['\"]", body))
    return out

def append_map(path, name, adds):
    if not adds: return
    s = path.read_text(encoding="utf-8")
    m = re.search("(" + name + r"\s*=\s*\{.*?)(\};)", s, re.S)
    assert m, f"{path} 找不到 {name}"
    frag = ",".join(f"{k}:'{v}'" for k, v in sorted(adds.items()))
    body = m.group(1)
    sep = "" if body.rstrip().endswith("{") else ","
    s = s[:m.start()] + body + sep + frag + m.group(2) + s[m.end():]
    path.write_text(s, encoding="utf-8")

def main():
    apply_ = "--apply" in sys.argv
    check = "--check" in sys.argv
    pod_only = "--write-pod-only" in sys.argv
    pod = pod_people(); paper = paper_people()
    g = {k: graph_people(p) for k, p in GRAPHS.items()}
    print(f"人物数:播客 {len(pod)} / 纸站 {len(paper)} / " +
          " / ".join(f"{k} {len(v)}" for k, v in g.items()))

    # (map名, 文件, 期望配对{左id:右id}, 说明)
    jobs = [
        ("const GRAPH_ID",  POD,          match(pod, g["ai"]),     "播客→AI图谱"),
        ("const HW_GRAPH",  POD,          match(pod, g["hw"]),     "播客→硬件图谱"),
        ("const INV_GRAPH", POD,          match(pod, g["inv"]),    "播客→投资图谱"),
        ("const POD2PAPER", POD,          match(pod, paper),       "播客→纸站"),
        ("const PAPER2POD", PAPER,        match(paper, pod),       "纸站→播客"),
        ("const PAPER_GRAPH", PAPER,      match(paper, g["ai"]),   "纸站→AI图谱"),
        ("var PODCAST",     GRAPHS["ai"], match(g["ai"], pod),     "AI图谱→播客"),
        ("var PAPER",       GRAPHS["ai"], match(g["ai"], paper),   "AI图谱→纸站"),
        ("var PODCAST",     GRAPHS["hw"], match(g["hw"], pod),     "硬件图谱→播客"),
        ("var PODCAST",     GRAPHS["inv"], match(g["inv"], pod),   "投资图谱→播客"),
        ("var PODCAST",     GRAPHS["design"], match(g["design"], pod), "设计图谱→播客"),
    ]
    total_add = 0
    for name, path, want, label in jobs:
        cur = read_map(path, name)
        if cur is None:
            print(f"  ⚠ {label}: 没找到 {name},跳过"); continue
        adds, conflicts = {}, []
        for k, v in want.items():
            if (label, k) in BLOCK: continue
            if k in cur:
                if cur[k] != v and cur[k]:
                    conflicts.append(f"{k}: 既有 '{cur[k]}' vs 计算 '{v}'(保留既有)")
            else:
                adds[k] = v
        if adds or conflicts:
            print(f"  {label}({name.split()[-1]}): +{len(adds)}" +
                  (f" 冲突 {len(conflicts)}" if conflicts else ""))
            for k, v in sorted(adds.items()):
                # 打印双侧显示名供人工过目(同名不同人风险点)
                ln = pod.get(k) or paper.get(k) or next((gg[k] for gg in g.values() if k in gg), "?")
                rn = pod.get(v) or paper.get(v) or next((gg[v] for gg in g.values() if v in gg), "?")
                print(f"      + {k}:'{v}'   ({ln} ↔ {rn})")
            for c in conflicts: print(f"      ! {c}")
        total_add += len(adds)
        if apply_ and adds and not (pod_only and path != POD):
            append_map(path, name, adds)

    # DESIGN_IDS(Set,pid==design 节点 id 才能进)
    s = POD.read_text(encoding="utf-8")
    m = re.search(r"const DESIGN_IDS=new Set\(\[(.*?)\]\)", s, re.S)
    if m:
        cur = set(re.findall(r"'([\w-]+)'", m.group(1)))
        pairs = match(pod, g["design"])
        same = {k for k, v in pairs.items() if k == v and k not in cur}
        diff = {k: v for k, v in pairs.items() if k != v and k not in cur}
        if same:
            print(f"  播客→设计图谱(DESIGN_IDS): +{len(same)}")
            for k in sorted(same): print(f"      + '{k}' ({pod[k]})")
            total_add += len(same)
            if apply_:
                s = s.replace(m.group(0), m.group(0).replace("])", "," + ",".join(f"'{x}'" for x in sorted(same)) + "])"), 1)
                POD.write_text(s, encoding="utf-8")
        for k, v in diff.items():
            print(f"      ⚠ 设计图谱 id 不同名({k} vs {v}),DESIGN_IDS 表达不了,需人工")

    if total_add == 0:
        print("\n✓ 全部互链 map 已同步,无缺口")
    else:
        print(f"\n共 {'补写' if apply_ else '缺'} {total_add} 条" + ("" if apply_ else "(--apply 补写)"))
        print("⚠ 改动落在多个仓库的工作区,记得各自提交部署" if apply_ else "")
    if check and total_add: sys.exit(1)

if __name__ == "__main__":
    main()
