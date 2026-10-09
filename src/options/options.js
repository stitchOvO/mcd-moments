import { getSettings, saveSettings, DEFAULT_ENDPOINT } from '../lib/config.js';

const el = {
  token: document.getElementById('token'),
  endpoint: document.getElementById('endpoint'),
  mock: document.getElementById('mock'),
  reminders: document.getElementById('reminders'),
  autoClaim: document.getElementById('autoClaim'),
  test: document.getElementById('test'),
  save: document.getElementById('save'),
  clear: document.getElementById('clear'),
  status: document.getElementById('status'),
};

function flash(text) {
  el.status.textContent = text;
  setTimeout(() => { el.status.textContent = ''; }, 2500);
}

function send(type, extra = {}) {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    return chrome.runtime.sendMessage({ type, ...extra });
  }
  return Promise.resolve({ ok: true, data: { demo: true, message: '预览模式：不发送提醒' } });
}

async function init() {
  const s = await getSettings();
  el.endpoint.value = s.endpoint || DEFAULT_ENDPOINT;
  el.token.value = s.token || '';
  el.mock.checked = !!s.mock;
  el.reminders.checked = !!s.reminders;
  el.autoClaim.checked = !!s.autoClaim;
}

async function save() {
  await saveSettings({
    token: el.token.value.trim(),
    endpoint: el.endpoint.value.trim() || DEFAULT_ENDPOINT,
    mock: el.mock.checked,
    reminders: el.reminders.checked,
    autoClaim: el.autoClaim.checked,
  });
  await send('reminders:sync', { enabled: el.reminders.checked });
  flash('已保存');
}

el.save.addEventListener('click', save);

el.test.addEventListener('click', async () => {
  await send('reminders:test');
  flash('已发送测试提醒（演示模式仅提示）');
});

el.clear.addEventListener('click', async () => {
  el.token.value = '';
  await saveSettings({ token: '' });
  flash('已清除本地 Token');
});

init();
