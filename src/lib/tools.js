/**
 * High-level aggregation layer: turns raw MCP tool calls into the single
 * "benefits" view model consumed by the popup.
 *
 * Live mode only uses READ-ONLY tools plus the explicit "claim all" action.
 * No order creation, no payment, no account modification.
 *
 * The real server returns Markdown/JSON-hybrid text, so parsing lives in
 * ./parse.js and is applied here.
 */

import { getSettings } from './config.js';
import { McpClient } from './mcp-client.js';
import { buildMockBenefits, buildMockReport } from './mock.js';
import { extractJson, parseAvailableCoupons, parseMyCoupons, parseCampaigns, parseOrderList, latestDate } from './parse.js';
import { buildReport } from './report.js';

const READ_TOOLS = {
  now: 'now-time-info',
  claimable: 'available-coupons',
  mine: 'query-my-coupons',
  account: 'query-my-account',
  calendar: 'campaign-calendar',
};

async function tryCall(client, tool, args = {}) {
  try {
    const res = await client.callTool(tool, args);
    return { ok: true, data: res.data, isError: res.isError };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Load and normalize the benefits dashboard data.
 * @returns {Promise<object>} view model
 */
export async function loadBenefits() {
  const settings = await getSettings();
  if (settings.mock || !settings.token) {
    return buildMockBenefits();
  }

  const client = new McpClient({ endpoint: settings.endpoint, token: settings.token });
  await client.init();

  const [now, claimable, mine, account, calendar] = await Promise.all([
    tryCall(client, READ_TOOLS.now),
    tryCall(client, READ_TOOLS.claimable),
    tryCall(client, READ_TOOLS.mine),
    tryCall(client, READ_TOOLS.account),
    tryCall(client, READ_TOOLS.calendar),
  ]);

  return {
    source: 'live',
    fetchedAt: new Date().toISOString(),
    now: normalizeNow(now.data),
    account: normalizeAccount(account.data),
    claimable: normalizeClaimable(claimable.data),
    mine: normalizeMine(mine.data),
    campaigns: normalizeCampaigns(calendar.data),
    warnings: [claimable, mine, account, calendar]
      .filter((r) => !r.ok)
      .map((r) => r.error),
  };
}

/**
 * Claim every currently available "麦麦省" coupon.
 * @returns {Promise<object>} { ok, claimed, message }
 */
export async function claimAllCoupons() {
  const settings = await getSettings();
  if (settings.mock || !settings.token) {
    return { ok: true, demo: true, claimed: 3, message: '演示模式：模拟领取 3 张券' };
  }
  const client = new McpClient({ endpoint: settings.endpoint, token: settings.token });
  const res = await client.callTool('auto-bind-coupons', {});
  const payload = res.data;
  const message = typeof payload === 'string'
    ? payload.split(/\r?\n/).filter(Boolean).slice(0, 2).join(' ')
    : (payload && payload.message) || '已尝试一键领取全部可用券';
  return { ok: !res.isError, demo: false, message };
}

/**
 * Load the "我的足迹" report (①) for the given range.
 * @param {{days?: number}} options
 */
export async function loadReport({ days = 30 } = {}) {
  const settings = await getSettings();
  if (settings.mock || !settings.token) {
    return buildMockReport(days);
  }

  const client = new McpClient({ endpoint: settings.endpoint, token: settings.token });
  await client.init();

  const [ordersRes, accountRes] = await Promise.all([
    tryCall(client, 'order-list'),
    tryCall(client, 'query-my-account'),
  ]);

  const orders = parseOrderList(ordersRes.data);
  const account = normalizeAccount(accountRes.data);

  return {
    source: 'live',
    fetchedAt: new Date().toISOString(),
    ...buildReport(orders, account, { days }),
    warnings: [ordersRes, accountRes].filter((r) => !r.ok).map((r) => r.error),
  };
}

function normalizeNow(text) {
  const json = extractJson(text);
  const data = (json && json.data) || {};
  return {
    datetime: data.datetime || '',
    date: data.date || '',
    formatted: data.formatted || '',
    dayOfWeek: data.dayOfWeek || '',
  };
}

function normalizeAccount(text) {
  const json = extractJson(text);
  const d = (json && json.data) || null;
  if (!d) return null;
  return {
    availablePoints: toNumber(d.availablePoint),
    totalPoints: toNumber(d.accumulativePoint),
    expiringPoints: toNumber(d.currentMouthExpirePoint),
    expiredPoints: toNumber(d.expiredPoint),
    currency: d.currency || '',
  };
}

function normalizeClaimable(text) {
  return parseAvailableCoupons(text)
    .filter((c) => c.status.includes('可领取'))
    .map((c, i) => ({ id: `a${i}`, name: c.name, status: c.status }));
}

function normalizeMine(text) {
  return parseMyCoupons(text).map((c, i) => ({
    id: `m${i}`,
    name: c.name,
    amount: c.amount,
    validUntil: latestDate(c.validUntil),
    tags: c.tags,
    status: c.tags && c.tags.includes('今日到期') ? '今日到期' : '',
  }));
}

function normalizeCampaigns(text) {
  const order = { 进行中: 0, 预告: 1, 已结束: 2 };
  return parseCampaigns(text)
    .filter((c) => c.status !== '已结束')
    .sort((a, b) => order[a.status] - order[b.status])
    .slice(0, 6)
    .map((c, i) => ({ id: `c${i}`, title: c.title, range: c.date, status: c.status }));
}
