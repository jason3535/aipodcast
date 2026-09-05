#!/usr/bin/env python3
"""graph_conn_labels_zh.py — 给四图谱 connections 里没有中文的关系边标签补 connLabelZh。

背景:边标签(label)是英文写进 connections,中文靠 connLabelZh 映射;历史上很多边加了英文
忘了配中文(2026-09-05 统计:ai 50 / hw 99 / inv 40 / design 24 条纯英文无译),切中文时这些边
原样显示英文。标签本身已是中文的(不少后加的边直接写中文)不需要映射,跳过。
用法:python3 pipeline/graph_conn_labels_zh.py [--apply] [--identity-rest] [--check]   需 DEEPSEEK_API_KEY(pipeline/.env)
--check:有纯英文未译 → 非零退出(门禁)。幂等。
"""
import io, json, os, re, sys, urllib.request
from pathlib import Path
SITES = {"ai": "/Users/jason/ai-scholar-graph", "hw": "/Users/jason/hardware-startup-graph",
         "inv": "/Users/jason/investor-graph", "design": "/Users/jason/designer-graph"}
CJK = re.compile(r"[一-鿿]")
def load(repo):
    s = Path(repo, "index.html").read_text(encoding="utf-8")
    conns = re.findall(r'\{source:\s*"[\w-]+"\s*,\s*target:\s*"[\w-]+"\s*,\s*type:\s*"[^"]*"\s*,\s*label:\s*"((?:[^"\\]|\\.)*)"\}', s)
    m = re.search(r"const connLabelZh = \{([\s\S]*?)\n\};", s)
    have = set(re.findall(r'^\s*"((?:[^"\\]|\\.)*)"\s*:', m.group(1), re.M)) if m else set()
    todo = [l for l in dict.fromkeys(conns) if l not in have and not CJK.search(l)]
    return s, todo
def translate(labels, examples):
    key = os.environ.get("DEEPSEEK_API_KEY") or sys.exit("需要 DEEPSEEK_API_KEY")
    ex = "\n".join(f"{k} => {v}" for k, v in examples[:8])
    prompt = ("把下面这些「人物关系图谱」的边标签翻成简洁中文,风格与示例一致:公司/产品/人名/论文名/缩写保留原文,"
              "句内分隔用「；」或「，」,不加引号,不解释,每条尽量不超过 20 个汉字。\n示例:\n" + ex +
              "\n\n只返回一个 JSON 对象:{原文: 中文}。待译:\n" + json.dumps(labels, ensure_ascii=False))
    req = urllib.request.Request("https://api.deepseek.com/chat/completions",
        data=json.dumps({"model": "deepseek-chat", "temperature": 0.2, "response_format": {"type": "json_object"},
                         "messages": [{"role": "user", "content": prompt}]}).encode(),
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
    out = json.loads(urllib.request.urlopen(req, timeout=180).read())["choices"][0]["message"]["content"]
    return json.loads(out)
def main():
    apply_, check = "--apply" in sys.argv, "--check" in sys.argv
    total = 0
    for name, repo in SITES.items():
        s, todo = load(repo)
        print(f"  {name:7s} 纯英文未译 {len(todo)}")
        total += len(todo)
        if not apply_ or not todo: continue
        m = re.search(r"const connLabelZh = \{([\s\S]*?)\n\};", s)
        examples = re.findall(r'^\s*"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"', m.group(1), re.M)
        got = {}
        for i in range(0, len(todo), 60):
            got.update(translate(todo[i:i+60], examples))
        rows, bad = [], []
        for l in todo:
            z = (got.get(l) or "").strip().replace('"', "").replace("\n", " ")
            if not CJK.search(z): bad.append(l); continue
            rows.append(f'  "{l}": "{z}",')
        if bad and "--identity-rest" in sys.argv:
            # 模型给不出中文的,基本是「OpenAI 2016-2021」「Diffusion Transformers (DiT), 2022」这类
            # 纯专名+年份,中文写法与原文相同 → 按原文映射收掉,别让门禁永远红着。
            rows += [f'  "{l}": "{l}",' for l in bad]; print(f"    · {len(bad)} 条无可译内容,按原文映射:{bad[:3]}"); bad = []
        if bad: print(f"    ⚠ {len(bad)} 条模型没给出合格译文,留待下次:{bad[:3]}")
        end = m.end(1)
        body = m.group(1).rstrip()
        if body and not body.endswith(","): body += ","
        s = s[:m.start(1)] + body + "\n" + "\n".join(rows) + s[end:]
        Path(repo, "index.html").write_text(s, encoding="utf-8")
        print(f"    ✓ 写入 {len(rows)} 条")
    if check and total: sys.exit(1)
if __name__ == "__main__": main()
