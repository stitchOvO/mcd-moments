/**
 * Pure aggregation for the "我的足迹" report (①): turns normalized orders and
 * account info into a shareable summary with a deterministic "麦门人格".
 * No chrome/network dependencies, so it is fully unit-testable.
 */

const DAY_MS = 86400000;

export function parseDate(value) {
  if (!value) return null;
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
}

function sum(values) {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function topKey(map) {
  let best = '';
  let bestCount = -1;
  for (const [key, count] of map) {
    if (count > bestCount) { best = key; bestCount = count; }
  }
  return best;
}

/**
 * Deterministic "麦门人格" derived from order count and favorite item.
 */
export function derivePersonality({ orders, topItems }) {
  if (!orders) {
    return { emoji: '🍃', code: '麦门·路过的风', label: '新晋麦友', blurb: '还没留下足迹，去点一顿开启你的麦麦档案吧。' };
  }
  const fav = (topItems && topItems[0] && topItems[0].name) || '';
  let base;
  if (/咖啡|美式|拿铁|麦咖啡/.test(fav)) {
    base = { emoji: '☕', code: '麦门·咖啡因续命党', blurb: '没有一杯麦咖啡，今天就不算开始。' };
  } else if (/早餐|松饼|蛋堡|薯饼|猪柳/.test(fav)) {
    base = { emoji: '🌅', code: '麦门·早起干饭人', blurb: '早八的快乐，是一堡一咖给的。' };
  } else if (/辣|鸡|堡/.test(fav)) {
    base = { emoji: '🍔', code: '麦门·无肉不欢', blurb: '堡治百病，辣得开心。' };
  } else if (/麦旋风|冰淇淋|圆筒|新地|甜/.test(fav)) {
    base = { emoji: '🍦', code: '麦门·甜品控', blurb: '甜一口，烦恼全消。' };
  } else {
    base = { emoji: '🍟', code: '麦门·老铁', blurb: '随口一报就是经典搭配。' };
  }
  base.label = orders >= 20 ? '重度麦门' : orders >= 5 ? '熟练麦友' : '尝鲜选手';
  return base;
}

/**
 * @param {Array} orders  normalized orders (see parseOrderList)
 * @param {object|null} account  { availablePoints, totalPoints }
 * @param {{days?:number, now?:Date}} options
 */
export function buildReport(orders, account, { days = 365, now = new Date() } = {}) {
  const list = Array.isArray(orders) ? orders : [];
  const from = now.getTime() - days * DAY_MS;
  const inRange = list.filter((o) => {
    const t = parseDate(o.createTime);
    return t && t.getTime() >= from && t.getTime() <= now.getTime();
  });

  const storeCounts = new Map();
  const itemCounts = new Map();
  for (const o of inRange) {
    if (o.storeName) storeCounts.set(o.storeName, (storeCounts.get(o.storeName) || 0) + 1);
    for (const it of o.items || []) {
      if (!it.name) continue;
      itemCounts.set(it.name, (itemCounts.get(it.name) || 0) + (it.quantity || 1));
    }
  }

  const topItems = [...itemCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    days,
    rangeLabel: days <= 31 ? '最近 30 天' : '近一年',
    totals: {
      orders: inRange.length,
      spend: round2(sum(inRange.map((o) => o.amount || 0))),
      stores: storeCounts.size,
      items: sum(itemCounts.values()),
    },
    topStore: topKey(storeCounts),
    topItems,
    points: account ? { available: account.availablePoints, total: account.totalPoints } : null,
    personality: derivePersonality({ orders: inRange.length, topItems }),
  };
}

/** Human-readable share text for copy-to-clipboard. */
export function shareText(report) {
  const p = report.personality;
  const fav = report.topItems[0] ? report.topItems[0].name : '——';
  return [
    `我的麦麦足迹 · ${report.rangeLabel} 🍔`,
    `下单 ${report.totals.orders} 次 · 最爱「${fav}」`,
    report.topStore ? `常去：${report.topStore}` : '',
    `麦门人格：${p.emoji} ${p.code}（${p.label}）`,
    '#麦当劳 #麦门',
  ].filter(Boolean).join('\n');
}
