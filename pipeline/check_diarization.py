#!/usr/bin/env python3
"""check_diarization.py — 收录后说话人错标质检(只报告,不自动改;宁可不改不可改错)。
启发式扫 mcp-data/ep/<id>.json:①嘉宾 turn 开头像主持人提问 ②Host turn 含嘉宾第一人称经历
③同段相邻 turn 同 spk 且前问后答。命中打印「⚠️ 疑似错标」供人工按 diarization-check skill 复核。
用法: python3 check_diarization.py <epid> [epid...]   或 --all(全库扫,慢)
add_episode.py 收录完会自动对新期跑一次。退出码恒为 0(非门禁,提示性质)。
"""
import json, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
EPD = ROOT / "mcp-data" / "ep"

# 主持人提问标记(出现在嘉宾 turn 的前 80 字 → 可疑)
Q_HEAD = re.compile(r'我很好奇|我想请|我想谈谈|跟我们说说|请你|你的书|你觉得|你认为|你怎么看|欢迎(来到|回到)|感谢你(来|参加)|我的听众|我们的听众|本期节目|赞助')
# 「向对方提问」句式(整 turn 内,加权)
Q_YOU = re.compile(r'你(觉得|认为|怎么看|会怎么|如何|是不是|有没有)[^”]{0,40}[？?]')
# 嘉宾第一人称经历标记(出现在 Host turn → 可疑;保守,避免主持人自述误报)
FP_GUEST = re.compile(r'我(在|加入|离开|创办|创立) ?(Apple|苹果|谷歌|Google|OpenAI|Anthropic|DeepMind|微软|Meta|特斯拉|Nest|英特尔|NVIDIA|英伟达)|乔布斯(对|跟|告诉)我|我发明|我们发布了|我带的团队')

def scan(eid):
    f = EPD / f"{eid}.json"
    if not f.exists():
        print(f"  ✗ 找不到 {f}", file=sys.stderr); return 0
    d = json.load(open(f, encoding="utf-8"))
    guest_names = {t.get('spk') for s in d.get('transcript', []) for t in s.get('turns', [])} - {'Host', None}
    hits = 0
    for si, s in enumerate(d.get('transcript', [])):
        turns = s.get('turns', [])
        for ti, t in enumerate(turns):
            zh = t.get('zh', '') or ''
            spk = t.get('spk', '')
            if spk != 'Host':
                head_hit = bool(Q_HEAD.search(zh[:80]))
                you_hit = bool(Q_YOU.search(zh))
                if head_hit or (you_hit and len(zh) < 400):
                    hits += 1
                    print(f"  ⚠️ 疑似错标[嘉宾在提问] {eid} sec{si}[{ti}] ({s.get('sec','')[:30]}) {spk}: {zh[:70]}")
            else:
                if FP_GUEST.search(zh):
                    hits += 1
                    print(f"  ⚠️ 疑似错标[Host 讲嘉宾经历] {eid} sec{si}[{ti}] ({s.get('sec','')[:30]}): {zh[:70]}")
        # 同段内相邻同 spk 且前 turn 以问号结尾 → 可能问答被并给一人
        for ti in range(len(turns) - 1):
            a, b = turns[ti], turns[ti + 1]
            if a.get('spk') == b.get('spk') and (a.get('zh', '').rstrip().endswith(('？', '?'))):
                hits += 1
                print(f"  ⚠️ 疑似合并/延续 {eid} sec{si}[{ti}-{ti+1}] 同 spk 前问后续: {a.get('zh','')[-40:]}")
    if not hits:
        print(f"  ✓ {eid} 说话人启发式检查通过")
    else:
        print(f"  → {eid} 共 {hits} 处疑似,按 diarization-check skill 用中文原文人工复核(独有 tell/嘉宾事实核对),确认才改")
    return hits

def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__); return
    if args[0] == '--all':
        ids = sorted(p.stem for p in EPD.glob('*.json'))
    else:
        ids = args
    total = 0
    for eid in ids:
        total += scan(eid)
    print(f"扫描 {len(ids)} 期,疑似 {total} 处", file=sys.stderr)

if __name__ == '__main__':
    main()
