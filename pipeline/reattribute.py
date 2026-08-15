#!/usr/bin/env python3
"""reattribute.py — 给「多嘉宾」单集重判说话人归属。

背景:add_episode 的 --guest 只收一个名字,提示词里也只有「Host / 单嘉宾」两档。碰到三方对谈
(主持人 + 两位嘉宾)时,模型被迫把第二位嘉宾的话塞进 Host 或第一位嘉宾,产生大面积错标——
jonyive-hugeiftr-2026(Cleo Abram × Jony Ive × Ferrari 设计总监 Flavio Manzoni)就是这样:
sec14 之后几乎所有 "Jony" 其实是 Flavio。

本脚本**只改 spk,不动 en/zh、不动分段**——把整集按 turn 喂给模型,给定完整说话人名单和每人的
身份 tell,让它逐 turn 判归属。分块时带上前文若干 turn 作上下文,避免在块边界失去线索。

用法:
  python3 reattribute.py <epid> --speakers "Host=...;Jony=...;Flavio=..." [--apply]
不带 --apply 只打印 diff 供人工复核(默认干跑,与 check_diarization「宁可不改不可改错」一致)。
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

import urllib.request

ROOT = Path(__file__).resolve().parent.parent
API = "https://api.deepseek.com/chat/completions"
MODEL = "deepseek-chat"
CHUNK = 24          # 每块判定的 turn 数
CTX = 6             # 每块前面附带的上下文 turn 数(只读不判)


def call(sys_prompt, user):
    body = json.dumps({"model": MODEL, "messages": [
        {"role": "system", "content": sys_prompt}, {"role": "user", "content": user}],
        "temperature": 0, "response_format": {"type": "json_object"}}).encode()
    req = urllib.request.Request(API, data=body, headers={
        "Authorization": "Bearer " + os.environ["DEEPSEEK_API_KEY"],
        "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(json.loads(r.read())["choices"][0]["message"]["content"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("epid")
    ap.add_argument("--speakers", required=True,
                    help='"Host=主持人 Cleo Abram,提问方;Jony=Jony Ive,...;Flavio=..."')
    ap.add_argument("--apply", action="store_true")
    a = ap.parse_args()

    roster = [s.strip() for s in a.speakers.split(";") if s.strip()]
    names = [s.split("=", 1)[0].strip() for s in roster]

    p = ROOT / "mcp-data" / "ep" / f"{a.epid}.json"
    d = json.loads(p.read_text(encoding="utf-8"))
    flat = [(si, ti, t) for si, s in enumerate(d["transcript"])
            for ti, t in enumerate(s["turns"])]

    sys_prompt = (
        "你在给一段播客转录**重判说话人归属**。转录里的 spk 标注不可信,请只根据每个 turn 的**内容**判断。\n"
        "说话人名单(只能用这些名字,原样输出):\n" + "\n".join("  - " + r for r in roster) + "\n\n"
        "判定规则:\n"
        "- 提问、引导话题、复述对方观点、开场结尾致谢、对镜头旁白 → 主持人。\n"
        "- 用第一人称讲自己的经历/自己公司内部/自己作品 → 对应那位嘉宾。用「我们」指自己公司时,看是哪家公司。\n"
        "- 第三人称提到某位嘉宾的名字(如「Jony 说…」「Flavio 认为…」)的,**说话的一定不是那个人**。\n"
        "- 被问「你…」并作答的是嘉宾;称呼对方为「你」并发问的是主持人。\n"
        "- 一个 turn 若明显是两个人的话被并在一起,按**主要**说话人判(本脚本不拆 turn)。\n"
        '只输出 JSON:{"spk":{"<turn 序号>":"<名字>", ...}},每个待判 turn 都要给。'
    )

    result = {}
    for start in range(0, len(flat), CHUNK):
        block = flat[start:start + CHUNK]
        ctx = flat[max(0, start - CTX):start]
        lines = []
        for i, (si, ti, t) in enumerate(ctx):
            lines.append(f"[上文 sec{si}#{ti}] {(t.get('en') or '')[:400]}")
        for i, (si, ti, t) in enumerate(block):
            lines.append(f"[{start + i}] (sec{si}#{ti}) {(t.get('en') or '')}")
        try:
            r = call(sys_prompt, "\n\n".join(lines))
        except Exception as e:
            print(f"  ! 块 {start} 失败: {e}", file=sys.stderr)
            continue
        for k, v in (r.get("spk") or {}).items():
            if v in names and str(k).isdigit():
                result[int(k)] = v
        print(f"  块 {start:3d}-{start + len(block) - 1:3d} 判定 {len(r.get('spk') or {})} 条", file=sys.stderr)

    changes = []
    for idx, (si, ti, t) in enumerate(flat):
        new = result.get(idx)
        if new and new != t["spk"]:
            changes.append((si, ti, t["spk"], new, (t.get("en") or "")[:90]))

    print(f"\n{a.epid}: {len(flat)} turn,建议改 {len(changes)} 处")
    for si, ti, old, new, txt in changes:
        print(f"  sec{si}[{ti}] {old:7s} → {new:7s} | {txt}")

    if a.apply and changes:
        for si, ti, old, new, _ in changes:
            d["transcript"][si]["turns"][ti]["spk"] = new
        p.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
        print(f"\n✓ 已写回 {p}")
    elif changes:
        print("\n(干跑;确认无误后加 --apply)")


if __name__ == "__main__":
    main()
