#!/usr/bin/env python3
"""fill_pending_avatars.py — 消化 pending_avatars.json:给自动保鲜建的新人物补头像。

背景:auto_refresh 建新人物时只试维基百科(add_person 同款),拿不到就字母兜底并记进
pending_avatars.json——于是每轮自动收录都可能新增"没头像的人物",靠人工事后补,经常积压。

本脚本用该人物自己单集的 YouTube 封面走 fetch_avatar 的人脸裁剪(播客封面绝大多数是嘉宾
正脸)。fetch_avatar 自带两道防线:检不到人脸拒绝(logo/文字封面不会误用)、多人封面取最大
脸。**取到的头像可能是同框的主持人**——所以成功的条目会打印出来提醒人工抽查,但不阻塞:
错脸概率远低于"永远字母"的确定性,且封面里嘉宾通常是最大脸。

成功 → 写 PHOTOS + 转 webp + 从 pending 移除;失败 → 留在 pending,下轮再试。
幂等,可重复跑。接在 auto_refresh 的再生成链里(webp_avatars 之前)。
"""
import json
import re
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
APP = ROOT / "app.js"
PENDING = BASE / "pending_avatars.json"


def main():
    if not PENDING.exists():
        print("fill_pending_avatars: 无待补条目")
        return
    try:
        pending = json.loads(PENDING.read_text(encoding="utf-8"))
    except Exception:
        print("fill_pending_avatars: pending_avatars.json 解析失败,跳过")
        return
    if not pending:
        print("fill_pending_avatars: 无待补条目")
        return

    s = APP.read_text(encoding="utf-8")
    m = re.search(r"const EPISODES = (\[.*?\]);\n\n/\* ====== REAL", s, re.S)
    eps = json.loads(m.group(1))
    src_of = {}
    for e in eps:                       # 每人取最新一期的视频链接
        if e.get("src", "").startswith("http"):
            src_of.setdefault(e["pid"], e["src"])

    done, left = [], []
    for item in pending:
        pid = item.get("pid")
        src = src_of.get(pid)
        if item.get("auto"):
            left.append(item); continue                    # 已自动裁过,等人工核验,别重复处理
        if not src or (ROOT / "assets" / "people" / f"{pid}.jpg").exists():
            (done if (ROOT / "assets" / "people" / f"{pid}.jpg").exists() else left).append(item)
            continue
        r = subprocess.run([sys.executable, str(BASE / "fetch_avatar.py"),
                            "--pid", pid, "--youtube", src,
                            # 默认 zoom 2.6 在播客封面上会把标题字/台标/吉祥物一起裁进来
                            # (2026-10-06/07 tibosottiaux、rhiannonbell、aminvahdat、yashpatil 四张全中),收紧到 1.2(1.5 实测 3/4 仍带字;脸贴边时 1.2 也可能残留,所以留 pending 待人工核)
                            "--zoom", "1.2"],
                           capture_output=True, text=True, timeout=120)
        if (ROOT / "assets" / "people" / f"{pid}.jpg").exists():
            done.append(item)
            print(f"  ✓ {pid} ← 单集封面({src.split('/')[-1]}) —— 请抽查是否本人(多人封面可能裁到主持人)")
        else:
            left.append(item)
            tail = (r.stdout + r.stderr).strip().splitlines()
            print(f"  · {pid} 未取到:{tail[-1][:60] if tail else '无输出'}")

    # 成功的写进 PHOTOS
    got = [i["pid"] for i in done]
    if got:
        pm = re.search(r"const PHOTOS=new Set\((\[[\s\S]*?\])\);", s)
        cur = [x.strip().strip("'") for x in pm.group(1).strip("[]").split(",") if x.strip()]
        new = sorted(set(cur) | set(got))
        if new != sorted(set(cur)):
            s = s[:pm.start(1)] + "[" + ",".join(f"'{x}'" for x in new) + "]" + s[pm.end(1):]
            APP.write_text(s, encoding="utf-8")

    # 自动裁的封面头像只是「比字母好」的临时件,**不从 pending 移除**,标 auto 留给人工核验/换真照
    # (2026-10-07:以前成功即删,pending 变空 → 带字封面头像悄悄上线没人再看)。
    # 人工处理完由 avatar-hunting 流程删条目;已标 auto 的不再重复裁。
    for i in done: i["auto"] = True
    left = left + done
    PENDING.write_text(json.dumps(left, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"fill_pending_avatars: 自动裁 {len(done)}(待人工核验),pending 共 {len(left)}")


if __name__ == "__main__":
    main()
