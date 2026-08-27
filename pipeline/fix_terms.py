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
# 边界不用 \b:Python 的 \b 把 CJK 当词字符,「与Whimo基础模型」这类中文紧贴场景会漏
# (2026-08-10 实测漏网)。改用「前后不是拉丁字母」的环视。
BL, BR = r"(?<![A-Za-z])", r"(?![A-Za-z])"
RULES = [
    (re.compile(BL+r"clockcode"+BR, re.I), "Claude Code"),
    (re.compile(BL+rf"{VAR}\s?(codes)"+BR, re.I), "Claude Codes"),
    (re.compile(BL+rf"{VAR}\s?(coding)"+BR, re.I), "Claude Coding"),
    (re.compile(BL+rf"{VAR}\s?(code)"+BR, re.I), "Claude Code"),
    (re.compile(BL+rf"{VAR}\s?(co-?work)"+BR, re.I), "Claude Cowork"),
    (re.compile(BL+rf"{VAR}\s?(desktop)"+BR, re.I), "Claude Desktop"),
    (re.compile(BL+rf"{VAR}\s?(opus)"+BR, re.I), "Claude Opus"),
    (re.compile(BL+rf"{VAR}\s?(sonnet)"+BR, re.I), "Claude Sonnet"),
    (re.compile(BL+rf"{VAR}\s?(haiku)"+BR, re.I), "Claude Haiku"),
    (re.compile(BL+r"cloud for chrome"+BR, re.I), "Claude for Chrome"),
    # ---- 其他品牌误听(2026-08-10 起) ----
    # Waymo → 自动字幕常听成 Whimo(全站曾攒 58 处,散布在 6 期);"way mo" 只匹配全小写,
    # 防误伤 "the way Mo Gawdat…" 这类句中人名(Mo 大写)与 "way more"(\b 挡住)。
    (re.compile(BL+r"Wh[iy]mo"+BR, re.I), "Waymo"),
    (re.compile(BL+r"way mo"+BR), "Waymo"),
    # Carl Pei(Nothing 创始人)→ 自动字幕听成 Carl Pay / Pie / Pay-e(2026-08-15 用户报,
    # 该期正确写法有 23 处、误写 4 处,英文与中文正文里都有)。只匹配这几个确定的误写,
    # 不含正确的 "Pei" —— 否则 --check 门禁会永远报"待修 N 处"。
    (re.compile(BL+r"Carl\s+P(?:ay|ie|aye|eh)"+BR), "Carl Pei"),
    # Meizu(魅族)→ 自动字幕听成 Mazu/Matzu/Mazoo(2026-08-18 用户报,carlpei-accesspo-2025
    # 里 6 处,英文正文、中文译文、章节标题都有)。Carl 早年那段「在中国电脑市场买到一台
    # 不输 iPod 的 MP3」讲的就是魅族。
    # 注意:Mazu 也是妈祖/马祖的拼音,本库目前无此语境;若将来收录相关内容需给这条加限定。
    (re.compile(BL+r"Ma(?:tzu|zoo|zu)"+BR), "Meizu"),
    # ---- 2026-08-24 周巡检发现的新人物/新公司名误听(全新嘉宾没有站内先验,全靠音译) ----
    # Anthropic → 听成 Enthropic/Enthropics(dylanpatel-semianal-2026、arvindjain-20vcwith-2026
    # 两期独立出现,同一批系统性误听)。拼写含多余的 h,与真实单词 entropic 不冲突。
    (re.compile(BL+r"Enthropics"+BR, re.I), "Anthropic's"),
    (re.compile(BL+r"Enthropic"+BR, re.I), "Anthropic"),
    # Netic(melisatokmak 创业公司)→ 同一期里听成 NetC / ETIC 两种变体。
    # 注意:ETIC 也是语言学/人类学里 emic-etic 对照的通用词根,若将来收录相关内容需加限定。
    (re.compile(BL+r"NetC"+BR), "Netic"),
    (re.compile(BL+r"ETIC"+BR), "Netic"),
    # Zynga(Mark Pincus 创业公司)→ 听成 Zinga / Zenga(pincus-motleyfo-2026、
    # pincus-ycombina-2026 两期都有,同一期内常与正确写法混杂出现)。
    (re.compile(BL+r"Zinga"+BR), "Zynga"),
    (re.compile(BL+r"Zenga"+BR), "Zynga"),
    # MineDojo(Jim Fan 在 NVIDIA 的项目,Minecraft 里的具身智能体)→ 听成 MindDojo。
    (re.compile(BL+r"MindDojo"+BR), "MineDojo"),
    # Jerry Tworek(Core Automation 创始人,原 OpenAI 研究副总裁)→ 听成 Tourk/Torek/Twerk。
    # 2026-08-26 tworek-mts-2026 里 Tourk 4 次、正确写法仅 2 次。姓氏冷门,音译必错。
    (re.compile(BL+r"Jerry\s+T(?:ourk|orek|werk|urek)"+BR, re.I), "Jerry Tworek"),
    # Grok Bot(xAI 2026-08-11 发布的常驻 agent 产品)→ 听成 Grockbot/Grokbot/Grock Bot。
    # johnbai-diveclub-2026 整期 38 处全错,官方视频简介与封面均作 "Grok Bot"(两个词)。
    (re.compile(BL+r"Groc?kbot"+BR, re.I), "Grok Bot"),
    (re.compile(BL+r"Grock\s+Bot"+BR, re.I), "Grok Bot"),
    # ---- Codex(OpenAI 编程 agent)→ 自动字幕听成 codec/codecs ----
    # 2026-08-24 用户在 altman-davidsen-2026 报的。全库 49 处 codec 里约 3/4 是误听,
    # 但 **codec 是真词**:MP3 codec、neural audio codec、video codec/FFmpeg、
    # Meta 的 Codec Avatars 都必须留着。试过「排除音视频词」和「整段护栏」两种正则方案:
    # 前者漏掉 "we train the codec…"(neural audio 在上百字符之外),后者又误挡了 4 期合法修正。
    # 结论:**单个 codec 无法用正则可靠判定,只对确定的多词形态动手**,其余靠人工复核。
    (re.compile(BL+r"(GPT[-\s]?5(?:\.\d)?)\s+codecs?"+BR, re.I), lambda m: m.group(1) + " Codex"),
    (re.compile(BL+r"codecs?\s+research"+BR, re.I), "Codex research"),
    (re.compile(BL+r"chachebt\s+codecs?"+BR, re.I), "ChatGPT Codex"),
    # ---- 2026-08-24 收 Brett Adcock(Figure CEO)与 Sam Altman 两期时发现 ----
    # Vettery(Brett Adcock 2013 创办的招聘市场,2018 被 Adecco 以约 1.1 亿美元收购)
    # → 听成 Veterary/Vetterary(brettadcock-myfirstm-2026 里 14 处)。已核实公司名拼写。
    (re.compile(BL+r"Vet+erary"+BR, re.I), "Vettery"),
    # Figure(他现在的公司)→ 同一期里 1 处听成 Figer;正确的 "Figure" 有 40 处,不能误伤,
    # 所以只匹配 Figer 这个确定的错拼。
    (re.compile(BL+r"Figer"+BR), "Figure"),
    # Tobi Lütke(Shopify CEO)→ 听成 Toby Lu(altman-davidsen-2026 里 5 处,连标题都错了)。
    # 右侧环视挡住已正确的 "Tobi Lutke/Lütke",否则 --check 门禁会永远报待修。
    (re.compile(BL+r"Tob(?:ey|[yie])\s+Lu(?![A-Za-z\u00fc])"), "Tobi L\u00fctke"),
    # 顺带把 ASCII 的 Lutke 归一成 Lütke;替换后带 ü,不会再次匹配,--check 保持幂等。
    (re.compile(BL+r"Tob(?:ey|[yie])\s+Lutke"+BR), "Tobi L\u00fctke"),
]
# 这些上下文里的 "class code" 是 best-in-class code,不是误听
GUARD = re.compile(r"(best|world)[- ]in[- ]?class\s*$|(best|world)-class\s*$", re.I)


def fix_text(s):
    if not isinstance(s, str) or not s:
        return s, 0
    n = 0
    for rule in RULES:
        pat, good = rule[0], rule[1]
        ctx = rule[2] if len(rule) > 2 else None   # 可选:上下文护栏,命中则不替换
        def rep(m):
            nonlocal n
            if GUARD.search(s[max(0, m.start() - 16):m.start()]):
                return m.group(0)
            # 护栏查**整段文本**而非窗口:同一段里 "neural audio codec" 与后文的 "the codec"
            # 可能隔了上百字符,窗口会漏。宁可整段不动,也不能把真 codec 改成 Codex。
            if ctx and ctx.search(s):
                return m.group(0)
            # 原文若是 "Claude Code" 本身不会进来(变体表里没有 claude)
            n += 1
            # good 允许是函数:需要保留原文片段(如版本号)时用,普通规则仍是字符串。
            # 注意不能用 r"\1" 反向引用 —— 这里是函数式替换,sub 不会展开它。
            return good(m) if callable(good) else good
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
