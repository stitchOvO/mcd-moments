/**
 * Local smoke test for the麦当劳 MCP connection.
 *
 * Usage (Windows PowerShell):
 *   $env:MCD_MCP_TOKEN="your-token"; npm run smoke
 * Usage (bash):
 *   MCD_MCP_TOKEN=your-token npm run smoke
 *
 * The token is read from the environment and is never printed.
 */

import { McpClient } from '../src/lib/mcp-client.js';

const token = process.env.MCD_MCP_TOKEN || process.argv[2];
const endpoint = process.env.MCD_MCP_ENDPOINT || 'https://mcp.mcd.cn';

if (!token) {
  console.error('未检测到 MCD_MCP_TOKEN 环境变量。示例：');
  console.error('  PowerShell:  $env:MCD_MCP_TOKEN="<your-token>"; npm run smoke');
  process.exit(1);
}

const client = new McpClient({ endpoint, token });

try {
  await client.init();
  console.log(`✓ initialize 成功（token 长度 ${token.length}）`);
  console.log(`  serverInfo: ${JSON.stringify(client.serverInfo)}`);

  const tools = await client.listTools();
  console.log(`✓ tools/list 返回 ${tools.length} 个工具：`);
  for (const t of tools) console.log(`  - ${t.name}`);

  // Read-only probe: current time.
  const now = await client.callTool('now-time-info', {});
  console.log('✓ now-time-info 调用成功：', now.text?.slice(0, 120));
} catch (err) {
  console.error(`✗ 失败：${err.message}` + (err.code ? ` (code=${err.code})` : ''));
  process.exit(2);
}
