/* build_person_org.js — 从 PEOPLE 的 tiEn(职称栏,权威且结构化)推导「现在在哪家公司」,
   生成 PERSON_ORG map,供 Browse 页「按公司筛选」用。幂等重建,接进 postingest.sh。

   为什么只信 tiEn 不信 bioEn:实测 bioEn 兜底会把"他曾在 Google 工作过"也当成现职,
   241 人里污染出 168 条,29 条挂着错误的 Google/Meta——tiEn 是短结构化字段,准确得多。

   核心难点是"过去式排除"(ex-/former/prev./until 2023…)与"最长匹配优先"
   (Google DeepMind 不能被子串 Google 抢走)。两个真实踩过的坑:
   1. 用「company 前 24 字符」做 former 检测时不能截断字符串——若截断点恰好落在
      "ex-Google" 的连字符后,正则的 \b 边界因看不到后面的 "G" 而判不出来,
      "ex-Google Brain" 曾经被误判成现职。改为在全文里搜 former 关键词的结束位置,
      按字符间距判断,不截断字符串。
   2. "Scaled Cognition" 曾被子串正则错配成 "Cognition"(两家不同公司)。
      加专门的更长模式,按匹配起点排序时它天然赢(起点更靠前)。
*/
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "app.js");

const ALIASES = [
  [/OpenAI/i, "OpenAI"], [/Anthropic/i, "Anthropic"],
  [/Google\s*DeepMind/i, "Google DeepMind"], [/\bDeepMind\b/i, "Google DeepMind"],
  [/Google\s*Brain/i, "Google DeepMind"],
  [/Google\s*AI\s*Studio|Google\s*Gemini|\bGemini\b(?!\s*API)/i, "Google DeepMind"],
  [/\bGoogle\b/i, "Google"],
  [/Meta\s*AI|Meta\s*Superintelligence|\bFAIR\b|Facebook\s*AI\s*Research/i, "Meta AI"],
  [/Meta\s*Platforms/i, "Meta"], [/\bMeta\b/i, "Meta"],
  [/\bxAI\b/i, "xAI"],
  [/Scaled\s*Cognition/i, "Scaled Cognition"], [/\bCognition\b/i, "Cognition"],
  [/Microsoft\s*Research/i, "Microsoft"], [/\bMicrosoft\b/i, "Microsoft"],
  [/\bNVIDIA\b/i, "NVIDIA"], [/Mistral\s*AI/i, "Mistral AI"], [/\bCohere\b/i, "Cohere"],
  [/Hugging\s*Face/i, "Hugging Face"], [/\bAmazon\b|\bAWS\b/i, "Amazon"],
  [/\bApple\b/i, "Apple"], [/\bTesla\b/i, "Tesla"], [/\bSpaceX\b/i, "SpaceX"],
  [/\bWaymo\b/i, "Waymo"], [/Scale\s*AI/i, "Scale AI"], [/\bPerplexity\b/i, "Perplexity"],
  [/\bDatabricks\b/i, "Databricks"], [/\bAnysphere\b|\bCursor\b/i, "Cursor"],
  [/Character\.?AI/i, "Character.AI"], [/\bInflection\b/i, "Inflection AI"],
  [/Stability\s*AI/i, "Stability AI"], [/Together\s*AI/i, "Together AI"],
  [/\bReplit\b/i, "Replit"], [/\bVercel\b/i, "Vercel"], [/\bFigma\b/i, "Figma"],
  [/\bStripe\b/i, "Stripe"], [/\bSpotify\b/i, "Spotify"], [/\bZipline\b/i, "Zipline"],
  [/Science\s*Corp/i, "Science Corp"], [/\bTwitch\b/i, "Twitch"], [/\bWhatnot\b/i, "Whatnot"],
  [/\bDoorDash\b/i, "DoorDash"], [/\bNotion\b/i, "Notion"],
  [/Thinking\s*Machines/i, "Thinking Machines Lab"],
  [/Safe\s*Superintelligence|\bSSI\b/i, "SSI"], [/World\s*Labs/i, "World Labs"],
  [/\bLinkedIn\b/i, "LinkedIn"], [/\bSalesforce\b/i, "Salesforce"], [/\bIBM\b/i, "IBM"],
  [/\bIntel\b/i, "Intel"], [/Y\s*Combinator/i, "Y Combinator"], [/\bNetflix\b/i, "Netflix"],
  [/\bUber\b/i, "Uber"], [/\bAirbnb\b/i, "Airbnb"], [/\bSlack\b/i, "Slack"],
  [/Palantir/i, "Palantir"], [/Snowflake/i, "Snowflake"], [/Coinbase/i, "Coinbase"],
  [/\bDropbox\b/i, "Dropbox"], [/\bInstagram\b/i, "Instagram"], [/\bPinterest\b/i, "Pinterest"],
  [/Chai\s*Discovery/i, "Chai Discovery"], [/Xaira/i, "Xaira Therapeutics"],
  [/River\s*AI/i, "River AI"],
];
const FORMER = /\b(former|formerly|ex|prev\.?|previously|used to|until\s+\d{4})\b/gi;
// 已知误配(tiEn 里提到某公司但那是过去成就/子公司名撞车,不是现职),人工核过
const MANUAL_EXCLUDE = new Set(["edunov:Meta"]);

function detectOrg(pid, text) {
  if (!text) return null;
  const fends = [];
  for (const m of text.matchAll(FORMER)) fends.push(m.index + m[0].length);
  const hits = [];
  for (const [re, canon] of ALIASES) {
    const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    for (const m of text.matchAll(g)) {
      const gap = Math.min(...fends.map(fe => m.index - fe).filter(d => d >= 0 && d <= 24), 99);
      hits.push({ start: m.index, len: m[0].length, canon, former: gap <= 24 });
    }
  }
  if (!hits.length) return null;
  hits.sort((a, b) => a.start - b.start || b.len - a.len);   // 起点早优先;并列时长匹配优先(防子串抢配)
  const seen = new Set(), dedup = [];
  for (const h of hits) { if (seen.has(h.start)) continue; seen.add(h.start); dedup.push(h); }
  const cur = dedup.filter(h => !h.former && !MANUAL_EXCLUDE.has(`${pid}:${h.canon}`));
  return cur.length ? cur[0].canon : null;
}

let app = fs.readFileSync(APP, "utf8");
const peopleBlock = app.match(/const PEOPLE = \{([\s\S]*?)\n\};/);
if (!peopleBlock) { console.error("找不到 PEOPLE"); process.exit(1); }
const entryRe = /'([\w-]+)':\{/g;
const body = peopleBlock[1];
const ids = [];
for (const m of body.matchAll(entryRe)) ids.push(m[1]);
const tiEnOf = {};
for (const id of ids) {
  const m = body.match(new RegExp(`'${id}':\\{[\\s\\S]*?tiEn:'((?:[^'\\\\]|\\\\.)*)'`));
  if (m) tiEnOf[id] = m[1].replace(/\\'/g, "'");
}

const result = {};
for (const [pid, ti] of Object.entries(tiEnOf)) {
  const org = detectOrg(pid, ti);
  if (org) result[pid] = org;
}

const entry = "const PERSON_ORG=" + JSON.stringify(result) + ";";
if (/const PERSON_ORG=\{[\s\S]*?\};/.test(app)) {
  app = app.replace(/const PERSON_ORG=\{[\s\S]*?\};/, entry);
} else {
  app = app.replace(/const PEOPLE = \{[\s\S]*?\n\};/, m => m + "\n" + entry);
}
fs.writeFileSync(APP, app);

const counts = {};
for (const o of Object.values(result)) counts[o] = (counts[o] || 0) + 1;
const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
  .map(([o, n]) => `${o}(${n})`).join(", ");
console.log(`build_person_org: ${Object.keys(result).length}/${ids.length} 人识别到公司 | ${top}`);
