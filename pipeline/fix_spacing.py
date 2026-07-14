#!/usr/bin/env python3
"""fix_spacing.py — 收录/重建后统一 CJK-EN 空格(站点标准:中英文与数字之间加半角空格)。
gen_brief/gen_topics/gen_views/meta 的 DeepSeek 输出常漏这个空格,每轮跑一次即可。幂等。
覆盖:index.html 内联 EPISODES 标题(tZh/sZh)+ TOPICS/VIEWS zh + data/ep-extra.json 的 brief。
用法:python3 pipeline/fix_spacing.py"""
import io, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent

def space_fix(s):
    if not isinstance(s, str): return s
    s = re.sub(r'([一-鿿])([A-Za-z0-9])', r'\1 \2', s)
    s = re.sub(r'([A-Za-z0-9)])([一-鿿])', r'\1 \2', s)
    return s

def deep_fix(v):
    if isinstance(v, str): return space_fix(v)
    if isinstance(v, list): return [deep_fix(x) for x in v]
    if isinstance(v, dict): return {k: deep_fix(x) for k, x in v.items()}
    return v

def extract_json(html, name):
    m = re.search(rf'const {name}\s*=\s*', html)
    if not m: return None
    st = m.end(); openc = html[st]; closec = '}' if openc == '{' else ']'
    depth = 0; i = st; instr = esc = False
    while i < len(html):
        c = html[i]
        if instr:
            if esc: esc = False
            elif c == '\\': esc = True
            elif c == '"': instr = False
        else:
            if c == '"': instr = True
            elif c == openc: depth += 1
            elif c == closec:
                depth -= 1
                if depth == 0: return st, i + 1, json.loads(html[st:i + 1])
        i += 1
    return None

def main():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    # 1) 内联 EPISODES 标题
    a = html.index('const EPISODES = '); b = html.index('/* ====== REAL ASSETS')
    arr = json.loads(html[a + len('const EPISODES = '):b].rstrip().rstrip(';').rstrip())
    for e in arr:
        e['tZh'] = space_fix(e.get('tZh', '')); e['sZh'] = space_fix(e.get('sZh', ''))
    html = html[:a] + 'const EPISODES = ' + json.dumps(arr, ensure_ascii=False) + ';\n\n' + html[b:]
    # 2) TOPICS / VIEWS
    for name in ['TOPICS', 'VIEWS']:
        r = extract_json(html, name)
        if r:
            st, en, obj = r
            html = html[:st] + json.dumps(deep_fix(obj), ensure_ascii=False) + html[en:]
    (ROOT / 'index.html').write_text(html, encoding='utf-8')
    # 3) ep-extra brief
    exf = ROOT / 'data' / 'ep-extra.json'
    if exf.exists():
        ex = json.loads(exf.read_text(encoding='utf-8'))
        for v in ex.values():
            if isinstance(v, dict) and 'brief' in v:
                v['brief'] = deep_fix(v['brief'])
        exf.write_text(json.dumps(ex, ensure_ascii=False), encoding='utf-8')
    # 复检
    NOSPACE = re.compile(r'[一-鿿][A-Za-z0-9]|[A-Za-z0-9)][一-鿿]')
    left = len(NOSPACE.findall(html))
    print(f'fix_spacing 完成 | index.html 残留 {left}(含 EN 内正常情形,仅供参考)')

if __name__ == '__main__':
    main()
