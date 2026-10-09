/**
 * Extension settings.
 *
 * In the extension context values live in chrome.storage.local. When the same
 * page is opened outside an extension (e.g. preview / QA), it falls back to
 * localStorage so the UI stays usable. The real MCP token is NEVER committed to
 * the repository; users paste it in the Options page at runtime.
 */

export const STORAGE_KEYS = {
  token: 'mcd_mcp_token',
  endpoint: 'mcd_mcp_endpoint',
  mock: 'mcd_mock_mode',
  city: 'mcd_city',
  reminders: 'mcd_daily_reminders',
  autoClaim: 'mcd_auto_claim',
};

export const DEFAULT_ENDPOINT = 'https://mcp.mcd.cn';

const LS_PREFIX = 'mcradar:';

function hasChromeStorage() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

async function readAll(keys) {
  if (hasChromeStorage()) return chrome.storage.local.get(keys);
  const out = {};
  for (const key of keys) {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw !== null) {
      try { out[key] = JSON.parse(raw); } catch { out[key] = raw; }
    }
  }
  return out;
}

async function writeAll(data) {
  if (hasChromeStorage()) return chrome.storage.local.set(data);
  for (const [key, value] of Object.entries(data)) {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  }
}

export async function getSettings() {
  const stored = await readAll([
    STORAGE_KEYS.token,
    STORAGE_KEYS.endpoint,
    STORAGE_KEYS.mock,
    STORAGE_KEYS.city,
    STORAGE_KEYS.reminders,
    STORAGE_KEYS.autoClaim,
  ]);
  const token = stored[STORAGE_KEYS.token] || '';
  const mockStored = stored[STORAGE_KEYS.mock];
  return {
    token,
    endpoint: stored[STORAGE_KEYS.endpoint] || DEFAULT_ENDPOINT,
    // Default: demo mode ON until a token is configured.
    mock: mockStored === undefined ? !token : !!mockStored,
    city: stored[STORAGE_KEYS.city] || '',
    reminders: !!stored[STORAGE_KEYS.reminders],
    autoClaim: !!stored[STORAGE_KEYS.autoClaim],
  };
}

export async function saveSettings(patch) {
  const data = {};
  if (patch.token !== undefined) data[STORAGE_KEYS.token] = patch.token;
  if (patch.endpoint !== undefined) data[STORAGE_KEYS.endpoint] = patch.endpoint;
  if (patch.mock !== undefined) data[STORAGE_KEYS.mock] = !!patch.mock;
  if (patch.city !== undefined) data[STORAGE_KEYS.city] = patch.city;
  if (patch.reminders !== undefined) data[STORAGE_KEYS.reminders] = !!patch.reminders;
  if (patch.autoClaim !== undefined) data[STORAGE_KEYS.autoClaim] = !!patch.autoClaim;
  await writeAll(data);
}
