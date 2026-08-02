#!/usr/bin/env python3
"""check_diarization.py — 收录后说话人错标质检(只报告,不自动改;宁可不改不可改错)。
启发式扫 mcp-data/ep/<id>.json:①嘉宾 turn 开头像主持人提问 ②Host turn 含嘉宾第一人称经历
③同段相邻 turn 同 spk 且前问后答 ④turn 中间夹短插问(对方打断被并轮) ⑤对制作方说的话被标成 Host
⑥全期身份事实矛盾(同一 spk 既自称常住某地又被问「几年没去过」)。
命中打印「⚠️ 疑似错标」供人工按 diarization-check skill 复核。
④⑤⑥ 是 2026-08-02 补的 —— 那次 elon-theecono-2026 的 4 轮整体错位 + 4 处合并泄漏,
①②③ 一条都没报出来(全是用户读出来发现的)。
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
# ④ turn 中间夹的短插问:对方打断被并进长句。
# 高精度形态=**指代追问**:「什么X？/哪个X？/多少X？」且 X 刚在前一句出现过 ——
# 对方揪住你刚说的词要你说清楚,这是打断,不是自问自答。
# 例:「数据也反驳了你的说法。什么数据？所有关于犯罪的数据。」
# 泛化形态噪声大(自问自答的修辞句「政府应该做什么？」也会命中),故要求问句极短
# 且不以「你/我/他们/这/那/政府」等修辞主语开头。
INTERJECT_REF = re.compile(r'(?<=[。！？])\s*(什么|哪个|哪些|多少|谁)([^。！？，、]{1,6})[？?]')
INTERJECT = re.compile(r'(?<=[。！？])\s*((?!你|我|他|她|它|我们|他们|政府|这|那)[^。！？]{2,8}[？?])\s*(?=[^。！？]{8,})')
# ⑤ 对制作方/编辑说的话 —— 一定是受访者,标成 Host 就是错
TO_EDITOR = re.compile(r'(这|那)(段|部分|一段)(请|要)?(保留|留着|别剪|不要剪)|请把(这|那)段保留|别剪掉')
# ⑥ 身份事实:自称「常住/我住的地方」。注意——「住那儿的人质问对方久未到访」是正常组合,不是矛盾;
# 真正的矛盾是**两个不同的说话人都自称常住同一地**,只可能有一个是真的。
RESIDE = re.compile(r'我(一直)?(住在|生活在|常住)|我一直在那里|我一直在居住的(国家|地方|城市)|我(就)?住那儿')

def _in_quote(zh, pos):
    """pos 处是否落在引号内 —— 转述他人原话里的问句不是插话,别误报。"""
    seg = zh[:pos]
    return seg.count('‘') > seg.count('’') or seg.count('“') > seg.count('”')


def scan(eid):
    f = EPD / f"{eid}.json"
    if not f.exists():
        print(f"  ✗ 找不到 {f}", file=sys.stderr); return 0
    d = json.load(open(f, encoding="utf-8"))
    guest_names = {t.get('spk') for s in d.get('transcript', []) for t in s.get('turns', [])} - {'Host', None}
    hits = 0
    reside_by = {}   # ⑥ 身份事实:哪些 spk 自称常住(>1 人自称 = 有人被标错)
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
                if TO_EDITOR.search(zh):
                    hits += 1
                    print(f"  ⚠️ 疑似错标[对制作方说话应属嘉宾] {eid} sec{si}[{ti}]: {zh[-60:]}")
            # ④ turn 中间夹短插问 → 可能吞掉了对方的打断
            m = INTERJECT_REF.search(zh)
            if m and not _in_quote(zh, m.start()):
                noun = m.group(2)
                before = zh[:m.start()]
                if noun and noun in before[-40:]:      # 追问的正是前一句刚用过的词 → 高精度
                    hits += 1
                    print(f"  ⚠️ 疑似合并泄漏[指代追问被并轮] {eid} sec{si}[{ti}] {spk}: "
                          f"「{m.group(0).strip()}」← 对方揪住前句的「{noun}」追问")
                    m = None
            if m is not None:
                m2 = INTERJECT.search(zh)
                if m2 and len(zh) > 60 and not _in_quote(zh, m2.start(1)):
                    hits += 1
                    print(f"  ⚠️ 疑似合并泄漏[turn 内夹短插问] {eid} sec{si}[{ti}] {spk}: 「{m2.group(1)}」← 可能是对方打断")
            # ⑥ 收集身份事实
            if RESIDE.search(zh): reside_by.setdefault(spk, []).append((si, ti))
        # 同段内相邻同 spk 且前 turn 以问号结尾 → 可能问答被并给一人
        for ti in range(len(turns) - 1):
            a, b = turns[ti], turns[ti + 1]
            if a.get('spk') == b.get('spk') and (a.get('zh', '').rstrip().endswith(('？', '?'))):
                hits += 1
                print(f"  ⚠️ 疑似合并/延续 {eid} sec{si}[{ti}-{ti+1}] 同 spk 前问后续: {a.get('zh','')[-40:]}")
    # ⑥ 两个以上说话人都自称常住 → 只可能有一个是真的,附近数轮多半整体错位
    if len(reside_by) > 1:
        hits += 1
        loc = "; ".join(f"{k} sec{v[0][0]}[{v[0][1]}]" for k, v in reside_by.items())
        print(f"  ⚠️ 疑似整段错位[身份事实矛盾] {eid} 有 {len(reside_by)} 人自称常住同一地({loc})"
              f" —— 只可能一人为真,附近数轮可能整体错位")
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
