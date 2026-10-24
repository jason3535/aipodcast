#!/usr/bin/env python3
"""git 合并驱动:按 key 做三方合并,让本地 cron 与云端会话的提交分叉时能自动合上。

两个写入方(本地 cron 每天收录 + 云端/手动会话改数据)同时改 app.js 的 EPISODES 那一行,
文本合并必然冲突 —— 一行装了 777 期。2026-10-22~24 cron 连续三天 push 失败、18 期滞留,
就是这种冲突 + 网络超时叠加的结果。

  merge_driver.py appjs %O %A %B   app.js:数据段(PEOPLE/PERSON_ORG/EPISODES/PHOTOS/POD_LOGO/POD_INFO)
                                   按 key 合并,其余代码走 git merge-file 文本合并
  merge_driver.py json  %O %A %B   JSON 文件:顶层 dict 按 key 递归合并,输出保持原格式
  merge_driver.py html  %O %A %B   index.html:生成段(app.js?v= 哈希、<!--X_START-->…<!--X_END-->)取本地,
                                   其余文本合并;合并后 build_share_pages 会重写这些段

规则(每个 key):两边相同→取之;一边没动→取另一边;两边都改→dict 递归,否则取本地(ours)并在 stderr 记一笔。
代码部分的真冲突、或格式无法原样回写 → 退出码 1,交给人工(git 标记为冲突)。
注册:.gitattributes + 本机 git config(见 pipeline/AUTO_REFRESH.md「推送与合并」)。
"""
import json, os, re, subprocess, sys, tempfile

CONFLICTS = []
MISSING = object()


def merge3(b, o, t, path=""):
    if o == t: return o
    if o == b: return t
    if t == b: return o
    if isinstance(o, dict) and isinstance(t, dict):
        return merge_keyed(b if isinstance(b, dict) else {}, o, t, path)
    CONFLICTS.append(path or "<root>")
    return o


def merge_keyed(b, o, t, path=""):
    """dict 三方合并;顺序以 ours 为准,theirs 新增的 key 追加在后。"""
    out = {}
    for k in list(o) + [k for k in t if k not in o]:
        bv, ov, tv = b.get(k, MISSING), o.get(k, MISSING), t.get(k, MISSING)
        if ov is MISSING and tv is MISSING: continue
        if ov is MISSING:                     # ours 删了(或 theirs 新增)
            if bv is MISSING or bv != tv: out[k] = tv
            continue
        if tv is MISSING:
            if bv is MISSING or bv != ov: out[k] = ov
            continue
        out[k] = merge3(MISSING if bv is MISSING else bv, ov, tv, f"{path}.{k}" if path else str(k))
    return out


def merge_list_by(b, o, t, key, path):
    """对象数组(如 EPISODES)按 id 合并,结果维持 ours 顺序、theirs 新增插回按日期排。"""
    m = merge_keyed({x[key]: x for x in b}, {x[key]: x for x in o}, {x[key]: x for x in t}, path)
    return list(m.values())


# ---------------------------------------------------------------- app.js
SEG_RE = {
    "PERSON_ORG": re.compile(r"^const PERSON_ORG=(.*);$", re.M),
    "EPISODES": re.compile(r"^const EPISODES = (.*);$", re.M),
    "PHOTOS": re.compile(r"^const PHOTOS=new Set\(\[(.*)\]\);$", re.M),
}
BLOCKS = {  # 多行块:开头行 → 结尾 "\n};"
    "PEOPLE": ("const PEOPLE = {\n", re.compile(r"^ {0,2}'?([A-Za-z0-9_]+)'?:\{en:", re.M)),   # 缩进 0~2、引号可有可无,三种写法库里都有
    "POD_LOGO": ("const POD_LOGO={\n", re.compile(r"^   '((?:[^'\\]|\\.)*)':", re.M)),
}


def split_entries(body, rx):
    """把块拆成 {key: 原文}(条目可跨行,到下一条目开头为止)。"""
    starts = [(m.start(), m.group(1)) for m in rx.finditer(body)]
    if not starts or body[:starts[0][0]].strip(): raise ValueError("块开头有无法识别的内容")
    ent = {}
    for i, (p, k) in enumerate(starts):
        e = starts[i + 1][0] if i + 1 < len(starts) else len(body)
        while k in ent: k += "\u0000"          # JS 对象允许重复 key(后者生效):原样保留两条
        ent[k] = body[p:e]
    return ent


GEN = ("VIEWS", "TOPICS")   # /*X_START*/…/*X_END*/ 之间由 split_data/gen_topics 整段重写:合并取本地,随后重跑生成


def extract(src):
    data, skel = {}, src
    for name in GEN:
        m = re.search(rf"/\*{name}_START\*/(.*?)/\*{name}_END\*/", skel, re.S)
        if not m: raise ValueError("找不到生成段 " + name)
        data[name] = m.group(1)
        skel = skel[:m.start(1)] + f"@@{name}@@" + skel[m.end(1):]
    for name, rx in SEG_RE.items():
        m = rx.search(skel)
        if not m: raise ValueError("找不到 " + name)
        data[name] = m.group(1)
        skel = skel[:m.start(1)] + f"@@{name}@@" + skel[m.end(1):]
    for name, (head, rx) in BLOCKS.items():
        a = skel.index(head) + len(head); b = skel.index("};", a)
        data[name] = split_entries(skel[a:b], rx)
        skel = skel[:a] + f"@@{name}@@\n" + skel[b:]
    a = skel.index("const POD_INFO = ") + len("const POD_INFO = "); b = skel.index("\n};", a) + 2
    data["POD_INFO"] = skel[a:b]
    skel = skel[:a] + "@@POD_INFO@@" + skel[b:]
    return data, skel


def dump_eps(eps):
    eps = sorted(eps, key=lambda e: e.get("date") or "", reverse=True)   # 站内约定:日期倒序(稳定排序)
    return json.dumps(eps, ensure_ascii=False)


def merge_appjs(B, O, T):
    (db, sb), (do, so), (dt, st) = extract(B), extract(O), extract(T)
    with tempfile.TemporaryDirectory() as d:
        paths = []
        for n, s in (("o", so), ("b", sb), ("t", st)):
            p = os.path.join(d, n); open(p, "w", encoding="utf-8").write(s); paths.append(p)
        r = subprocess.run(["git", "merge-file", "-p", "-L", "ours", "-L", "base", "-L", "theirs"] + paths,
                           capture_output=True, text=True)
    skel, code_conflict = r.stdout, r.returncode != 0
    out = {name: do[name] for name in GEN}
    out["PERSON_ORG"] = json.dumps(merge_keyed(*(json.loads(x["PERSON_ORG"]) for x in (db, do, dt)), "PERSON_ORG"),
                                   ensure_ascii=False, separators=(",", ":"))
    out["EPISODES"] = dump_eps(merge_list_by(*(json.loads(x["EPISODES"]) for x in (db, do, dt)), "id", "EPISODES"))
    grab = lambda s: re.findall(r"'([^']+)'", s)
    pb, po, pt = (grab(x["PHOTOS"]) for x in (db, do, dt))
    photos = [p for p in po if p in pt or p not in pb] + [p for p in pt if p not in po and p not in pb]
    out["PHOTOS"] = ",".join(f"'{p}'" for p in photos)
    for name in BLOCKS:
        b, o, t = db[name], do[name], dt[name]
        m = merge_keyed(b, o, t, name)
        new_t = [k for k in t if k not in o and k not in b]
        if name == "PEOPLE":   # 新人物插在最前(与 add_person 一致)
            order = new_t + [k for k in m if k not in new_t]
        else:
            order = list(m)
        out[name] = "".join(m[k] if m[k].endswith("\n") else m[k] + "\n" for k in order)
    out["POD_INFO"] = json.dumps(merge_keyed(*(json.loads(x["POD_INFO"]) for x in (db, do, dt)), "POD_INFO"),
                                 ensure_ascii=False, indent=1)
    for name, val in out.items():
        tok = f"@@{name}@@\n" if name in BLOCKS else f"@@{name}@@"
        if skel.count(tok) != 1: raise ValueError(f"骨架里 {name} 占位符数量异常")
        skel = skel.replace(tok, val, 1)
    return skel, code_conflict


# ---------------------------------------------------------------- json
def detect_fmt(text, obj):
    for indent in (None, 1, 2):
        for seps in ((", ", ": "), (",", ":")) if indent is None else ((",", ": "),):
            for ea in (False, True):
                s = json.dumps(obj, ensure_ascii=ea, indent=indent, separators=seps)
                for tail in ("", "\n"):
                    if s + tail == text: return dict(ensure_ascii=ea, indent=indent, separators=seps), tail
    return None


def merge_json(B, O, T):
    o = json.loads(O)
    fmt = detect_fmt(O, o)
    if not fmt or not isinstance(o, dict): raise ValueError("JSON 格式无法原样回写")
    b = json.loads(B) if B.strip() else {}
    m = merge_keyed(b, o, json.loads(T))
    return json.dumps(m, **fmt[0]) + fmt[1], False


# ---------------------------------------------------------------- html
HTML_GEN = [re.compile(r"(app\.js\?v=)([0-9a-f]+)"),
            re.compile(r"(<!--([A-Z_]+)_START-->)(.*?)(?=<!--\2_END-->)", re.S)]


def merge_html(B, O, T):
    mid = lambda m: m.group(m.re.groups)    # 每个模式的最后一组是要屏蔽的生成内容
    def mask(s):
        for i, rx in enumerate(HTML_GEN):
            s = rx.sub(lambda m: m.group(1) + f"@@GEN{i}@@", s)
        return s
    keep = [[mid(m) for m in rx.finditer(O)] for rx in HTML_GEN]
    with tempfile.TemporaryDirectory() as d:
        paths = []
        for n, s in (("o", mask(O)), ("b", mask(B)), ("t", mask(T))):
            p = os.path.join(d, n); open(p, "w", encoding="utf-8").write(s); paths.append(p)
        r = subprocess.run(["git", "merge-file", "-p", "-L", "ours", "-L", "base", "-L", "theirs"] + paths,
                           capture_output=True, text=True)
    out = r.stdout
    for i, vals in enumerate(keep):           # 按出现顺序填回本地的生成段
        for v in vals:
            out = out.replace(f"@@GEN{i}@@", v, 1)
    if "@@GEN" in out: raise ValueError("生成段数量对不上")
    return out, r.returncode != 0


def main():
    mode, fo, fa, fb = sys.argv[1:5]
    rd = lambda p: open(p, encoding="utf-8").read() if os.path.exists(p) else ""
    B, O, T = rd(fo), rd(fa), rd(fb)
    try:
        res, conflict = {"appjs": merge_appjs, "json": merge_json, "html": merge_html}[mode](B, O, T)
    except Exception as e:                     # 解析不了就退回人工,ours 原样不动
        print(f"merge_driver {mode}: 无法结构化合并({e}),留给人工", file=sys.stderr)
        return 1
    open(fa, "w", encoding="utf-8").write(res)
    if CONFLICTS:
        print(f"merge_driver {mode}: {len(CONFLICTS)} 处两边都改,取本地:{', '.join(CONFLICTS[:8])}", file=sys.stderr)
    if conflict:
        print(f"merge_driver {mode}: 代码部分有文本冲突,已写冲突标记", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
