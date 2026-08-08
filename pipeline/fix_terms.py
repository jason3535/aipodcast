#!/usr/bin/env python3
"""fix_terms.py — 把自动字幕里 Anthropic 产品名的误听统一改回正确写法。

YouTube 自动字幕把 Claude 听成 Cloud/Claw/Cloth/Clock/Clod 是常态(2026-08 全站攒了
~430 处:cloud code 142、cloud co-work 15、clockcode 12…)。每轮收录后跑一遍,
所以它必须**幂等**且**只动高置信的多词组合**——单独一个 "cloud" 绝不碰
(Google Cloud、cloud computing 都是真的)。

排除:best-in-class code / world-class coding 里的 "class code" 不是误听。

用法:python3 pipeline/fix_terms.py [--check]   --check 只报数不改(给门禁用)
"""
import json, re, sys, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 误听变体 → 正确产品名。key 是正则(不含边界),value 是替换后的正确写法。
VAR = r"(?:cloud|claw|clawed|cloth|clock|clod|klaude|klaud|glaude|cla)"
RULES = [
    (re.compile(r"\bclockcode\b", re.I), "Claude Code"),
    (re.compile(rf"\b{VAR}\s?(codes)\b", re.I), "Claude Codes"),
    (re.compile(rf"\b{VAR}\s?(coding)\b", re.I), "Claude Coding"),
    (re.compile(rf"\b{VAR}\s?(code)\b", re.I), "Claude Code"),
    (re.compile(rf"\b{VAR}\s?(co-?work)\b", re.I), "Claude Cowork"),
    (re.compile(rf"\b{VAR}\s?(desktop)\b", re.I), "Claude Desktop"),
    (re.compile(rf"\b{VAR}\s?(opus)\b", re.I), "Claude Opus"),
    (re.compile(rf"\b{VAR}\s?(sonnet)\b", re.I), "Claude Sonnet"),
    (re.compile(rf"\b{VAR}\s?(haiku)\b", re.I), "Claude Haiku"),
    (re.compile(r"\bcloud for chrome\b", re.I), "Claude for Chrome"),
]
# 这些上下文里的 "class code" 是 best-in-class code,不是误听
GUARD = re.compile(r"(best|world)[- ]in[- ]?class\s*$|(best|world)-class\s*$", re.I)


def fix_text(s):
    if not isinstance(s, str) or not s:
        return s, 0
    n = 0
    for pat, good in RULES:
        def rep(m):
            nonlocal n
            if GUARD.search(s[max(0, m.start() - 16):m.start()]):
                return m.group(0)
            # 原文若是 "Claude Code" 本身不会进来(变体表里没有 claude)
            n += 1
            return good
        s = pat.sub(rep, s)
    return s, n


def walk(o):
    """递归修所有字符串值,返回 (新对象, 修改处数)。"""
    if isinstance(o, str):
        return fix_text(o)
    if isinstance(o, list):
        out, n = [], 0
        for x in o:
            y, k = walk(x); out.append(y); n += k
        return out, n
    if isinstance(o, dict):
        out, n = {}, 0
        for k, v in o.items():
            y, c = walk(v); out[k] = y; n += c
        return out, n
    return o, 0


def main():
    check = "--check" in sys.argv
    targets = (sorted(glob.glob(os.path.join(ROOT, "mcp-data", "ep", "*.json")))
               + sorted(glob.glob(os.path.join(ROOT, "mcp-data", "*.json")))
               + sorted(glob.glob(os.path.join(ROOT, "pipeline", "transcripts", "*.json")))
               + sorted(glob.glob(os.path.join(ROOT, "data", "*.json"))))
    total, files = 0, 0
    for f in targets:
        try:
            d = json.load(open(f, encoding="utf-8"))
        except Exception:
            continue
        d2, n = walk(d)
        if n:
            total += n; files += 1
            if not check:
                json.dump(d2, open(f, "w", encoding="utf-8"), ensure_ascii=False)
    # app.js 是源码,只改字符串字面量里的出现(整文件按文本处理即可,变体不会出现在代码标识符里)
    appjs = os.path.join(ROOT, "app.js")
    s = open(appjs, encoding="utf-8").read()
    s2, n = fix_text(s)
    if n:
        total += n; files += 1
        if not check:
            open(appjs, "w", encoding="utf-8").write(s2)
    verb = "待修" if check else "已修"
    print(f"fix_terms: {verb} {total} 处 / {files} 个文件", file=sys.stderr)
    if check and total:
        sys.exit(1)


if __name__ == "__main__":
    main()
