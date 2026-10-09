/**
 * Daily reminder: a chrome.alarms job that summarizes claimable / expiring
 * rewards and (optionally) auto-claims coupons, then raises a notification.
 */

import { getSettings } from './config.js';
import { loadBenefits, claimAllCoupons } from './tools.js';

export const ALARM_NAME = 'mcradar-daily';
const ICON_PATH = 'assets/icon128.png';

function nextAt(hour) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export function ensureAlarm(enabled) {
  if (!chrome.alarms) return;
  chrome.alarms.clear(ALARM_NAME);
  if (enabled) {
    chrome.alarms.create(ALARM_NAME, { when: nextAt(9), periodInMinutes: 1440 });
  }
}

function notify(title, message) {
  if (!chrome.notifications) return;
  chrome.notifications.create(ALARM_NAME, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL(ICON_PATH),
    title,
    message,
  });
}

export async function runDailyCheck({ force = false } = {}) {
  const settings = await getSettings();
  if (settings.mock || !settings.token) {
    if (force) notify('麦麦时光机', '演示模式：请先在「设置」里填入 MCP Token。');
    return { skipped: true };
  }

  const data = await loadBenefits();
  const claimable = (data.claimable || []).length;
  const expiring = (data.mine || []).filter(
    (c) => (c.tags || []).includes('今日到期') || c.status === '今日到期',
  );

  let extra = '';
  if (settings.autoClaim && claimable > 0) {
    try {
      const res = await claimAllCoupons();
      extra = res.message || '已自动领取可用券';
    } catch {
      extra = '自动领券失败';
    }
  }

  const parts = [];
  if (claimable) parts.push(`${claimable} 张可领券`);
  if (expiring.length) parts.push(`${expiring.length} 张券今日到期`);
  if (data.account && data.account.expiringPoints) parts.push(`${data.account.expiringPoints} 积分将过期`);
  if (!parts.length) parts.push('暂无临期权益，安心吃麦');

  notify('麦麦福利提醒', [parts.join(' · '), extra].filter(Boolean).join('｜'));
  return { claimable, expiring: expiring.length, extra };
}

export { notify };
