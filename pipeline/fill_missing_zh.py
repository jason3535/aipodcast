#!/usr/bin/env python3
"""补齐逐字稿里缺中文的 turn(mcp-data/ep/*.json),用 DeepSeek + 术语表。

翻译环节偶尔整块丢 zh(分块翻译时模型漏字段),审计只报「警告」不拦,双语模式下这些句子只剩英文。
2026-10-24 全库查出 20 期 220 句。

  fill_missing_zh.py            补全库
  fill_missing_zh.py <id>...    只补指定期
  fill_missing_zh.py --dry-run  只列清单

另外顺手收两类脏数据:en/zh 都为空的 turn 直接删;en 里装的是中文(字段放反)的 turn 归位到 zh 并回译 en。
需要 DEEPSEEK_API_KEY(先 set -a; . pipeline/.env; set +a)。
"""
import json, os, re, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
EPDIR = ROOT / "mcp-data" / "ep"
KEY = os.environ.get("DEEPSEEK_API_KEY")
URL = "https://api.deepseek.com/chat/completions"
CJK = re.compile(r"[一-鿿]")
BATCH = 10

sys.path.insert(0, str(BASE))
from merge_driver import detect_fmt   # 回写时保持文件原格式(逐字节可比)

GLOSS = {k: v for k, v in json.loads((BASE / "glossary.json").read_text(encoding="utf-8")).items() if not k.startswith("_")}

SYSTEM = """你是 AI Podcast(双语播客阅读站)的译者。给你一期访谈里若干句英文对白(带上一句作为语境),逐句译成地道、信达的中文。
- 不是逐词直译,要像中文媒体的访谈稿;口语保留语气但去掉 um/uh。
- 专有名词、产品名、人名按术语表;术语表没有的人名/公司名保留英文原文。
- 中文标点用全角(，。？！：；),中英文之间不加多余空格规则以外的东西。
- 每句单独翻译,不合并、不拆分、不增删内容。
只输出 JSON:{"items":[{"i":序号,"zh":"译文"}, ...]},序号与输入一一对应。"""

BACK_SYSTEM = """把下面这句中文访谈对白译回自然的英文口语(这是播客原话的中文版,原英文丢失了)。
只输出 JSON:{"en":"..."}"""


def ds(system, user, mx=4000):
    body = json.dumps({"model": "deepseek-chat", "messages": [
        {"role": "system", "content": system}, {"role": "user", "content": user}],
        "response_format": {"type": "json_object"}, "max_tokens": mx, "temperature": 0.2}).encode()
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))   # 直连,绕 Clash
    last = None
    for a in range(3):
        try:
            req = urllib.request.Request(URL, data=body, headers={
                "Content-Type": "application/json", "Authorization": f"Bearer {KEY}"})
            r = json.load(op.open(req, timeout=120))
            ch = r["choices"][0]
            if ch.get("finish_reason") == "length": raise RuntimeError("输出被 max_tokens 截断")
            return json.loads(ch["message"]["content"])
        except Exception as e:
            last = e; time.sleep(2 + a * 3)
    raise RuntimeError(str(last)[:120])


def gloss_for(texts):
    low = " ".join(texts).lower()
    hits = [f"{k} → {v}" for k, v in GLOSS.items() if k.lower() in low]
    return ("术语表(本批命中):\n" + "\n".join(hits) + "\n\n") if hits else ""


def translate_batch(items):
    """items: [(上一句en, 本句spk, 本句en)] → [zh]"""
    lines = []
    for i, (prev, spk, en) in enumerate(items):
        lines.append(f"[{i}] (上一句:{prev[-200:]})\n{spk}: {en}" if prev else f"[{i}] {spk}: {en}")
    user = gloss_for([x[2] for x in items]) + "\n\n".join(lines)
    out = ds(SYSTEM, user)
    got = {int(x["i"]): (x.get("zh") or "").strip() for x in out.get("items", []) if str(x.get("i", "")).isdigit()}
    res = [got.get(i, "") for i in range(len(items))]
    # 输入是「spk: en」,模型偶尔把说话人名也抄进译文开头(「Thariq：所以……」)
    res = [re.sub(r"^\s*" + re.escape(items[i][1]) + r"\s*[:：]\s*", "", z) if items[i][1] else z for i, z in enumerate(res)]
    # 「the AI」这类两三个词的碎句,译文可以没有汉字(如「AI」);长句没有汉字才算失败
    bad = [i for i, z in enumerate(res) if not z or (not CJK.search(z) and len(items[i][2].split()) > 3)]
    if bad: raise RuntimeError(f"第 {bad} 句没拿到中文")
    return res


def process(path, dry):
    raw = path.read_text(encoding="utf-8")
    d = json.loads(raw)
    fmt = detect_fmt(raw, d)
    if not fmt: return path.stem, "格式无法原样回写,跳过", 0
    todo, dropped, swapped = [], 0, 0
    for s in d.get("transcript") or []:
        keep = []
        for t in s.get("turns", []):
            en, zh = (t.get("en") or "").strip(), (t.get("zh") or "").strip()
            if not en and not zh: dropped += 1; continue          # 空 turn
            keep.append(t)
        s["turns"] = keep
        prev = ""
        for t in keep:
            en, zh = (t.get("en") or "").strip(), (t.get("zh") or "").strip()
            if not zh and CJK.search(en) and not re.search(r"[A-Za-z]{4,}", en):   # 字段放反
                t["zh"] = en; t["en"] = ""; swapped += 1; todo.append(("back", t, prev))
            elif not zh:
                todo.append(("zh", t, prev))
            prev = t.get("en") or prev
    if not todo and not dropped: return path.stem, "", 0
    if dry: return path.stem, f"待补 {len(todo)} 句(放反 {swapped})、删空 turn {dropped}", len(todo)
    zh_items = [(p, t.get("spk", ""), t["en"]) for k, t, p in todo if k == "zh"]
    zh_turns = [t for k, t, p in todo if k == "zh"]
    for a in range(0, len(zh_items), BATCH):
        for t, z in zip(zh_turns[a:a + BATCH], translate_batch(zh_items[a:a + BATCH])):
            t["zh"] = z
    for k, t, p in todo:
        if k == "back":
            en = (ds(BACK_SYSTEM, t["zh"]).get("en") or "").strip()
            if not en: raise RuntimeError("回译失败")
            t["en"] = en
    path.write_text(json.dumps(d, **fmt[0]) + fmt[1], encoding="utf-8")
    return path.stem, f"补 {len(todo)} 句(放反回译 {swapped})、删空 turn {dropped}", len(todo)


def main():
    dry = "--dry-run" in sys.argv
    ids = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not dry and not KEY: sys.exit("需要 DEEPSEEK_API_KEY")
    paths = [EPDIR / f"{i}.json" for i in ids] if ids else sorted(EPDIR.glob("*.json"))
    total = 0
    with ThreadPoolExecutor(6) as ex:
        futs = {ex.submit(process, p, dry): p for p in paths}
        for f in futs:
            try:
                eid, msg, n = f.result()
            except Exception as e:
                eid, msg, n = futs[f].stem, f"✗ {e}", 0
            if msg: print(f"  {eid}: {msg}")
            total += n
    print(f"fill_missing_zh: {'待补' if dry else '已补'} {total} 句")


if __name__ == "__main__":
    main()
