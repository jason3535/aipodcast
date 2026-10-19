#!/usr/bin/env python3
"""「去广告」邀请码的发起人工具(Jason 用)。密钥在 pipeline/.env 的 INVITE_ADMIN_KEY。
  python3 pipeline/invite_admin.py issue [n]        签发 n 个根邀请码(默认 1),连同邀请链接打印,直接发给人
  python3 pipeline/invite_admin.py stats            成员数 / 码的签发与使用 / 未用的根码 / 邀请树
  python3 pipeline/invite_admin.py grant <mid> [n]  给某成员补发 n 个码(日常不用;mid 看 stats)
"""
import json, re, sys, urllib.request, datetime
from pathlib import Path
B = "https://invite.jasonlin.tech"
env = (Path(__file__).resolve().parent / ".env").read_text(encoding="utf-8")
m = re.search(r"^INVITE_ADMIN_KEY=(.+)$", env, re.M)
KEY = m.group(1).strip() if m else sys.exit("pipeline/.env 里没有 INVITE_ADMIN_KEY")

def api(path, body=None):
    req = urllib.request.Request(B + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"X-Admin": KEY, "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Macintosh) aipodcast-admin"}, method="POST" if body is not None else "GET")
    return json.load(urllib.request.build_opener(urllib.request.ProxyHandler({})).open(req, timeout=20))

a = sys.argv[1:] or ["help"]
if a[0] == "issue":
    d = api("/admin/issue", {"n": int(a[1]) if len(a) > 1 else 1})
    for c in d.get("codes", []): print(f"{c}   邀请链接: https://aipodcast.jasonlin.tech/#/mine?invite={c}")
elif a[0] == "stats":
    d = api("/admin/stats")
    print(f"成员 {d['members']} 人 · 已签发 {d['codes']} 码 · 已用 {d['used']} · 未用根码 {len(d['unusedRoot'])}: {' '.join(d['unusedRoot']) or '-'}")
    by = {}
    for x in d["tree"]: by.setdefault(x["invitedBy"], []).append(x)
    def show(pid, dep):
        for x in by.get(pid, []):
            t = datetime.datetime.fromtimestamp(x["since"] / 1000).strftime("%m-%d %H:%M")
            print("  " * dep + f"└ {x['mid']}  via {x['via']}  {t}  已邀 {x['used']}/2" + (f"  ({x['label']})" if x.get("label") else ""))
            show(x["mid"], dep + 1)
    print("邀请树(根 = Jason):"); show("root", 0)
elif a[0] == "grant" and len(a) > 1:
    print(api("/admin/grant", {"mid": a[1], "n": int(a[2]) if len(a) > 2 else 1}))
else:
    print(__doc__)
