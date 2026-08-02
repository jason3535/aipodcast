#!/usr/bin/env python3
"""reingest.py — 就地重跑已收录集的正文,保留原 id。

用于修复"空壳"集(2026-08-01 那批:分块翻译被静默丢弃,正文只剩残片甚至全空)。
与 add_episode.py 的区别:
  - 不新建 id(add_episode 撞 id 会加后缀 b/c/…,会让 e/<id> 分享页和 sitemap 链接断掉)
  - 元数据(pid / pod / date / fields / src / 标题导语)全部沿用 app.js 里现有的
  - 只重算 transcript + insights,并按需补 --min

用法:
  python3 pipeline/reingest.py <id> [<id> ...]      # 重翻正文
  python3 pipeline/reingest.py --min-only <id> ...  # 只补时长(正文没坏的情况)
  python3 pipeline/reingest.py --from-audit         # 拿完整性审计的严重项当输入
"""
import argparse, importlib.util, json, os, re, subprocess, sys, time
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
APP = ROOT / "app.js"
EPDIR = ROOT / "mcp-data" / "ep"

# 复用 add_episode 的抓取/翻译/提炼实现(含新的失败门禁),避免两套逻辑漂移
spec = importlib.util.spec_from_file_location("add_episode", BASE / "add_episode.py")
AE = importlib.util.module_from_spec(spec)
_argv = sys.argv; sys.argv = ["add_episode.py"]
spec.loader.exec_module(AE)
sys.argv = _argv


def load_app():
    html = APP.read_text(encoding="utf-8")
    a = html.index("const EPISODES = ")
    b = html.index("/* ====== REAL ASSETS")
    eps = json.loads(html[a + len("const EPISODES = "):b].rstrip().rstrip(";").rstrip())
    return html, eps, a, b


def save_app(html, eps, a, b):
    eps.sort(key=lambda e: e.get("date", ""), reverse=True)
    APP.write_text(html[:a] + "const EPISODES = " + json.dumps(eps, ensure_ascii=False) + ";\n\n" + html[b:],
                   encoding="utf-8")


def guest_of(pid, html):
    m = re.search(r"'" + re.escape(pid) + r"':\{en:'([^']*)'", html)
    return (m.group(1).split(" ")[0] if m else pid)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--min-only", action="store_true", help="只用 YouTube 时长补 min,不重翻正文")
    ap.add_argument("--from-audit", action="store_true", help="用 audit_completeness.js 的严重项作为输入")
    a = ap.parse_args()

    ids = list(a.ids)
    if a.from_audit:
        out = subprocess.run(["node", str(BASE / "audit_completeness.js"), "--json"],
                             capture_output=True, text=True, cwd=str(ROOT)).stdout
        ids += [r["id"] for r in json.loads(out)["fatal"]]
    if not ids:
        sys.exit("没有指定要重跑的集 id")

    html, eps, ai, bi = load_app()
    by_id = {e["id"]: e for e in eps}
    missing = [i for i in ids if i not in by_id]
    if missing:
        sys.exit(f"app.js 里没有这些 id: {missing}")

    okc, failed = [], []
    for n, eid in enumerate(ids, 1):
        e = by_id[eid]
        src = e.get("src", "")
        print(f"\n[{n}/{len(ids)}] {eid}  {src}", file=sys.stderr)
        try:
            ytitle, ymin, ydate = AE.yt_meta(src)
            newmin = ymin or e.get("min") or 0
            if not newmin:
                raise RuntimeError("拿不到时长(YouTube 限流?),跳过")

            if a.min_only:
                f = EPDIR / f"{eid}.json"
                if f.exists():
                    d = json.loads(f.read_text(encoding="utf-8")); d["min"] = newmin
                    f.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
                # 必须先重载再改再存:重跑期间别的进程可能动过 app.js,
                # 若先改内存里的旧对象再 load_app(),改动会被覆盖掉(写回的是刚读进来的原值)
                html, eps, ai, bi = load_app(); by_id = {x["id"]: x for x in eps}
                by_id[eid]["min"] = newmin
                save_app(html, eps, ai, bi)
                html, eps, ai, bi = load_app(); by_id = {x["id"]: x for x in eps}
                print(f"  ✓ 仅补时长 min={newmin}", file=sys.stderr)
                okc.append(eid)
                continue

            text = AE.get_subs(src)
            if len(text) < 2000:
                raise RuntimeError(f"字幕不足({len(text)} 字符)")
            guest = guest_of(e["pid"], html)
            print(f"  翻译({len(text)} 字符, guest={guest})", file=sys.stderr)
            ts = AE.translate(text, guest)          # 任一块失败会抛错,不会写半截稿
            ins = AE.insights(text)

            # 标题/导语沿用现有;缺了才补
            tEn, tZh = e.get("tEn", ""), e.get("tZh", "")
            sEn, sZh = e.get("sEn", ""), e.get("sZh", "")
            if not (tEn and tZh and sEn and sZh):
                m = AE.meta(text, guest)
                tEn = tEn or m.get("tEn", ytitle[:60]); tZh = tZh or m.get("tZh", "")
                sEn = sEn or m.get("sEn", ""); sZh = sZh or m.get("sZh", "")

            EPDIR.mkdir(parents=True, exist_ok=True)
            json.dump({"id": eid, "pid": e["pid"], "podEn": e["pod"]["en"], "podZh": e["pod"]["zh"],
                       "date": e["date"], "min": newmin, "fields": e.get("fields", []),
                       "tEn": tEn, "tZh": tZh, "sEn": sEn, "sZh": sZh, "src": src,
                       "insights": ins, "transcript": ts},
                      open(EPDIR / f"{eid}.json", "w"), ensure_ascii=False)

            # 重新读一遍 app.js 再改:重跑期间别的进程(cron/另一个会话)可能动过它
            html, eps, ai, bi = load_app(); by_id = {x["id"]: x for x in eps}
            cur = by_id[eid]
            cur["min"] = newmin; cur["insights"] = ins
            cur["tEn"], cur["tZh"], cur["sEn"], cur["sZh"] = tEn, tZh, sEn, sZh
            cur["reingestedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            save_app(html, eps, ai, bi)
            html, eps, ai, bi = load_app(); by_id = {x["id"]: x for x in eps}

            turns = sum(len(s.get("turns", [])) for s in ts)
            print(f"  ✓ {len(ts)} 节 / {turns} turn / 共识{len(ins.get('consensus',[]))}反{len(ins.get('contrarian',[]))}", file=sys.stderr)
            okc.append(eid)
        except Exception as ex:
            print(f"  ✗ 失败:{str(ex)[:180]}", file=sys.stderr)
            failed.append((eid, str(ex)[:120]))

    subprocess.run(["python3", str(BASE / "split_extra.py")], check=False)
    print(f"\n=== 完成 {len(okc)}/{len(ids)} ===", file=sys.stderr)
    for i, why in failed:
        print(f"  ✗ {i}: {why}", file=sys.stderr)
    print("提示:再跑 fix_spacing / build_mcp_data / build_share_pages / audit_completeness", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
