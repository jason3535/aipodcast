# AI Podcast — 朗读代理 Worker

把 ElevenLabs Key 藏在 Cloudflare Worker 里,网页只调 Worker,Key 不进仓库、不暴露给前端。

## 部署(三步)

```bash
cd tts-worker
wrangler login                                   # 浏览器登录你的 Cloudflare
echo "sk_你的ElevenLabsKey" | wrangler secret put ELEVENLABS_KEY   # 存密钥(不进仓库)
wrangler deploy                                  # 部署
```

部署后会得到地址,形如 `https://aipodcast-tts.<你的subdomain>.workers.dev`。

> 若代理(Clash)导致 `wrangler login`/`deploy` 失败,临时关掉系统代理再跑;或
> `HTTPS_PROXY= HTTP_PROXY= wrangler deploy`(视情况)。

## 接入网页

`index.html` 里常量 `TTS_PROXY` 已设为 `https://aipodcast-tts.992978142.workers.dev`
(与现有 graph-mcp 同一 subdomain 的猜测)。若你的 workers.dev subdomain 不同,
把该常量改成 `wrangler deploy` 输出的实际地址即可。

## 轮换 Key

```bash
echo "sk_新Key" | wrangler secret put ELEVENLABS_KEY   # 覆盖即可,网页无需改动
```

## 安全说明

- Key 只在 Worker secret 中,前端/仓库都看不到。
- Worker 限制了来源(白名单含线上域名 + 本地);浏览器侧盗用被 CORS+403 挡住。
- 服务端直连(带伪造 Origin)无法完全防住——必要时再加 rate limit 或 token。
