#!/usr/bin/env python3
"""remove_episode.py — 把一期已上线的单集从全站彻底下架,并**记进排除名单不让它再回来**。

背景(2026-08-31):`mosseri-throwing-2026`(Throwing Fits)被自动收录进来,但那是一档
男装/闲聊播客 —— 1012 个 turn、33% 短于 30 字符("Yeah." "Shoes." "Okay."),全库
610 期里碎片化第一名(turn 中位长 50 字符 vs 全库中位 370)。转录本身没错,是**选题**
不该收:整期 AI 相关词密度极低,大段在聊亚麻衬衫和天气。

**为什么必须有排除名单**:auto_refresh 判重只看 app.js 的 EPISODES 里已有哪些 vid
(load_state 的 `vids`)。手工把这期从 app.js 删掉之后,发现环节下一轮照样会搜到同一个
视频、照样过闸门、照样再收一遍 —— 删了等于没删。所以下架必须同时往 excluded.json
写一条,auto_refresh 把它并进 `exist` 集合当成"已存在"跳过。

用法:
  python3 pipeline/remove_episode.py <episode_id> --reason "选题不符:男装闲聊播客"
  python3 pipeline/remove_episode.py <episode_id> --reason "..." --dry-run

删完必须重建(本脚本会打印):build_mcp_data → gen_views/gen_topics → build_share_pages
→ gen_feed,然后跑 postingest 的门禁段。
"""
import argparse
import json
import re
import shutil
import sys
from datetime import date
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
APP = ROOT / "app.js"
EXCLUDED = BASE / "excluded.json"


def load_episodes(html):
    m = re.search(r"const EPISODES = (\[[\s\S]*?\]);\n\n/\* ====== REAL", html)
    if not m:
        sys.exit("app.js 里找不到 EPISODES")
    return json.loads(m.group(1)), m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("eid")
    ap.add_argument("--reason", required=True, help="下架原因,会写进 excluded.json 备查")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    html = APP.read_text(encoding="utf-8")
    eps, m = load_episodes(html)
    target = next((e for e in eps if e["id"] == a.eid), None)
    if not target:
        sys.exit(f"EPISODES 里没有 {a.eid}")

    pid = target["pid"]
    pod_en = (target.get("pod") or {}).get("en", "")
    vid = (target.get("src") or "").rstrip("/").split("/")[-1]
    rest = [e for e in eps if e["id"] != a.eid]
    pid_orphan = not any(e["pid"] == pid for e in rest)
    pod_orphan = not any((e.get("pod") or {}).get("en") == pod_en for e in rest)

    print(f"下架 {a.eid}\n  人物 {pid}{'(下架后 0 期,人物档一并移除)' if pid_orphan else '(还有其他期,人物档保留)'}"
          f"\n  节目 {pod_en}{'(下架后 0 期,登记一并移除)' if pod_orphan else '(还有其他期,登记保留)'}"
          f"\n  视频 {vid} → 写入排除名单")
    if a.dry_run:
        print("--dry-run,未改动任何文件")
        return

    # ---- 1. app.js:EPISODES ----
    html = html[:m.start(1)] + json.dumps(rest, ensure_ascii=False) + html[m.end(1):]
    APP.write_text(html, encoding="utf-8")

    # ---- 2. app.js:孤儿人物/节目(复用 auto_refresh 的回滚函数,别再写一份) ----
    if pid_orphan or pod_orphan:
        sys.path.insert(0, str(BASE))
        import auto_refresh as ar
        if pid_orphan:
            ar.drop_person(pid)
            # PHOTOS 是个扁平的字符串 Set,只在集合内部替换,别对全文做正则(pid 常是
            # 别处的子串)
            h = APP.read_text(encoding="utf-8")
            pm = re.search(r"const PHOTOS=new Set\((\[[\s\S]*?\])\);", h)
            if pm:
                cur = [x.strip().strip("'") for x in pm.group(1).strip("[]").split(",") if x.strip()]
                if pid in cur:
                    kept = [x for x in cur if x != pid]
                    h = h[:pm.start(1)] + "[" + ",".join(f"'{x}'" for x in kept) + "]" + h[pm.end(1):]
                    APP.write_text(h, encoding="utf-8")
                    print(f"  · 从 PHOTOS 移除 {pid}")
        if pod_orphan:
            ar.drop_pod(pod_en)

    # ---- 3. 派生数据 ----
    extra = ROOT / "data" / "ep-extra.json"
    d = json.loads(extra.read_text(encoding="utf-8"))
    if d.pop(a.eid, None) is not None:
        extra.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
        print("  · data/ep-extra.json 已剔除")

    tp = ROOT / "data" / "topics.json"
    t = json.loads(tp.read_text(encoding="utf-8"))
    n = 0
    for slug, items in list(t.get("items", {}).items()):
        keep = [x for x in items if x.get("ep") != a.eid]
        n += len(items) - len(keep)
        if keep:
            t["items"][slug] = keep
        else:
            del t["items"][slug]
    if n:
        tp.write_text(json.dumps(t, ensure_ascii=False), encoding="utf-8")
        print(f"  · data/topics.json 剔除 {n} 条")

    # 观点演变按 pid 存,内容里不带 ep id —— 整条删掉让 gen_views 按剩下的期重算
    vp = ROOT / "data" / "views.json"
    v = json.loads(vp.read_text(encoding="utf-8"))
    if v.pop(pid, None) is not None:
        vp.write_text(json.dumps(v, ensure_ascii=False), encoding="utf-8")
        print(f"  · data/views.json 删掉 {pid} 整条(gen_views 会按剩余期重算)")

    # ---- 4. 全文 + 静态页 ----
    for p in [ROOT / "mcp-data" / "ep" / f"{a.eid}.json"]:
        if p.exists():
            p.unlink(); print(f"  · 删 {p.relative_to(ROOT)}")
    for dpath in [ROOT / "e" / a.eid, ROOT / "pp" / pid if pid_orphan else None]:
        if dpath and dpath.exists():
            shutil.rmtree(dpath); print(f"  · 删 {dpath.relative_to(ROOT)}/")

    # ---- 5. 推送快照(只删条目,不动 updated,避免被当成新推送重发) ----
    pl = ROOT / "push-latest.json"
    if pl.exists():
        p = json.loads(pl.read_text(encoding="utf-8"))
        before = len(p.get("items", []))
        p["items"] = [x for x in p.get("items", []) if x.get("id") != a.eid]
        if len(p["items"]) != before:
            pl.write_text(json.dumps(p, ensure_ascii=False), encoding="utf-8")
            print("  · push-latest.json 剔除(未动 updated,不会重发)")

    # ---- 6. 排除名单:没有这一步,下一轮 cron 会把它原样收回来 ----
    ex = json.loads(EXCLUDED.read_text(encoding="utf-8")) if EXCLUDED.exists() else []
    if not any(x.get("vid") == vid for x in ex):
        ex.append({"vid": vid, "id": a.eid, "pid": pid, "pod": pod_en,
                   "reason": a.reason, "removed": date.today().isoformat()})
        EXCLUDED.write_text(json.dumps(ex, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"  · excluded.json +1({vid}) —— auto_refresh 之后会跳过它")

    print("\n下一步(缺一不可):")
    print("  node pipeline/build_mcp_data.js && python3 pipeline/gen_views.py && python3 pipeline/gen_topics.py \\")
    print("    && node pipeline/build_share_pages.js && python3 pipeline/gen_feed.py")
    print("  然后跑 postingest.sh 的门禁段(语法/ES/术语/嘉宾名/产物/POD_INFO)")


if __name__ == "__main__":
    main()
