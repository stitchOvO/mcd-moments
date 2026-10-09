/**
 * Parsers for the real麦当劳 MCP tool payloads.
 *
 * The server does NOT return plain JSON. Two shapes are observed:
 *  1. Markdown cards with an embedded "# API Response Information" header and a
 *     "## Original Response" section that holds a pure JSON object.
 *  2. Pure Markdown lists (coupons, campaign calendar).
 *
 * All functions are pure and exported for unit testing.
 */

/** Strip a trailing markdown line-break backslash and surrounding spaces. */
function clean(value) {
  return String(value == null ? '' : value).replace(/\\+\s*$/, '').trim();
}

/** Return the first balanced {...} object found at or after `start`. */
function sliceBalancedJson(source, start) {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < source.length; i += 1) {
    const c = source[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Extract the JSON object embedded in a tool text response.
 * Looks after "## Original Response" when present, otherwise scans the whole text.
 * @returns {object|null}
 */
export function extractJson(text) {
  const source = String(text || '');
  if (!source) return null;
  const marker = '## Original Response';
  const markerIndex = source.indexOf(marker);
  const searchFrom = markerIndex >= 0 ? markerIndex + marker.length : 0;
  const braceStart = source.indexOf('{', searchFrom);
  if (braceStart < 0) return null;
  const slice = sliceBalancedJson(source, braceStart);
  if (!slice) return null;
  try { return JSON.parse(slice); } catch { return null; }
}

/**
 * Parse `available-coupons` markdown:
 *   - 优惠券标题：麦旋风任选 \
 *     状态：已领取 \
 * @returns {Array<{name:string,status:string}>}
 */
export function parseAvailableCoupons(text) {
  const items = [];
  let cur = null;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    const title = line.match(/^-\s*优惠券标题[:：]\s*(.+)$/);
    if (title) {
      if (cur) items.push(cur);
      cur = { name: clean(title[1]), status: '' };
      continue;
    }
    if (!cur) continue;
    const status = line.match(/^状态[:：]\s*(.+)$/);
    if (status) cur.status = clean(status[1]);
  }
  if (cur) items.push(cur);
  return items;
}

/**
 * Parse `query-my-coupons` markdown:
 *   ## 麦旋风任选
 *   - **优惠**: ¥9.9 (用券价格)
 *   - **有效期**: 2026-10-05 10:30-2026-10-09 23:59 ...
 *   - **标签**: 今日到期、到店专用、外送专用
 * @returns {Array<{name,amount,priceText,validUntil,claimedAt,tags:string[]}>}
 */
export function parseMyCoupons(text) {
  const items = [];
  let cur = null;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      if (cur) items.push(cur);
      cur = { name: heading[1], amount: null, priceText: '', validUntil: '', claimedAt: '', tags: [] };
      continue;
    }
    if (!cur) continue;
    const price = line.match(/^-\s*\*\*优惠\*\*[:：]\s*(.+)$/);
    if (price) {
      cur.priceText = price[1].trim();
      const m = cur.priceText.match(/¥\s*([\d.]+)/);
      if (m) cur.amount = Number(m[1]);
      continue;
    }
    const valid = line.match(/^-\s*\*\*有效期\*\*[:：]\s*(.+)$/);
    if (valid) { cur.validUntil = valid[1].trim(); continue; }
    const claimed = line.match(/^-\s*\*\*领取时间\*\*[:：]\s*(.+)$/);
    if (claimed) { cur.claimedAt = claimed[1].trim(); continue; }
    const tags = line.match(/^-\s*\*\*标签\*\*[:：]\s*(.+)$/);
    if (tags) { cur.tags = tags[1].split(/[、,，]/).map((s) => s.trim()).filter(Boolean); continue; }
  }
  if (cur) items.push(cur);
  return items;
}

/**
 * Return the latest yyyy-MM-dd date found in a text, or '' if none.
 * Used to turn a validity range like "2026-10-05 10:30-2026-10-09 23:59"
 * into its deadline (2026-10-09).
 */
export function latestDate(text) {
  const dates = String(text || '').match(/\d{4}-\d{2}-\d{2}/g);
  if (!dates || !dates.length) return '';
  return dates.sort()[dates.length - 1];
}

/**
 * Parse `campaign-calendar` markdown into deduped campaigns.
 *   #### 2026年10月9日 今日
 *   -   **活动标题**：韩式风味蘸酱上新...
 * @returns {Array<{title,date,status}>}
 */
export function parseCampaigns(text) {
  const items = [];
  const seen = new Set();
  let date = '';
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    const heading = line.match(/^####\s+(.+?)\s*$/);
    if (heading) { date = heading[1].trim(); continue; }
    const title = line.match(/^-\s*\*\*活动标题\*\*[:：]\s*(.+)$/);
    if (!title) continue;
    const name = title[1].trim();
    if (seen.has(name)) continue;
    seen.add(name);
    let status = '预告';
    if (/今日/.test(date)) status = '进行中';
    else if (/往期/.test(date)) status = '已结束';
    items.push({ title: name, date, status });
  }
  return items;
}

/**
 * Parse `order-list` JSON (## Original Response -> data.list[]).
 * @returns {Array<{orderId,orderType,createTime,storeName,status,amount,items}>}
 */
export function parseOrderList(text) {
  const json = extractJson(text);
  const list = json && json.data && Array.isArray(json.data.list) ? json.data.list : [];
  return list.map((o) => ({
    orderId: o.orderId || '',
    orderType: o.orderType || '',
    createTime: o.createTime || '',
    storeName: o.storeName || '',
    status: o.orderStatus || '',
    amount: Number(o.realTotalAmount) || 0,
    items: (o.orderProductList || []).map((p) => ({
      name: p.productName || '',
      quantity: Number(p.quantity) || 1,
      subItems: (p.comboItemList || []).map((s) => s.name || '').filter(Boolean),
    })),
  }));
}
