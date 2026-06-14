#!/usr/bin/env python3
"""
AI Voices · 转录 + 双语翻译管线
=================================
把一期播客（YouTube 链接 / 本地音频 / 已有转录文本）变成 index.html 里 EPISODES[] 用的双语单集对象。

流程：
  1. 取转录  —  优先官方字幕(youtube-transcript-api) → 退回 yt-dlp 自动字幕 → 退回本地 Whisper
  2. 分段+翻译  —  Claude (claude-opus-4-8, 自适应思考)，带术语表，输出结构化双语 JSON
  3. 产出  —  可直接粘进 index.html 的 JS 对象（--emit js），或 JSON（--emit json）

合规（重要，见 README.md）：
  --mode public   仅产出「摘要 + 数段金句 + 原链接」，不含全文转录（公开发布走这个）
  --mode private  产出完整双语逐字稿（自用阅读）

用法：
  export ANTHROPIC_API_KEY=sk-ant-...
  python build_episode.py --source "https://youtu.be/XXXX" \
      --pid dario --pod-en "Dwarkesh Podcast" --pod-zh "Dwarkesh 播客" \
      --date 2025-11-12 --min 128 --fields nlp,safety --mode private --emit js

依赖：anthropic（必装）；youtube-transcript-api / yt-dlp / openai-whisper（按需，取转录时才用）
"""
import argparse, json, os, re, subprocess, sys, tempfile
from pathlib import Path

import anthropic

MODEL = "claude-opus-4-8"
GLOSSARY_PATH = Path(__file__).with_name("glossary.json")
CHUNK_CHARS = 12000  # 单块转录字符上限;长稿分块逐段译再合并(146 分钟≈18 万字符 → 约 15 块)


# ────────────────────────── 1. 取转录 ──────────────────────────
def youtube_id(url: str):
    m = re.search(r"(?:v=|youtu\.be/|/shorts/|/embed/)([\w-]{11})", url)
    return m.group(1) if m else None


def fetch_transcript(source: str) -> str:
    """返回纯文本转录。本地 .txt 直接读；YouTube 走字幕→yt-dlp→Whisper。"""
    p = Path(source)
    if p.exists() and p.suffix.lower() in (".txt", ".md", ".vtt", ".srt"):
        text = p.read_text(encoding="utf-8")
        return strip_timestamps(text)

    vid = youtube_id(source)
    if vid:
        # 1a. 官方/自动字幕（最快、最准、无版权抓取争议——只取字幕轨）
        try:
            from youtube_transcript_api import YouTubeTranscriptApi
            for langs in (["en"], ["en-US"], None):
                try:
                    segs = YouTubeTranscriptApi.get_transcript(vid, languages=langs) if langs \
                        else YouTubeTranscriptApi.get_transcript(vid)
                    print(f"  ✓ 取到字幕轨（{len(segs)} 段）", file=sys.stderr)
                    return " ".join(s["text"].replace("\n", " ") for s in segs)
                except Exception:
                    continue
        except ImportError:
            print("  · 未装 youtube-transcript-api，跳过字幕轨", file=sys.stderr)

        # 1b. yt-dlp 抓自动字幕
        try:
            return ytdlp_subs(vid)
        except Exception as e:
            print(f"  · yt-dlp 字幕失败：{e}", file=sys.stderr)

        # 1c. 退回：下音频 + Whisper（慢、要装 ffmpeg/whisper）
        return whisper_transcribe(source)

    raise SystemExit(f"无法识别来源：{source}（给 YouTube 链接或本地 .txt/.vtt）")


def ytdlp_subs(vid: str) -> str:
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(
            ["yt-dlp", "--skip-download", "--write-auto-subs", "--sub-lang", "en",
             "--sub-format", "vtt", "-o", f"{td}/%(id)s.%(ext)s",
             f"https://youtu.be/{vid}"],
            check=True, capture_output=True)
        vtts = list(Path(td).glob("*.vtt"))
        if not vtts:
            raise RuntimeError("yt-dlp 没产出字幕")
        return strip_timestamps(vtts[0].read_text(encoding="utf-8"))


def whisper_transcribe(source: str) -> str:
    import whisper  # openai-whisper
    with tempfile.TemporaryDirectory() as td:
        audio = f"{td}/audio.m4a"
        subprocess.run(
            ["yt-dlp", "-x", "--audio-format", "m4a", "-o", audio, source],
            check=True, capture_output=True)
        print("  · Whisper 转录中（可能要几分钟）…", file=sys.stderr)
        model = whisper.load_model("base")
        return model.transcribe(audio)["text"]


def strip_timestamps(text: str) -> str:
    """清掉 VTT/SRT 的时间轴、序号、WEBVTT 头、去重相邻重复行。"""
    out, prev = [], None
    for line in text.splitlines():
        line = line.strip()
        if not line or line == "WEBVTT" or line.isdigit():
            continue
        if re.match(r"^\d{2}:\d{2}", line) or "-->" in line:
            continue
        line = re.sub(r"<[^>]+>", "", line)  # 去内联标签
        if line != prev:
            out.append(line)
            prev = line
    return " ".join(out)


# ────────────────────── 2. 分段 + 双语翻译 ──────────────────────
EPISODE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "tEn": {"type": "string"}, "tZh": {"type": "string"},
        "sEn": {"type": "string"}, "sZh": {"type": "string"},
        "ts": {
            "type": "array",
            "items": {
                "type": "object", "additionalProperties": False,
                "properties": {
                    "sec": {"type": "string"},
                    "turns": {
                        "type": "array",
                        "items": {
                            "type": "object", "additionalProperties": False,
                            "properties": {
                                "spk": {"type": "string"},
                                "en": {"type": "string"},
                                "zh": {"type": "string"},
                            },
                            "required": ["spk", "en", "zh"],
                        },
                    },
                },
                "required": ["sec", "turns"],
            },
        },
        "quotes": {
            "type": "array",
            "items": {
                "type": "object", "additionalProperties": False,
                "properties": {"en": {"type": "string"}, "zh": {"type": "string"}},
                "required": ["en", "zh"],
            },
        },
    },
    "required": ["tEn", "tZh", "sEn", "sZh", "ts", "quotes"],
}

SYSTEM = """你是 AI Voices（双语播客阅读站）的转录编辑兼译者。把一段 AI 人物访谈的英文转录，整理成「按主题分节、按发言人分段」的中英对照阅读稿。

要求：
- 先清理口语转录：去掉 um/uh/口头语、修正自动字幕的明显错词、合并被切碎的句子；不改变原意，不杜撰内容。
- 按主题切成若干小节（sec 用英文短语，如 "On scaling"）。每节内按发言人(spk)分 turn。
- 每个 turn 同时给 en（清理后的英文）和 zh（地道中文译文）。译文要「可读、信达」，不是逐词直译。
- 严格使用提供的术语表统一译名。
- tEn/tZh 是这期的标题（精炼，非原视频标题照搬亦可），sEn/sZh 是一句话导语。
- quotes：挑 2-4 句最有信息量/最像金句的对照句（en+zh），用于首页与公开摘要。
- 只输出结构化对象，不要解释。"""

PUBLIC_SYSTEM = """你是 AI Voices 的编辑。基于这段访谈转录，产出【公开发布合规版】：不要逐字转录全文，只产出
- tEn/tZh 标题、sEn/sZh 一句话导语
- quotes：4-6 句最精彩的中英对照金句（en 为原话的精简引用，zh 为译文）
- ts：留空数组 []
严格使用术语表统一译名。只输出结构化对象。"""


CONT_SYSTEM = """你是 AI Voices 的转录编辑兼译者。这是【同一期访谈的后续片段】。
只续接产出 ts（按主题分节 sec，节内按发言人 spk 分 turn，每个 turn 同时给 en 清理后英文 + zh 地道中文）。
不要重复前面已出现的内容，不要再产出标题/导语/金句。清理口语、修正自动字幕错词、合并碎句，不杜撰。
严格使用术语表统一译名。只输出 {ts:[...]} 结构化对象。"""

# 续接块只产 ts（复用 EPISODE_SCHEMA 的 ts 定义）
SECTIONS_SCHEMA = {
    "type": "object", "additionalProperties": False,
    "properties": {"ts": EPISODE_SCHEMA["properties"]["ts"]},
    "required": ["ts"],
}


def _user(meta: dict, body: str) -> str:
    return (f"人物：{meta['person']}（spk 用其名字，如 '{meta['person'].split()[0]}'；"
            f"主持人用 'Host' 或实际主持人名）。\n"
            f"播客：{meta['pod_en']}。日期：{meta['date']}。\n\n英文转录：\n{body}")


def _call(client, system: str, user: str, schema: dict) -> dict:
    """单次结构化调用（流式 + 自适应思考）。"""
    with client.messages.stream(
        model=MODEL, max_tokens=32000, thinking={"type": "adaptive"},
        system=[{"type": "text", "text": system,
                 "cache_control": {"type": "ephemeral"}}],  # 缓存系统提示+术语表
        output_config={"format": {"type": "json_schema", "schema": schema}},
        messages=[{"role": "user", "content": user}],
    ) as stream:
        msg = stream.get_final_message()
    if msg.stop_reason == "refusal":
        raise SystemExit("模型拒绝了该请求（stop_reason=refusal）。")
    return json.loads(next(b.text for b in msg.content if b.type == "text"))


def _chunks(text: str, size: int):
    """按字符切块，就近在句末/空格断开，避免切碎句子。"""
    out, i, n = [], 0, len(text)
    while i < n:
        j = min(i + size, n)
        if j < n:
            k = text.rfind('. ', i + size // 2, j)
            if k == -1:
                k = text.rfind(' ', i + size // 2, j)
            if k != -1:
                j = k + 1
        out.append(text[i:j]); i = j
    return out


def translate(transcript: str, meta: dict, mode: str) -> dict:
    glossary = json.loads(GLOSSARY_PATH.read_text(encoding="utf-8"))
    gloss = "\n\n术语表（务必遵守）：\n" + "\n".join(
        f"  {k} → {v}" for k, v in glossary.items() if not k.startswith("_"))
    client = anthropic.Anthropic()

    if mode == "public":  # 公开版：只要摘要+金句，整稿一次过（输出很小）
        return _call(client, PUBLIC_SYSTEM + gloss, _user(meta, transcript), EPISODE_SCHEMA)

    # 私有全文：分块，首块出标题/导语/金句+首批章节，后续块只续接章节
    chunks = _chunks(transcript, CHUNK_CHARS)
    print(f"      分 {len(chunks)} 块逐段翻译…", file=sys.stderr)
    ep = _call(client, SYSTEM + gloss, _user(meta, chunks[0]), EPISODE_SCHEMA)
    for idx, ch in enumerate(chunks[1:], 2):
        print(f"      · 块 {idx}/{len(chunks)}", file=sys.stderr)
        part = _call(client, CONT_SYSTEM + gloss, _user(meta, ch), SECTIONS_SCHEMA)
        ep["ts"].extend(part.get("ts", []))
    return ep


# ────────────────────────── 3. 产出 ──────────────────────────
def to_episode(ep: dict, meta: dict) -> dict:
    out = {
        "id": meta["id"], "pid": meta["pid"],
        "pod": {"en": meta["pod_en"], "zh": meta["pod_zh"]},
        "date": meta["date"], "min": meta["min"], "fields": meta["fields"],
        "tEn": ep["tEn"], "tZh": ep["tZh"], "sEn": ep["sEn"], "sZh": ep["sZh"],
        "ts": ep.get("ts", []),
    }
    if ep.get("quotes"):
        out["quotes"] = ep["quotes"]
    return out


def emit_js(ep: dict) -> str:
    """输出近似 index.html 风格的 JS 对象字面量（手贴用）。"""
    return "  " + json.dumps(ep, ensure_ascii=False, indent=2).replace("\n", "\n  ") + ","


def main():
    ap = argparse.ArgumentParser(description="AI Voices 双语单集构建管线")
    ap.add_argument("--source", required=True, help="YouTube 链接 或 本地 .txt/.vtt 转录")
    ap.add_argument("--pid", required=True, help="人物 id（与 PEOPLE 键一致，如 dario）")
    ap.add_argument("--person", help="人物英文名（spk 用；默认按 pid 推断需手填）")
    ap.add_argument("--pod-en", required=True)
    ap.add_argument("--pod-zh", required=True)
    ap.add_argument("--date", required=True, help="YYYY-MM-DD")
    ap.add_argument("--min", type=int, required=True, help="时长（分钟）")
    ap.add_argument("--fields", required=True, help="逗号分隔，如 nlp,safety")
    ap.add_argument("--id", help="单集 id（默认 pid-podslug）")
    ap.add_argument("--mode", choices=["private", "public"], default="private")
    ap.add_argument("--emit", choices=["js", "json"], default="js")
    args = ap.parse_args()

    pod_slug = re.sub(r"[^a-z0-9]+", "", args.pod_en.lower())[:10]
    meta = {
        "id": args.id or f"{args.pid}-{pod_slug}",
        "pid": args.pid, "person": args.person or args.pid,
        "pod_en": args.pod_en, "pod_zh": args.pod_zh,
        "date": args.date, "min": args.min,
        "fields": [f.strip() for f in args.fields.split(",") if f.strip()],
    }

    print(f"[1/3] 取转录：{args.source}", file=sys.stderr)
    transcript = fetch_transcript(args.source)
    print(f"      转录约 {len(transcript)} 字符", file=sys.stderr)

    print(f"[2/3] 翻译+分段（{args.mode} 模式，{MODEL}）…", file=sys.stderr)
    ep = translate(transcript, meta, args.mode)

    print("[3/3] 产出", file=sys.stderr)
    obj = to_episode(ep, meta)
    if args.emit == "json":
        print(json.dumps(obj, ensure_ascii=False, indent=2))
    else:
        print(emit_js(obj))


if __name__ == "__main__":
    main()
