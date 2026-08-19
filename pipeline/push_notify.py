#!/usr/bin/env python3
"""push_notify.py — 生成 /push-latest.json 并触发浏览器推送(aipodcast / aipaper 共用)。

管线里的位置:收录 → postingest 重建完 → 本脚本。**只在本轮真有新条目时才发推送**
(靠 --ids 判断,那正是 postingest 已经收到的参数);没有新 id 就只刷新 json、不打扰任何人。

push-latest.json 是一份**滚动的最近 N 条**清单,不是本轮增量。原因:推送本身不带 payload,
SW 收到后拉这个文件、跟自己记的「上次提醒到哪」比对。用户离线三天再上线,一条推送就能
汇总成「3 期新访谈」;要是这里只写本轮增量,离线期间的其它期就永远不会被提到。

用法:
  python3 pipeline/push_notify.py --site aipodcast --ids id1 id2      # 写 json 并推送
  python3 pipeline/push_notify.py --site aipaper --ids ... --dry-run  # 只写 json,不发
  python3 pipeline/push_notify.py --site aipodcast                    # 无 ids:只刷新 json
"""
import argparse, json, os, sys, time, urllib.request
from pathlib import Path

KEEP = 10          # push-latest.json 保留最近多少条
API = "https://push.jasonlin.tech"

SITES = {
    "aipodcast": dict(
        root=Path("/Users/jason/CascadeProjects/aipodcast"),
        data="mcp-data/index.json", key="episodes", url="/#/episode/{id}",
    ),
    "aipaper": dict(
        root=Path("/Users/jason/Downloads/ai-paper-prototype"),
        data="data/index.json", key="papers", url="/#/paper/{id}",
    ),
}


def token():
    """PUSH_TOKEN 统一放 aipodcast 的 pipeline/.env(aipaper 没有自己的 .env,
       靠外部 export;两站共用同一个 push worker,共用一个 token)。"""
    t = os.environ.get("PUSH_TOKEN")
    if t:
        return t
    env = SITES["aipodcast"]["root"] / "pipeline" / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.startswith("PUSH_TOKEN="):
                return line.split("=", 1)[1].strip()
    return ""


def post(path, body, tok=""):
    url = API + path + (f"?token={tok}" if tok else "")
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json",
                                          # Python-urllib 默认 UA 会被 Cloudflare Bot 防护间歇性 403
                                          # (2026-08 三次 403 全在此;worker 业务码只会 401/400)
                                          "User-Agent": "aipodcast-pipeline/1.0 (+https://aipodcast.jasonlin.tech)"})
    # push worker 是 Cloudflare 上的公网服务,别走 Clash(与 DeepSeek 同理)
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with op.open(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", required=True, choices=list(SITES))
    ap.add_argument("--ids", nargs="*", default=[])
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    site = SITES[a.site]
    root = site["root"]

    items_all = json.loads((root / site["data"]).read_text(encoding="utf-8"))[site["key"]]
    by_id = {x["id"]: x for x in items_all}

    out_path = root / "push-latest.json"
    prev = []
    if out_path.exists():
        try:
            prev = json.loads(out_path.read_text(encoding="utf-8")).get("items", [])
        except Exception:
            prev = []

    now = int(time.time() * 1000)

    def mk(x, ts):
        return {"id": x["id"], "t": x.get("tZh") or x.get("tEn") or x["id"],
                "u": site["url"].format(id=x["id"]), "ts": ts}

    def date_ms(d):
        """把 'YYYY-MM-DD' 转成毫秒时间戳,给回填条目当 ts。"""
        try:
            return int(time.mktime(time.strptime(d[:10], "%Y-%m-%d")) * 1000)
        except Exception:
            return 0

    # pool 的 ts 语义 = 「这条什么时候被当作新内容宣告过」,SW 拿它跟自己记的 seen 比。
    pool = {i["id"]: i for i in prev}      # ① 既有条目保留原 ts(宣告过就是宣告过)

    fresh = []                              # ② 本轮真新收:ts=now,对所有订阅者都算「新」
    for eid in a.ids:
        x = by_id.get(eid)
        if not x:
            print(f"  ⚠ {eid} 不在 {site['data']} 里,跳过(重建链没跑完?)", file=sys.stderr)
            continue
        if eid in pool:
            continue
        pool[eid] = mk(x, now)
        fresh.append(eid)

    # ③ 回填站内最新若干条。**这一步是必需的**:没有它,这个文件就只反映"上一次带 ids
    #    跑过什么",可能停在任意历史状态 —— 新订阅者收到推送后点开看到的是一条老内容
    #    (2026-08-13 实测:文件里只剩一条 dry-run 时塞的条目)。
    #    回填条目的 ts 用发布日期而非 now,这样它们**不会**被当成新内容去打扰老订阅者。
    newest = sorted(items_all, key=lambda x: x.get("date", ""), reverse=True)[:KEEP]
    for x in newest:
        if x["id"] not in pool:
            pool[x["id"]] = mk(x, date_ms(x.get("date", "")))

    items = sorted(pool.values(), key=lambda i: i.get("ts", 0), reverse=True)[:KEEP]
    out_path.write_text(json.dumps({"updated": now, "items": items}, ensure_ascii=False),
                        encoding="utf-8")
    print(f"push-latest.json: {len(items)} 条(本轮新收 {len(fresh)},其余为最新内容回填)")

    if not fresh:
        print("本轮无新条目,不发推送。")
        return
    if a.dry_run:
        print("--dry-run:跳过发送。")
        return

    tok = token()
    if not tok:
        print("⚠ 没有 PUSH_TOKEN,跳过发送(json 已更新)。", file=sys.stderr)
        return

    total = {"sent": 0, "gone": 0, "failed": 0}
    offset, guard = 0, 0
    while offset is not None and guard < 25:      # guard:别让 next 分页出 bug 时打转
        r = post("/send", {"site": a.site, "offset": offset}, tok)
        for k in total:
            total[k] += r.get(k, 0)
        if r.get("errs"):
            print(f"  发送异常: {r['errs']}", file=sys.stderr)
        offset = r.get("next")
        guard += 1
    print(f"推送:成功 {total['sent']} · 失效已清理 {total['gone']} · 失败 {total['failed']}")


if __name__ == "__main__":
    main()
