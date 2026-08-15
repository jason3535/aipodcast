#!/usr/bin/env python3
"""check_guest_names.py — 扫「嘉宾的姓在自己那期里被听错」。

背景:自动字幕越冷门的名字越容易音译错,而且错得像模像样,靠肉眼扫标题发现不了 ——
Jure Leskovec→Yuri Lecovitz、Carl Pei→Carl Pay(2026-08-15 用户报,站内已有 23 处正确
写法却混着 4 处误写)。特征很稳定:**名对、姓错**,且错的姓与真姓首字母相同、拼写很近。

判据:在该期正文里找「<名> <某个词>」,若那个词 ≠ 真姓、但首字母相同且编辑距离 ≤2,
就报出来。同期同时存在正确写法时(像 Carl Pei 那样),几乎必是误听。

用法:python3 pipeline/check_guest_names.py [--check]   --check 有发现则退出码 1
"""
import json, os, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


# 句首常见英文词:嘉宾名后跟句号再接这些词时会被误配成「名 + 假姓」
COMMON = {"Most","More","Much","Many","Must","Fun","Fine","Full","First","From","For","Sure",
          "The","This","That","There","They","Then","Their","Them","These","Those","Take","Two",
          "So","Some","See","Says","Said","Still","Such","Since","Say","Set",
          "And","But","Because","Before","Both","Back","Being","Been","Basically","By",
          "It","Its","In","Is","If","I'm","I've","I'd","I'll","We","We're","What","When","Where",
          "Can","Could","Come","Came","Chat","Look","Like","Let","Later","Last","Little",
          "My","Me","Maybe","Make","Mean","Mr","Ms","No","Not","Now","New","Next","Never",
          "Right","Really","Actually","About","After","Also","All","An","As","At","Are",
          "Talk","Talking","Thank","Thanks","Yeah","Yes","Yep","Went","Well","Was","Were","Will",
          "Welcome","Would","Want","Way","Why","Who","With","Which","While","Whether","Working"}

def lev(a, b):
    if a == b:
        return 0
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def texts(o, out):
    """把 json 里所有字符串抖出来。"""
    if isinstance(o, str):
        out.append(o)
    elif isinstance(o, list):
        for x in o:
            texts(x, out)
    elif isinstance(o, dict):
        for v in o.values():
            texts(v, out)


def main():
    check = "--check" in sys.argv
    idx = json.loads((ROOT / "mcp-data" / "index.json").read_text(encoding="utf-8"))["episodes"]
    hits = []
    for e in idx:
        name = (e.get("person") or "").strip()
        parts = name.split()
        if len(parts) < 2:
            continue
        first, last = parts[0], parts[-1]
        if not first.isascii() or not last.isascii() or len(last) < 3:
            continue
        f = ROOT / "mcp-data" / "ep" / f"{e['id']}.json"
        if not f.exists():
            continue
        try:
            buf = []
            texts(json.loads(f.read_text(encoding="utf-8")), buf)
            blob = "\n".join(buf)
        except Exception:
            continue
        bad = {}
        for m in re.finditer(re.escape(first) + r"\s+([A-Z][A-Za-z'\-]{2,})", blob):
            w = m.group(1)
            if w == last:
                continue
            if w[0].lower() != last[0].lower():
                continue           # 首字母都不同,多半是别的人名,别报
            # 所有格/复数是正常写法,不是误听(Taylor's / Chen's / Musks 会淹没真信号)
            base = re.sub(r"['’]s?$|s$", "", w)
            if base == last or base == last.rstrip("s"):
                continue
            # 句界误配:「…问 Elon. Most people…」会被当成「Elon Most」
            if w in COMMON:
                continue
            d = lev(w.lower(), last.lower())
            if 0 < d <= 2:
                bad[w] = bad.get(w, 0) + 1
        if bad:
            ok = len(re.findall(re.escape(first) + r"\s+" + re.escape(last), blob))
            hits.append((e["id"], name, bad, ok))

    for eid, name, bad, ok in hits:
        v = ", ".join(f"{w}×{n}" for w, n in sorted(bad.items(), key=lambda x: -x[1]))
        print(f"  ⚠ {eid}\n      正确「{name}」×{ok} · 疑似误听:{v}")
    print(f"嘉宾名检查:{len(idx)} 期,发现 {len(hits)} 期可疑", file=sys.stderr)

    if "--apply" in sys.argv and hits:
        # 以**站内登记的嘉宾名为权威**改回去。只改「名 + 近似姓」这个组合,不碰单独出现的
        # 词 —— 单独一个 Wilson / Darcy 完全可能是别人,误改比不改更糟。
        # 登记名本身也可能错,所以改之前已逐个用 YouTube 标题/简介核对过(2026-08-15 那轮:
        # 13 处全是字幕误听,登记名无一有误,例如 Ryan Stephen 被听成 Ryan Steven)。
        ep_by_id = {e["id"]: e for e in idx}
        total = 0
        pairs = []
        for eid, name, bad, ok in hits:
            first, last = name.split()[0], name.split()[-1]
            files = [ROOT / "mcp-data" / "ep" / f"{eid}.json"]
            vid = (ep_by_id[eid].get("src") or "").rstrip("/").split("/")[-1]
            if vid:
                t = ROOT / "pipeline" / "transcripts" / f"ep_{vid}.json"
                if t.exists():
                    files.append(t)
            for f in files:
                s = f.read_text(encoding="utf-8")
                n0 = s
                for w in bad:
                    s = re.sub(re.escape(first) + r"(\s+)" + re.escape(w) + r"\b",
                               lambda m: first + m.group(1) + last, s)
                if s != n0:
                    f.write_text(s, encoding="utf-8")
                    total += 1
            pairs += [(f"{first} {w}", f"{first} {last}") for w in bad]
        # 派生文件里也可能留有全名误写(「名+错姓」是唯一串,全局替换安全)
        for f in sorted((ROOT / "data").glob("*.json")) + [ROOT / "app.js"]:
            s = f.read_text(encoding="utf-8"); n0 = s
            for wrong, right in pairs:
                # **必须带词边界**:误写常常是正确写法的前缀(Henry Modiset ⊂ Henry Modisett),
                # 用 str.replace 会把已经正确的名字再替一次,替出 Modisettt(2026-08-15 实测)。
                s = re.sub(re.escape(wrong) + r"\b", right, s)
            if s != n0:
                f.write_text(s, encoding="utf-8"); total += 1
        print(f"✓ 已按登记名修正,改动 {total} 个文件", file=sys.stderr)
        # **改完必须自检**:替换本身可能把正确的名字改坏(误写常是正确写法的前缀,
        # 2026-08-15 用 str.replace 替出过 Modisettt / Parrottt / Greenblattt)。
        # 重跑一遍检测最省事 —— 名字被改坏后就不再等于登记名,一定会重新报出来。
        os.execv(sys.executable, [sys.executable, __file__])

    if check and hits:
        sys.exit(1)


if __name__ == "__main__":
    main()
