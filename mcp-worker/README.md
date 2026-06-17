# AI Podcast — 远程 MCP Server

让任意支持 MCP 的 Agent 接入本站全部播客内容(双语全文)做问答。只读、免费、无需 key。

- **端点**:`https://aipodcast-mcp.992978142.workers.dev/mcp`(MCP Streamable HTTP)
- **数据**:GitHub Pages 上的 `/mcp-data/`(由 `pipeline/build_mcp_data.js` 从 index.html 导出)。Worker 拉取并用 Cache API 缓存。

## 工具
- `list_people` — 列出 25 位 AI 关键人物
- `get_person {pid}` — 人物简介 + 全部播客 + 观点演变(随时间立场变化)
- `search_episodes {query, person?, field?, year?, limit?}` — 关键词检索单集(标题/导语/章节/核心观点)
- `get_episode {id, lang?}` — 某期双语全文逐字稿 + 核心观点/反共识

## 接入方式

**Claude Desktop / Claude.ai 自定义连接器**:设置 → 连接器 → 添加自定义(远程 MCP),URL 填上面的端点。

**Cursor**(`~/.cursor/mcp.json`)或其他客户端:
```json
{ "mcpServers": { "ai-podcast": { "url": "https://aipodcast-mcp.992978142.workers.dev/mcp" } } }
```

**命令行自测**:
```bash
curl -s -X POST https://aipodcast-mcp.992978142.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"search_episodes","arguments":{"query":"scaling laws","limit":3}}}'
```

## 更新数据 / 部署
内容更新后(index.html 变化):
```bash
node pipeline/build_mcp_data.js          # 重新导出 mcp-data/
git add -A && git commit -m "update mcp-data" && git push   # Pages 托管
# Worker 逻辑变更才需重新部署:
cd mcp-worker && HTTPS_PROXY= HTTP_PROXY= npx wrangler deploy
```
注意:wrangler 命令要 `HTTPS_PROXY= HTTP_PROXY=` 关闭 Clash 系统代理(否则认证 400);国内访问 workers.dev 需 Clash。
