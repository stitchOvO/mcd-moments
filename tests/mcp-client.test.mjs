import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseSse, normalizeToolResult, McpError, McpClient } from '../src/lib/mcp-client.js';

test('parseSse extracts the last JSON-RPC message', () => {
  const body = [
    'event: message',
    'data: {"jsonrpc":"2.0","id":1,"result":{"ok":true}}',
    '',
    'data: {"jsonrpc":"2.0","id":2,"result":{"ok":"last"}}',
    '',
  ].join('\n');
  assert.deepEqual(parseSse(body).result, { ok: 'last' });
});

test('parseSse ignores [DONE] and non-JSON lines', () => {
  const body = 'data: not-json\n\ndata: [DONE]\n\ndata: {"a":1}\n';
  assert.deepEqual(parseSse(body), { a: 1 });
});

test('normalizeToolResult parses JSON text content', () => {
  const res = normalizeToolResult({
    content: [{ type: 'text', text: '{"coupons":[{"id":"x"}]}' }],
    isError: false,
  });
  assert.equal(res.isError, false);
  assert.equal(res.data.coupons[0].id, 'x');
});

test('normalizeToolResult keeps plain text as string', () => {
  const res = normalizeToolResult({ content: [{ type: 'text', text: 'hello' }] });
  assert.equal(res.data, 'hello');
});

test('McpClient requires a token', () => {
  assert.throws(() => new McpClient({}), McpError);
});

test('McpClient attaches Authorization header', () => {
  const client = new McpClient({ token: 'abc' });
  const headers = client._headers();
  assert.equal(headers.Authorization, 'Bearer abc');
});
