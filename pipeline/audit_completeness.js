#!/usr/bin/env node
/* 全库完整性审计 — 参考 aipaper 的 pipeline/audit_completeness.js。
 *
 * 缘由:2026-08-01 那批 18 期因 DeepSeek 推理模型把 max_tokens 吃光,分块翻译被
 * `except Exception: ts[i]=[]` 静默丢弃,产出"空壳"集(正文只剩尾巴甚至全空),
 * 页面上看不出异常、构建脚本也不报错,直到被人读到才发现。此脚本把这类"看起来
 * 成功了"的损坏变成可检测、可拦截的信号。
 *
 * 用法:
 *   node pipeline/audit_completeness.js            # 全量审计,有严重问题时 exit 1
 *   node pipeline/audit_completeness.js <id> ...   # 只审指定集(收录后自检)
 *   node pipeline/audit_completeness.js --json     # 机器可读
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "app.js");
const EPDIR = path.join(ROOT, "mcp-data", "ep");

// 正常成品约 1000-3000 字符/分钟(中英双语合计)。低于此说明整块翻译被丢了。
const DENSITY_FATAL = 600;
const DENSITY_WARN = 900;

const src = fs.readFileSync(APP, "utf8");
const grab = (re, label) => {
  const m = src.match(re);
  if (!m) throw new Error(`app.js 里找不到 ${label}`);
  return eval("(" + m[1] + ")");
};
const EPISODES = grab(/const EPISODES = (\[[\s\S]*?\]);/, "EPISODES");
const PEOPLE = grab(/const PEOPLE\s*=\s*(\{[\s\S]*?\n\});/, "PEOPLE");
const FIELDS = grab(/const FIELDS = (\{[\s\S]*?\n\});/, "FIELDS");
const POD_INFO = grab(/const POD_INFO\s*=\s*(\{[\s\S]*?\n\});/, "POD_INFO");

const only = process.argv.slice(2).filter(a => !a.startsWith("--"));
const asJson = process.argv.includes("--json");
const targets = only.length ? EPISODES.filter(e => only.includes(e.id)) : EPISODES;
if (only.length && targets.length !== only.length) {
  const miss = only.filter(id => !EPISODES.some(e => e.id === id));
  console.error("✗ EPISODES 里没有这些 id:", miss.join(", "));
  process.exit(1);
}

const rows = [];
for (const e of targets) {
  const bad = [], warn = [];
  const f = path.join(EPDIR, e.id + ".json");

  // --- 元数据 ---
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date || "")) bad.push(`日期非法(${JSON.stringify(e.date)})`);
  if (!e.min || e.min <= 0) bad.push(`时长为 ${e.min}`);
  if (/-$/.test(e.id)) bad.push("id 以 - 结尾(抓取元数据时被限流的残留)");
  if (!PEOPLE[e.pid]) bad.push(`pid '${e.pid}' 不在 PEOPLE 里`);
  (e.fields || []).forEach(x => { if (!FIELDS[x]) bad.push(`领域 '${x}' 未登记`); });
  if (!e.fields || !e.fields.length) warn.push("无领域标签");
  if (!POD_INFO[e.pod && e.pod.en]) warn.push(`节目 '${e.pod && e.pod.en}' 无 POD_INFO 简介`);
  if (!e.tZh || !e.sZh) warn.push("缺中文标题/导语");

  // --- 正文 ---
  let secs = 0, turns = 0, chars = 0, density = 0;
  if (!fs.existsSync(f)) {
    bad.push("mcp-data/ep 全文文件缺失");
  } else {
    let d;
    try { d = JSON.parse(fs.readFileSync(f, "utf8")); }
    catch (err) { d = null; bad.push("全文 JSON 解析失败"); }
    if (d) {
      const t = d.transcript || [];
      secs = t.length;
      turns = t.reduce((a, s) => a + ((s.turns || []).length), 0);
      chars = JSON.stringify(t).length;
      density = e.min ? Math.round(chars / e.min) : 0;
      if (secs === 0) bad.push("正文 0 节(全空)");
      else if (density && density < DENSITY_FATAL) bad.push(`正文密度 ${density} 字符/分(疑似整块被丢)`);
      else if (density && density < DENSITY_WARN) warn.push(`正文密度偏低 ${density} 字符/分`);
      // turn 里 spk 只有一种 → 说话人没分开
      const spks = new Set(t.flatMap(s => (s.turns || []).map(x => x.spk)));
      if (secs > 0 && spks.size < 2) warn.push(`说话人只有 ${[...spks].join("/") || "无"}`);
      // 中译缺失:零星缺是警告;大面积缺(>20%)= 翻译环节整段失败,必须拦——
      // 2026-08-09 故障演练发现整期 0 中文只报"警告(可上线)",空翻译能带病上线
      const allTurns = t.flatMap(s => (s.turns || []));
      const noZh = allTurns.filter(x => !x.zh || !x.zh.trim()).length;
      if (allTurns.length && noZh / allTurns.length > 0.2) bad.push(`${noZh}/${allTurns.length} turn 缺中文(>20%,翻译疑似整段失败)`);
      else if (noZh) warn.push(`${noZh} 个 turn 缺中文`);
      const ins = d.insights || {};
      if (!(ins.consensus || []).length) bad.push("缺核心观点");
      if (!(ins.contrarian || []).length) warn.push("缺反共识");
    }
  }
  rows.push({ id: e.id, date: e.date, min: e.min, secs, turns, density, bad, warn });
}

const fatal = rows.filter(r => r.bad.length);
const warned = rows.filter(r => !r.bad.length && r.warn.length);

if (asJson) {
  console.log(JSON.stringify({ total: rows.length, fatal, warned }, null, 1));
} else {
  console.log(`审计 ${rows.length} 期 | 严重 ${fatal.length} | 警告 ${warned.length} | 正常 ${rows.length - fatal.length - warned.length}`);
  if (fatal.length) {
    console.log("\n──── 严重(内容不完整,不应上线) ────");
    fatal.sort((a, b) => a.density - b.density).forEach(r =>
      console.log(`  ✗ ${r.id}  ${r.date} ${String(r.min).padStart(3)}min  ${String(r.secs).padStart(3)}节/${String(r.turns).padStart(4)}turn  ${String(r.density).padStart(5)}字符/分\n      ${r.bad.join(" · ")}`));
  }
  if (warned.length) {
    console.log("\n──── 警告(可上线,建议复查) ────");
    warned.forEach(r => console.log(`  ! ${r.id}  ${r.warn.join(" · ")}`));
  }
  if (!fatal.length && !warned.length) console.log("\n✓ 全部通过");
}

process.exit(fatal.length ? 1 : 0);
