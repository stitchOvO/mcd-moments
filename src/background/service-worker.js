/**
 * MV3 service worker: message router + daily reminder alarm.
 * All network calls to the麦当劳 MCP server happen here so the token never
 * needs to leave the extension's own storage.
 */

import { loadBenefits, claimAllCoupons, loadReport } from '../lib/tools.js';
import { getSettings } from '../lib/config.js';
import { ensureAlarm, runDailyCheck, ALARM_NAME } from '../lib/reminders.js';

const HANDLERS = {
  'benefits:load': () => loadBenefits(),
  'coupons:claimAll': () => claimAllCoupons(),
  'report:load': (message) => loadReport({ days: message.days }),
  'reminders:test': async () => {
    await runDailyCheck({ force: true });
    return { ok: true };
  },
  'reminders:sync': async (message) => {
    ensureAlarm(!!message.enabled);
    return { ok: true };
  },
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = message && HANDLERS[message.type];
  if (!handler) return false;
  Promise.resolve()
    .then(() => handler(message))
    .then((data) => sendResponse({ ok: true, data }))
    .catch((err) => sendResponse({ ok: false, error: err && err.message ? err.message : String(err) }));
  return true; // keep the message channel open for the async response
});

async function syncAlarmFromSettings() {
  const settings = await getSettings();
  ensureAlarm(settings.reminders);
}

chrome.runtime.onInstalled.addListener(syncAlarmFromSettings);
chrome.runtime.onStartup.addListener(syncAlarmFromSettings);

if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) runDailyCheck();
  });
}
