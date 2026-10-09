/**
 * Probe the real MCP tools and dump their raw text responses to a local file
 * so the developer (or the agent) can inspect the real payload shape.
 *
 * Usage (PowerShell, run inside the mcradar folder):
 *   $env:MCD_MCP_TOKEN="<your-token>"; node scripts/probe.mjs
 *
 * Output: .debug/probe-output.txt   (gitignored — may contain personal data)
 * The token is read from the environment and is never printed.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { McpClient } from '../src/lib/mcp-client.js';

const token = process.env.MCD_MCP_TOKEN;
const endpoint = process.env.MCD_MCP_ENDPOINT || 'https://mcp.mcd.cn';
const OUT = '.debug/probe-output.txt';

if (!token) {
  console.error('未检测到 MCD_MCP_TOKEN。示例：');
  console.error('  $env:MCD_MCP_TOKEN="<your-token>"; node scripts/probe.mjs');
  process.exit(1);
}

// Read-only tools used by the extension (plus a couple for reference).
const PROBES = [
  ['now-time-info', {}],
  ['available-coupons', {}],
  ['query-my-coupons', {}],
  ['query-my-account', {}],
  ['campaign-calendar', {}],
  ['order-list', {}],
  ['list-nutrition-foods', {}],
  ['query-nearby-stores', {}],
];

const client = new McpClient({ endpoint, token });
await client.init();

let out = `# MCP probe @ ${new Date().toISOString()}\n# endpoint: ${endpoint}\n\n`;

for (const [tool, args] of PROBES) {
  console.log(`→ ${tool}`);
  let section;
  try {
    const res = await client.callTool(tool, args);
    const text = res.text ?? '';
    section = [
      `\n${'='.repeat(70)}`,
      `## TOOL: ${tool}`,
      `## isError: ${res.isError}`,
      `## text length: ${text.length}`,
      '--- RAW TEXT ---',
      text,
      '',
    ].join('\n');
    console.log(`  ok, ${text.length} chars`);
  } catch (err) {
    section = `\n${'='.repeat(70)}\n## TOOL: ${tool}\n## ERROR: ${err.message}\n`;
    console.log(`  error: ${err.message}`);
  }
  out += section + '\n';
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out, 'utf8');
console.log(`\n✓ 已写入 ${OUT}`);
