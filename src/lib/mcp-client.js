/**
 * Minimal MCP (Model Context Protocol) client over Streamable HTTP.
 *
 * Endpoint:  https://mcp.mcd.cn
 * Transport: Streamable HTTP (JSON-RPC 2.0); the server may answer with
 *            application/json or text/event-stream (SSE).
 * Auth:      Authorization: Bearer <MCP_TOKEN>
 *
 * Flow: initialize -> notifications/initialized -> tools/list | tools/call
 */

export const DEFAULT_ENDPOINT = 'https://mcp.mcd.cn';
export const PROTOCOL_VERSION = '2025-06-18';

export class McpError extends Error {
  constructor(message, code, data) {
    super(message);
    this.name = 'McpError';
    this.code = code;
    this.data = data;
  }
}

export class McpClient {
  constructor({ endpoint = DEFAULT_ENDPOINT, token, clientName = 'mcradar', clientVersion = '0.1.0' } = {}) {
    if (!token) throw new McpError('MCP token is required');
    this.endpoint = endpoint;
    this.token = token;
    this.clientName = clientName;
    this.clientVersion = clientVersion;
    this.sessionId = null;
    this.serverInfo = null;
    this._id = 0;
    this._initPromise = null;
  }

  _headers(extra = {}) {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...extra,
    };
    headers.Authorization = `Bearer ${this.token}`;
    if (this.sessionId) headers['Mcp-Session-Id'] = this.sessionId;
    return headers;
  }

  async _post(payload) {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify(payload),
    });

    const sid = res.headers.get('Mcp-Session-Id');
    if (sid) this.sessionId = sid;

    if (!res.ok) {
      let detail = '';
      try { detail = (await res.text()).slice(0, 500); } catch { /* ignore */ }
      throw new McpError(`MCP server returned HTTP ${res.status}`, res.status, detail);
    }

    const contentType = (res.headers.get('Content-Type') || '').toLowerCase();
    const body = await res.text();
    if (!body) return null;
    if (contentType.includes('text/event-stream')) return parseSse(body);
    try { return JSON.parse(body); } catch { return null; }
  }

  async _request(method, params) {
    const id = ++this._id;
    const message = await this._post({ jsonrpc: '2.0', id, method, params });
    if (!message) throw new McpError(`Empty response for ${method}`);
    if (message.error) {
      throw new McpError(message.error.message || `MCP error in ${method}`, message.error.code, message.error.data);
    }
    return message.result;
  }

  init() {
    if (!this._initPromise) {
      this._initPromise = (async () => {
        const result = await this._request('initialize', {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: this.clientName, version: this.clientVersion },
        });
        this.serverInfo = (result && result.serverInfo) || null;
        await this._post({ jsonrpc: '2.0', method: 'notifications/initialized' });
        return this;
      })().catch((err) => {
        this._initPromise = null;
        throw err;
      });
    }
    return this._initPromise;
  }

  async listTools() {
    await this.init();
    const result = await this._request('tools/list', {});
    return (result && result.tools) || [];
  }

  async callTool(name, args = {}) {
    await this.init();
    const result = await this._request('tools/call', { name, arguments: args });
    return normalizeToolResult(result);
  }
}

/**
 * Extract the last JSON-RPC message from an SSE stream body.
 * @returns {object|null}
 */
export function parseSse(raw) {
  let last = null;
  for (const line of String(raw).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') continue;
    try { last = JSON.parse(data); } catch { /* skip non-JSON event */ }
  }
  return last;
}

/**
 * Normalize an MCP tools/call result into { isError, text, data, raw }.
 * `data` is the JSON-parsed text payload when possible, otherwise the raw string.
 */
export function normalizeToolResult(result) {
  if (!result) return { isError: false, text: '', data: null, raw: null };
  const texts = (result.content || [])
    .filter((c) => c && c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text);
  const text = texts.join('\n');
  let data = text;
  try { data = JSON.parse(text); } catch { /* keep string */ }
  return { isError: !!result.isError, text, data, raw: result };
}
