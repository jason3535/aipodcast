#!/usr/bin/env python3
"""reader_report.py — 读者行为与留存报表(站群统一,数据来自 stats.jasonlin.tech 的 D1)。

起因:2026-08-25 Jason 发了公众号文章介绍 aipodcast,当天移动端 UV 从 0 跳到 13。
在此之前站上基本没有外部读者,UV 这个数字没有分析价值;有了真实读者之后,
真正要看的是「他们读了什么」和「会不会回来」,而不是每天手敲 SQL 看总数。

留存能回溯计算 —— D1 里存的是每条 view 的原始记录(含匿名 vid),
所以任何一天都可以事后算「某批人后来有没有回来」,不需要提前埋点。

用法:
  python3 pipeline/reader_report.py                 # 默认看 aipodcast,基准日 2026-08-25
  python3 pipeline/reader_report.py --site aipaper --since 2026-08-25
  python3 pipeline/reader_report.py --site all

口径:UV = count(distinct coalesce(sid, vid));vid 是 localStorage 里的随机匿名 id,
跨天不变,所以能算留存 —— 这正是 2026-08-09 把服务端「每日哈希」换成客户端 aid 的原因
(日哈希含当天日期,同一人隔天必换 id,跨天留存在结构上不可测)。
"""
import argparse, json, os, sys, urllib.parse, urllib.request

API = "https://stats.jasonlin.tech/q"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# path 前缀约定(六站共用一个 D1):aipodcast 无前缀,其余带前缀
FILTERS = {
    "aipodcast": "path NOT LIKE 'paper:%' AND path NOT LIKE 'graph-%' AND path NOT LIKE 'home:%'",
    "aipaper":   "path LIKE 'paper:%'",
    "graph":     "path LIKE 'graph-%'",
    "home":      "path LIKE 'home:%'",
    "all":       "1=1",
}


def token():
    t = os.environ.get("STATS_TOKEN")
    if t:
        return t
    env = os.path.join(ROOT, "pipeline", ".env")
    if os.path.exists(env):
        for line in open(env, encoding="utf-8"):
            if line.startswith("STATS_TOKEN="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("✗ 找不到 STATS_TOKEN(环境变量或 pipeline/.env)")


def q(sql, tok):
    url = API + "?" + urllib.parse.urlencode({"token": tok, "mode": "sql", "q": sql})
    req = urllib.request.Request(url, headers={"User-Agent": "aipodcast-pipeline/1.0"})
    # stats worker 在 Cloudflare 上,别走 Clash(与 DeepSeek 同理)
    op = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with op.open(req, timeout=40) as r:
        d = json.loads(r.read().decode())
    if "error" in d:
        sys.exit("✗ 查询失败:" + str(d["error"])[:120])
    return d.get("rows", [])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--site", default="aipodcast", choices=list(FILTERS))
    ap.add_argument("--since", default="2026-08-25", help="基准日(那批人的首次到访日)")
    a = ap.parse_args()
    tok, F = token(), FILTERS[a.site]
    D = "date(ts/1000,'unixepoch','+8 hours')"

    print(f"═══ {a.site} · 基准日 {a.since} 起 ═══\n")

    print("── 每日 UV / PV ──")
    for r in q(f"SELECT {D} d, count(distinct coalesce(nullif(sid,''),vid)) uv, count(*) pv,"
               f" sum(CASE WHEN ua='mobile' THEN 1 ELSE 0 END) mob"
               f" FROM events WHERE type='view' AND {F} AND {D} >= '{a.since}'"
               f" GROUP BY d ORDER BY d", tok):
        share = round(r["mob"] * 100 / r["pv"]) if r["pv"] else 0
        print(f"  {r['d']}  UV {r['uv']:>4}  PV {r['pv']:>5}  移动端占 PV {share:>3}%")

    print("\n── 留存:基准日那批人,后来回来了吗 ──")
    base = q(f"SELECT DISTINCT vid FROM events WHERE type='view' AND {F}"
             f" AND {D} = '{a.since}' AND vid<>''", tok)
    ids = [r["vid"] for r in base]
    print(f"  基准日访客 {len(ids)} 人")
    if ids:
        inlist = ",".join("'" + i.replace("'", "") + "'" for i in ids)
        rows = q(f"SELECT {D} d, count(distinct vid) back FROM events WHERE type='view' AND {F}"
                 f" AND vid IN ({inlist}) AND {D} > '{a.since}' GROUP BY d ORDER BY d", tok)
        if not rows:
            print("  → 之后无人回访(样本还太新或确实没留住)")
        for r in rows:
            print(f"  {r['d']}  回访 {r['back']:>3} 人  ({round(r['back']*100/len(ids))}%)")

    print("\n── 读了哪些单集 ──")
    rows = q(f"SELECT path, count(*) pv, count(distinct vid) uv FROM events WHERE type='view'"
             f" AND {F} AND path LIKE '%/episode/%' AND {D} >= '{a.since}'"
             f" GROUP BY path ORDER BY uv DESC, pv DESC LIMIT 12", tok)
    titles = {}
    app = os.path.join(ROOT, "app.js")
    if os.path.exists(app):
        import re
        m = re.search(r"const EPISODES = (\[[\s\S]*?\]);", open(app, encoding="utf-8").read())
        if m:
            for e in json.loads(m.group(1)):
                titles[e["id"]] = (e.get("tZh") or e.get("tEn") or "")[:40]
    for r in rows:
        eid = r["path"].split("/episode/")[-1]
        print(f"  UV {r['uv']:>3}  PV {r['pv']:>3}  {titles.get(eid, eid)}")

    print("\n── 页面类型分布(看是只逛首页还是真读全文) ──")
    for r in q(f"SELECT CASE WHEN path IN ('/','paper:/','home:/') THEN '首页'"
               f" WHEN path LIKE '%/episode/%' OR path LIKE '%/paper/%' THEN '全文'"
               f" WHEN path LIKE '%/person/%' THEN '人物页'"
               f" WHEN path LIKE '%/ask%' THEN '问答' ELSE '其他' END kind,"
               f" count(*) pv, count(distinct vid) uv FROM events WHERE type='view' AND {F}"
               f" AND {D} >= '{a.since}' GROUP BY kind ORDER BY pv DESC", tok):
        print(f"  {r['kind']:6}  UV {r['uv']:>4}  PV {r['pv']:>5}")

    print("\n── 外部来源(去掉自有站与直接访问) ──")
    rows = q(f"SELECT ref, count(*) pv, count(distinct vid) uv FROM events WHERE type='view' AND {F}"
             f" AND ref<>'' AND ref NOT LIKE '%jasonlin.tech%' AND {D} >= '{a.since}'"
             f" GROUP BY ref ORDER BY pv DESC LIMIT 8", tok)
    if not rows:
        print("  无(微信内打开会剥掉 referrer,文章流量都计为直接访问)")
    for r in rows:
        print(f"  {r['ref'][:44]:44} PV {r['pv']:>3}  UV {r['uv']:>3}")


if __name__ == "__main__":
    main()
