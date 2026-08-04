#!/usr/bin/env python3
"""webp_avatars.py — 把头像/台标转一份同尺寸的 WebP,前端优先用它,省约一半流量。

背景:头像是 256×256 JPEG(约 15KB/张),首页可视区就要几十张。同尺寸转 WebP@82 大约省 45~50%,
且不改显示尺寸——不能靠缩图省,因为 aipaper 的 hero 头像会显示到 230px,缩小了会发虚。

产物是 .jpg 旁边多一个同名 .webp;**原 .jpg 保留**,因为:
  - add_person.py / fetch_avatar.py 仍然只写 .jpg,新人物在本脚本跑之前只有 jpg;
  - 前端用 onerror 回退到 .jpg,少一张 webp 也不会出现空头像。
幂等:只在缺 .webp 或 .jpg 更新过(mtime 更新)时才转。

用法: python3 pipeline/webp_avatars.py [--quality 82]
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIRS = [ROOT / "assets" / "people", ROOT / "assets" / "pods"]


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--quality", type=int, default=82)
    g = a.parse_args()
    try:
        from PIL import Image
    except ImportError:
        sys.exit("需要 Pillow")

    conv = skip = 0
    src_kb = out_kb = 0
    for d in DIRS:
        if not d.is_dir():
            continue
        for f in sorted(d.glob("*.jpg")):
            w = f.with_suffix(".webp")
            if w.exists() and w.stat().st_mtime >= f.stat().st_mtime:
                skip += 1
                continue
            im = Image.open(f).convert("RGB")
            im.save(w, "WEBP", quality=g.quality, method=6)
            conv += 1
            src_kb += f.stat().st_size / 1024
            out_kb += w.stat().st_size / 1024
    saved = f"{src_kb:.0f}KB → {out_kb:.0f}KB(省 {100 - 100 * out_kb / src_kb:.0f}%)" if conv else ""
    print(f"webp_avatars: 转换 {conv} 张,跳过 {skip} 张(已是最新) {saved}")


if __name__ == "__main__":
    main()
