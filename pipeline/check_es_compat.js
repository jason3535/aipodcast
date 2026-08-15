#!/usr/bin/env node
/* check_es_compat.js — 拦住 ES2020+ 语法进入直接发给浏览器的 app.js。
 *
 * 起因(2026-08-15,Jason 用 Kindle 浏览器实拍):首页全白,而单集静态分享页完全正常。
 * 根因是 app.js 里 3 处可选链 `?.`(ES2020)。老引擎遇到不认识的语法会在**解析阶段**
 * 就抛 SyntaxError —— 不是那一行失败,是整份脚本一行都不执行,所以 SPA 彻底白屏,
 * 而不加载 app.js 的静态页安然无恙。这类故障 `node --check` 抓不到(Node 支持这些语法)。
 *
 * 这份文件不经任何转译直接发给浏览器,所以下限由**最老的目标浏览器**决定,不是 Node。
 *
 * 用法:node pipeline/check_es_compat.js [文件…]   有问题退出码 1
 */
const fs = require('fs');

// 只列会导致**解析失败**的语法(运行时缺 API 顶多某个功能坏,不会整站白屏)
const RULES = [
  [/(?<![?\s])\?\.(?![.\s\d])/g, '可选链 ?.', 'ES2020'],
  [/[^?\s]\?\?[^?=]/g, '空值合并 ??', 'ES2020'],
  [/(\|\|=|&&=|\?\?=)/g, '逻辑赋值 ||= &&= ??=', 'ES2021'],
  [/\bclass\s+\w+\s*\{[^}]*?^\s*#\w+/gm, 'class 私有字段 #x', 'ES2022'],
  [/\.at\(\s*-/g, 'Array.prototype.at(负数)', 'ES2022(运行时,老引擎会 TypeError)'],
];

/* 把字符串/模板/注释挖掉再匹配,否则正文里出现 "?." 会误报
   (站里的转录文本、URL 都可能带)。粗糙但够用:逐字符扫描状态机。 */
function stripLiterals(src) {
  let out = '', i = 0, n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < n && src[i] !== q) { if (src[i] === '\\') i++; i++; }
      i++; out += '""'; continue;
    }
    out += c; i++;
  }
  return out;
}

const files = process.argv.slice(2);
if (!files.length) files.push('app.js');
let bad = 0;
for (const f of files) {
  if (!fs.existsSync(f)) { console.error(`  ⚠ 找不到 ${f}`); continue; }
  const raw = fs.readFileSync(f, 'utf8');
  const code = stripLiterals(raw);
  for (const [re, name, era] of RULES) {
    re.lastIndex = 0;
    const hits = [...code.matchAll(re)];
    if (!hits.length) continue;
    bad += hits.length;
    console.error(`  ✗ ${f}: ${name}(${era})${hits.length} 处`);
    for (const m of hits.slice(0, 3)) {
      const line = code.slice(0, m.index).split('\n').length;
      console.error(`      第 ${line} 行: ${raw.split('\n')[line - 1].trim().slice(0, 90)}`);
    }
  }
}
if (bad) {
  console.error(`\n  这些语法会让老引擎在解析阶段整份脚本失败(SPA 全白)。改成等价的老写法再提交。`);
  process.exit(1);
}
console.log(`ES 兼容门禁:${files.join(' ')} 无 ES2020+ 语法`);
