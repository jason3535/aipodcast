#!/usr/bin/env python3
"""stage_avatars.py — 给 pending_avatars.json 里的每位新人物自动收集头像候选,
拼一张核验图,把「找图」半自动化;「认脸」必须人工(Read 看图)——宁可字母,绝不错脸。

每人自动抓的安全候选(身份都有自证锚点):
  1. TA 单集的 YouTube 封面(maxres)——播客封面通常印着嘉宾名+脸,2026-08 用它补成了
     nateparrott / maxhodak / gustav / brettwilliams 四位
  2. Wikipedia REST 摘要图(按 en 名,已 URL-encode)——命中即最权威
  3. TA 单集视频中段截帧(远程录制常给嘉宾独镜)——限流失败就跳过

输出:/tmp/avatar_staging/<pid>_*.jpg + /tmp/avatar_staging/SHEET.png(带 pid 标注)
用法:python3 pipeline/stage_avatars.py           # 处理 pending 全部
     python3 pipeline/stage_avatars.py <pid>...  # 只处理指定人

之后人工流程(见 avatar-hunting skill):Read SHEET.png 认脸 → 选定裁 256px 存
assets/people/<pid>.jpg → pid 加进 PHOTOS → webp_avatars.py → 从 pending 删除。
确认全网无照的,记进 skill 的无解名单,别留在 pending 里反复挖。"""
import json, re, subprocess, sys, urllib.request, urllib.parse
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
OUT = Path("/tmp/avatar_staging")
HDR = {"User-Agent": "Mozilla/5.0"}
PROXY = "http://127.0.0.1:7890"


def fetch(url, dst, timeout=30):
    try:
        raw = urllib.request.urlopen(urllib.request.Request(url, headers=HDR), timeout=timeout).read()
        if len(raw) < 2000:
            return False
        dst.write_bytes(raw)
        return True
    except Exception:
        return False


def main():
    pend = json.loads((BASE / "pending_avatars.json").read_text(encoding="utf-8"))
    only = set(sys.argv[1:])
    pend = [x for x in pend if not only or x["pid"] in only]
    if not pend:
        print("pending_avatars 为空,无事可做"); return
    OUT.mkdir(exist_ok=True)
    app = (ROOT / "app.js").read_text(encoding="utf-8")
    eps = json.loads(re.search(r"const EPISODES = (\[.*?\]);", app, re.S).group(1))

    got = {}
    for p in pend:
        pid, en = p["pid"], p["en"]
        files = []
        vids = [(e.get("src") or "").split("/")[-1] for e in eps if e.get("pid") == pid]
        # 1) 单集封面
        for v in vids[:2]:
            f = OUT / f"{pid}_cover_{v}.jpg"
            if v and fetch(f"https://i.ytimg.com/vi/{v}/maxresdefault.jpg", f):
                files.append((f, f"封面 {v}"))
        # 2) Wikipedia(en 名,正确编码)
        try:
            u = "https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(en.replace(" ", "_"))
            d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers=HDR), timeout=15))
            src = (d.get("originalimage") or {}).get("source") or (d.get("thumbnail") or {}).get("source")
            desc = (d.get("description") or "")[:60]
            if src:
                f = OUT / f"{pid}_wiki.jpg"
                if fetch(src, f):
                    files.append((f, f"维基({desc})"))   # 描述必须人工核对是不是同名他人!
        except Exception:
            pass
        # 3) 视频中段截帧(1 帧,失败不重试)
        if vids and vids[0]:
            f = OUT / f"{pid}_frame.jpg"
            try:
                subprocess.run(["yt-dlp", "--proxy", PROXY, "--no-warnings", "-f", "best[height<=720]",
                                "--download-sections", "*1200-1201", "-o", str(OUT / f"{pid}_clip.mp4"),
                                f"https://youtu.be/{vids[0]}"], capture_output=True, timeout=120)
                clip = OUT / f"{pid}_clip.mp4"
                if clip.exists():
                    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(clip),
                                    "-frames:v", "1", "-q:v", "3", str(f)], capture_output=True, timeout=60)
                    clip.unlink(missing_ok=True)
                    if f.exists():
                        files.append((f, "视频帧 1200s(防截到主持人!)"))
            except Exception:
                pass
        got[pid] = files
        print(f"  {pid:22s} {en:24s} 候选 {len(files)} 张")

    # 拼核验图
    try:
        from PIL import Image, ImageDraw, ImageFont
        try:
            fnt = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Unicode.ttf", 14)
        except Exception:
            fnt = ImageFont.load_default()
        W = 380
        rows = []
        for pid, files in got.items():
            for f, lab in files:
                try:
                    im = Image.open(f).convert("RGB"); im.thumbnail((W, 240))
                    rows.append((im, f"{pid} · {lab}"))
                except Exception:
                    pass
        if rows:
            H = sum(im.height + 28 for im, _ in rows)
            sheet = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(sheet); y = 0
            for im, lab in rows:
                sheet.paste(im, (0, y)); d.text((4, y + im.height + 4), lab[:58], fill="black", font=fnt)
                y += im.height + 28
            sheet.save(OUT / "SHEET.png")
            print(f"\n核验图: {OUT}/SHEET.png(用 Read 看图认脸,再按 skill 注册)")
    except Exception as e:
        print("拼图失败(候选文件仍在):", e)


if __name__ == "__main__":
    main()
