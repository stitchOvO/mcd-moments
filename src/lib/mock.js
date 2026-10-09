/**
 * Demo fixtures used when no real MCP token is configured.
 * Shapes mirror the real MCP tool payloads as closely as observable so the UI
 * renders identically in demo and live mode.
 */

export function buildMockBenefits() {
  const now = new Date();
  return {
    source: 'demo',
    fetchedAt: now.toISOString(),
    now: { datetime: now.toISOString(), display: formatCn(now) },
    account: { availablePoints: 1280, totalPoints: 3460, expiringPoints: 120, expiringDate: '2026-10-31' },
    claimable: [
      { id: 'c1', name: '麦麦省 · 满30减5', amount: 5, threshold: 30, validUntil: '2026-10-20' },
      { id: 'c2', name: '麦麦省 · 薯条免费升大', amount: 3, threshold: 0, validUntil: '2026-10-18' },
      { id: 'c3', name: '麦麦省 · 咖啡第二杯半价', amount: 6, threshold: 15, validUntil: '2026-10-25' },
    ],
    mine: [
      { id: 'm1', name: '巨无霸三件套 立减8元', amount: 8, threshold: 30, validUntil: '2026-10-12', status: '即将过期' },
      { id: 'm2', name: '任意消费 送小食', amount: 5, threshold: 0, validUntil: '2026-11-05', status: '可用' },
    ],
    campaigns: [
      { title: '会员日 双倍积分', range: '2026-10-09 ~ 2026-10-11', status: '进行中' },
      { title: '秋日新品 · 麦咖啡特调', range: '2026-09-28 ~ 2026-10-31', status: '进行中' },
      { title: '程序员节限定', range: '2026-10-24 ~ 2026-10-25', status: '预告' },
    ],
    nearbyStores: [
      { name: '麦当劳(南京西路店)', distanceM: 320, businessHours: '07:00-23:00' },
      { name: '麦当劳(人民广场店)', distanceM: 850, businessHours: '24小时' },
    ],
  };
}

function formatCn(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function buildMockReport(days = 30) {
  return {
    source: 'demo',
    fetchedAt: new Date().toISOString(),
    days,
    rangeLabel: days <= 31 ? '最近 30 天' : '近一年',
    totals: { orders: 23, spend: 468.5, stores: 4, items: 41 },
    topStore: '麦当劳(南京西路店)',
    topItems: [
      { name: '巨无霸', count: 9 },
      { name: '薯条(大)', count: 8 },
      { name: '麦咖啡拿铁', count: 6 },
    ],
    points: { available: 1280, total: 3460 },
    personality: { emoji: '🍔', code: '麦门·无肉不欢', label: '重度麦门', blurb: '堡治百病，辣得开心。' },
  };
}
