#!/usr/bin/env python3
"""首屏瘦身:把 app.js 内联的 VIEWS / TOPICS.items 抽到 data/views.json、data/topics.json。

app.js 只留 TOPICS.defs(8 个,极小)+ 每议题计数 counts + TOPIC_REL(单集页「接着读」的同议题候选),
议题详情页/人物观点演变页按需 fetch,首屏少背 ~250KB(gzip)。

幂等——gen_views / gen_topics 每次把全量写回内联块,收尾跑一次本脚本再抽出即可;已抽过再跑无副作用。
容错——前端 ensureViews/ensureTopics 先判内联块是否为空:若某台机器没跑本脚本(数据仍内联),
前端自动跳过拉取,行为与拆分前完全一致,不会白屏。build_mcp_data.js 同样两边兼容。
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app.js"
VIEWS_JSON = ROOT / "data" / "views.json"
TOPICS_JSON = ROOT / "data" / "topics.json"
EP_EXTRA = ROOT / "data" / "ep-extra.json"

REL_MAX = 8      # 每集存几个同议题候选:runtime 要跳过已读/已出现的,留余量


def obj_at(s, i):
    """从 s[i]=='{' 起做字符串感知的括号匹配,返回 (对象文本, 结束下标+1)。"""
    assert s[i] == "{"
    depth, j, in_str, esc = 0, i, False, False
    while j < len(s):
        c = s[j]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        elif c == '"':
            in_str = True
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return s[i:j + 1], j + 1
        j += 1
    raise ValueError("括号未闭合")


def block(s, name):
    """定位 /*NAME_START*/ … /*NAME_END*/,返回 (块起, 块止, const NAME= 的对象)。"""
    a = s.index(f"/*{name}_START*/")
    b = s.index(f"/*{name}_END*/") + len(f"/*{name}_END*/")
    m = re.search(r"const\s+" + name + r"\s*=\s*", s[a:b])
    txt, _ = obj_at(s[a:b], m.end())
    return a, b, json.loads(txt)


def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def main():
    s = APP.read_text(encoding="utf-8")
    out = []

    # ---- VIEWS:整包移出 ----
    va, vb, views = block(s, "VIEWS")
    if views:
        VIEWS_JSON.parent.mkdir(exist_ok=True)
        VIEWS_JSON.write_text(dump(views), encoding="utf-8")
        s = s[:va] + "/*VIEWS_START*/const VIEWS={};/*VIEWS_END*/" + s[vb:]
        out.append(f"VIEWS {len(views)} 人物 → data/views.json ({VIEWS_JSON.stat().st_size // 1024}KB)")
    else:
        out.append("VIEWS 已拆分")

    # ---- TOPICS:items 移出,defs + 计数 + 接着读候选留内联 ----
    ta, tb, topics = block(s, "TOPICS")
    items = topics.get("items") or {}
    if items:
        # 每条观点标上它在原集里的章节号:议题页靠它给「直达出处 ↦」深链。
        # 以前是运行时拿全量 insights 反查(逼着首屏背 ep-extra 整包),现在构建期查好写进 topics.json。
        extra = json.loads(EP_EXTRA.read_text(encoding="utf-8")) if EP_EXTRA.exists() else {}
        marked = 0
        for v in items.values():
            for it in v:
                ins = (extra.get(it["ep"]) or {}).get("insights") or {}
                hit = next((x for x in list(ins.get("consensus") or []) + list(ins.get("contrarian") or [])
                            if x.get("en") == it.get("en")), None)
                if hit and isinstance(hit.get("sec"), int) and hit["sec"] >= 0:
                    it["sec"] = hit["sec"]
                    marked += 1
        out.append(f"议题引文标注出处 {marked}/{sum(len(v) for v in items.values())} 条")
        TOPICS_JSON.write_text(dump({"defs": topics["defs"], "items": items}), encoding="utf-8")

        counts = {slug: [len(v), len({i["pid"] for i in v})] for slug, v in items.items()}

        # 「接着读」候选:沿用 runtime 逻辑——取该集所属的第一个议题,列出该议题下其他人物的集
        rel = {}
        for slug, v in items.items():
            pid_of = {}
            for it in v:
                pid_of.setdefault(it["ep"], it["pid"])
            for ep, pid in pid_of.items():
                if ep in rel:
                    continue            # 只认第一个命中的议题,与 runtime 的 break 一致
                cand, seen = [], set()
                for it in v:
                    if it["pid"] != pid and it["ep"] not in seen:
                        seen.add(it["ep"])
                        cand.append(it["ep"])
                        if len(cand) >= REL_MAX:
                            break
                if cand:
                    rel[ep] = cand

        stub = ("/*TOPICS_START*/const TOPICS=" + dump({"defs": topics["defs"], "counts": counts, "items": None})
                + ";const TOPIC_REL=" + dump(rel) + ";/*TOPICS_END*/")
        s = s[:ta] + stub + s[tb:]
        out.append(f"TOPICS {len(items)} 议题 → data/topics.json "
                   f"({TOPICS_JSON.stat().st_size // 1024}KB) | 内联留 defs+counts+REL {len(rel)} 集")
    else:
        out.append("TOPICS 已拆分")

    APP.write_text(s, encoding="utf-8")
    print("split_data: " + " | ".join(out) + f" | app.js {APP.stat().st_size // 1024}KB")


if __name__ == "__main__":
    main()
