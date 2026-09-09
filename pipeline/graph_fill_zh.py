#!/usr/bin/env python3
"""graph_fill_zh.py — 给四图谱里没有 scholarZh 条目的人物节点补中文(zhName/title/bio)。

背景(2026-09-09):四站共 58 个节点只有英文条目——多半是 auto_refresh/人工批量加人时只写了 scholars 数组
漏了 scholarZh map——切中文时显示英文或空白;分享页的中文标题/简介也跟着空。DeepSeek 批译,
zhName 规则:华人用本名汉字(陈丹琦、朱秋国),非华人给通行音译(萨姆·奥特曼)或保留英文名。
用法:python3 pipeline/graph_fill_zh.py [--apply] [--check]   需 DEEPSEEK_API_KEY。幂等。
"""
import io, json, os, re, sys, urllib.request
from pathlib import Path
SITES = {"ai": "/Users/jason/ai-scholar-graph", "hw": "/Users/jason/hardware-startup-graph",
         "inv": "/Users/jason/investor-graph", "design": "/Users/jason/designer-graph"}
def js_str(s): return json.dumps(s, ensure_ascii=False)
def load(repo):
    s = Path(repo, "index.html").read_text(encoding="utf-8")
    arr = re.search(r"const scholars = (\[[\s\S]*?\n\s*\]);", s).group(1)
    zh = re.search(r"const scholarZh = \{([\s\S]*?)\n\};", s)
    have = set(re.findall(r'^\s*"?([\w-]+)"?\s*:\s*\{', zh.group(1), re.M))
    nodes = []
    for m in re.finditer(r'"?id"?\s*:\s*"([\w-]+)"', arr):
        gid = m.group(1)
        if gid in have: continue
        blk = arr[m.start(): arr.find('\n  {', m.end()) if arr.find('\n  {', m.end()) > 0 else len(arr)]
        def f(k):
            mm = re.search(r'"?%s"?\s*:\s*"((?:[^"\\]|\\.)*)"' % k, blk); return mm.group(1) if mm else ""
        nodes.append(dict(id=gid, name=f("name"), org=f("org"), title=f("title"), bio=f("bio")))
    return s, zh, nodes
def translate(nodes):
    key = os.environ.get("DEEPSEEK_API_KEY") or sys.exit("需要 DEEPSEEK_API_KEY")
    prompt = ("把下面这些人物条目翻成中文,返回 JSON 对象 {id: {zhName, title, bio}}。要求:zhName 华人用本名汉字(如 Chen Danqi→陈丹琦),"
              "非华人用通行音译(如 Sam Altman→萨姆·奥特曼);title 简洁(≤24 字,用「·」分隔);bio 忠实全译、不省略数字与专名,"
              "公司/产品/机构名保留原文或用通行中文名,不加引号、不解释。\n" + json.dumps(nodes, ensure_ascii=False))
    req = urllib.request.Request("https://api.deepseek.com/chat/completions",
        data=json.dumps({"model": "deepseek-chat", "temperature": 0.2, "response_format": {"type": "json_object"},
                         "messages": [{"role": "user", "content": prompt}]}).encode(),
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    return json.loads(json.loads(urllib.request.urlopen(req, timeout=300).read())["choices"][0]["message"]["content"])
def main():
    apply_, check = "--apply" in sys.argv, "--check" in sys.argv; total = 0
    for key, repo in SITES.items():
        s, zh, nodes = load(repo); total += len(nodes)
        print(f"  {key:7s} 缺中文条目 {len(nodes)}" + ("" if not nodes else " → " + ",".join(n["id"] for n in nodes)[:120]))
        if not apply_ or not nodes: continue
        got = {}
        for i in range(0, len(nodes), 12): got.update(translate(nodes[i:i+12]))
        rows, bad = [], []
        for n in nodes:
            g = got.get(n["id"]) or {}
            if not (g.get("bio") and re.search(r"[一-鿿]", g["bio"])): bad.append(n["id"]); continue
            for k in ("zhName", "title", "bio"): g[k] = (g.get(k) or "").replace('"', "").replace("\n", " ").strip()
            rows.append(f'  {n["id"]}: {{ zhName: {js_str(g["zhName"] or n["name"])}, title: {js_str(g["title"])}, bio: {js_str(g["bio"])} }},')
        body = zh.group(1).rstrip()
        if body and not body.endswith(","): body += ","
        s = s[:zh.start(1)] + body + "\n" + "\n".join(rows) + s[zh.end(1):]
        Path(repo, "index.html").write_text(s, encoding="utf-8")
        print(f"    ✓ 写入 {len(rows)} 条" + (f",{len(bad)} 条模型没给出合格译文:{bad}" if bad else ""))
    if check and total: sys.exit(1)
if __name__ == "__main__": main()
