import { shareText } from '../lib/report.js';

const els = {
  mode: document.getElementById('mode-badge'),
  refresh: document.getElementById('btn-refresh'),
  options: document.getElementById('btn-options'),
  banner: document.getElementById('setup-banner'),
  bannerSetup: document.getElementById('banner-setup'),
  tabs: Array.from(document.querySelectorAll('.tab')),
  panels: {
    report: document.getElementById('panel-report'),
    benefits: document.getElementById('panel-benefits'),
  },
  segBtns: Array.from(document.querySelectorAll('.seg-btn')),
  reportCard: document.getElementById('report-card'),
  copy: document.getElementById('btn-copy'),
  html: document.getElementById('btn-html'),
  card: document.getElementById('btn-card'),
  points: document.getElementById('points'),
  pointsExpiring: document.getElementById('points-expiring'),
  claim: document.getElementById('btn-claim'),
  claimable: document.getElementById('claimable'),
  mine: document.getElementById('mine'),
  mineCount: document.getElementById('mine-count'),
  campaigns: document.getElementById('campaigns'),
  status: document.getElementById('status'),
  warnings: document.getElementById('warnings'),
};

const state = { tab: 'report', days: 30, report: null };

async function send(type, extra = {}) {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    return chrome.runtime.sendMessage({ type, ...extra });
  }
  // Preview fallback: no extension context.
  const mock = await import('../lib/mock.js');
  if (type === 'benefits:load') return { ok: true, data: mock.buildMockBenefits() };
  if (type === 'report:load') return { ok: true, data: mock.buildMockReport(extra.days) };
  return { ok: true, data: { claimed: 3, message: '预览模式：模拟领取 3 张券' } };
}

function openOptions() {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
    return;
  }
  window.open(new URL('../options/options.html', location.href).href, '_blank');
}

/* ---------- helpers ---------- */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function money(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  return Number.isFinite(n) ? `¥${n}` : String(value);
}

function emptyItem(text = '暂无') {
  return el('li', 'empty', text);
}

function applyMode(data) {
  const live = data.source === 'live';
  els.mode.textContent = live ? '实时' : '演示';
  els.mode.classList.toggle('live', live);
  els.banner.hidden = live;
  els.warnings.textContent = (data.warnings && data.warnings.length)
    ? `⚠ ${data.warnings.join('\n⚠ ')}`
    : '';
}

/* ---------- 我的足迹 (report) ---------- */

function stat(k, v) {
  const box = el('div', 'rc-stat');
  box.append(el('div', 'k', k), el('div', 'v', v));
  return box;
}

function renderReport(data) {
  state.report = data;
  applyMode(data);

  const p = data.personality;
  const card = els.reportCard;
  card.innerHTML = '';

  const head = el('div', 'rc-head');
  head.append(el('div', 'rc-title', '我的麦麦足迹'), el('div', 'rc-range', data.rangeLabel));

  const persona = el('div', 'rc-persona', `${p.emoji} ${p.code} · ${p.label}`);
  persona.append(el('span', 'blurb', p.blurb));

  const grid = el('div', 'rc-grid');
  grid.append(
    stat('下单', `${data.totals.orders} 次`),
    stat('消费', `¥${data.totals.spend}`),
    stat('常去门店', data.topStore || '—'),
    stat('涉及单品', `${data.totals.items} 份`),
  );

  const fav = el('div', 'rc-fav', '最爱：' + (data.topItems.slice(0, 3).map((i) => `${i.name}×${i.count}`).join('、') || '—'));
  const foot = el('div', 'rc-foot', '非麦当劳官方产品 · 数据来自麦当劳中国 MCP');

  card.append(head, persona, grid, fav, foot);
  els.status.textContent = `更新于 ${new Date(data.fetchedAt).toLocaleTimeString('zh-CN')}`;
}

async function loadReport() {
  els.status.textContent = '统计中…';
  els.warnings.textContent = '';
  const res = await send('report:load', { days: state.days });
  if (!res || !res.ok) {
    els.status.textContent = `加载失败：${res ? res.error : '未知错误'}`;
    return;
  }
  renderReport(res.data);
}

/* ---------- 今日福利 (benefits) ---------- */

function renderCoupons(ul, coupons, { showTags = false } = {}) {
  ul.innerHTML = '';
  if (!coupons || coupons.length === 0) {
    ul.appendChild(emptyItem());
    return;
  }
  for (const c of coupons) {
    const li = el('li', 'item');
    const left = el('div');
    const name = el('div', 'name', c.name);
    if (showTags && Array.isArray(c.tags)) {
      for (const t of c.tags.slice(0, 2)) name.appendChild(el('span', 'tag', t));
    }
    left.appendChild(name);

    const bits = [];
    if (c.threshold) bits.push(`满${c.threshold}可用`);
    if (c.validUntil) bits.push(`至 ${c.validUntil}`);
    if (bits.length) left.appendChild(el('div', 'sub', bits.join(' · ')));
    li.appendChild(left);

    const label = money(c.amount);
    if (label) li.appendChild(el('div', 'amount', label));
    ul.appendChild(li);
  }
}

function renderCampaigns(list) {
  els.campaigns.innerHTML = '';
  if (!list || list.length === 0) {
    els.campaigns.appendChild(emptyItem());
    return;
  }
  for (const c of list) {
    const li = el('li', 'item');
    const left = el('div');
    const name = el('div', 'name', c.title);
    if (c.status) name.appendChild(el('span', 'tag', c.status));
    left.append(name, el('div', 'sub', c.range || '—'));
    li.appendChild(left);
    els.campaigns.appendChild(li);
  }
}

function renderBenefits(data) {
  applyMode(data);

  els.points.textContent = data.account ? String(data.account.availablePoints ?? '--') : '--';
  els.pointsExpiring.textContent = (data.account && data.account.expiringPoints)
    ? String(data.account.expiringPoints)
    : '—';

  renderCoupons(els.claimable, data.claimable);
  renderCoupons(els.mine, data.mine, { showTags: true });
  els.mineCount.textContent = data.mine ? `(${data.mine.length})` : '';
  renderCampaigns(data.campaigns);

  els.status.textContent = `更新于 ${new Date(data.fetchedAt).toLocaleTimeString('zh-CN')}`;
}

async function loadBenefits() {
  els.status.textContent = '加载中…';
  els.warnings.textContent = '';
  const res = await send('benefits:load');
  if (!res || !res.ok) {
    els.status.textContent = `加载失败：${res ? res.error : '未知错误'}`;
    return;
  }
  renderBenefits(res.data);
}

async function claimAll() {
  els.claim.disabled = true;
  els.status.textContent = '正在领取…';
  const res = await send('coupons:claimAll');
  els.claim.disabled = false;
  if (!res || !res.ok) {
    els.status.textContent = `领取失败：${res ? res.error : '未知错误'}`;
    return;
  }
  els.status.textContent = res.data.message || '已领取';
  await loadBenefits();
}

/* ---------- tabs ---------- */

function switchTab(name) {
  state.tab = name;
  for (const t of els.tabs) t.classList.toggle('active', t.dataset.tab === name);
  els.panels.report.hidden = name !== 'report';
  els.panels.benefits.hidden = name !== 'benefits';
  if (name === 'report') loadReport();
  else loadBenefits();
}

/* ---------- share ---------- */

async function copyShare() {
  if (!state.report) return;
  const text = shareText(state.report);
  try {
    await navigator.clipboard.writeText(text);
    els.status.textContent = '分享文案已复制';
  } catch {
    els.status.textContent = text;
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = '';
  let cursor = y;
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth) {
      ctx.fillText(line, x, cursor);
      line = ch;
      cursor += lineHeight;
    } else {
      line += ch;
    }
  }
  if (line) ctx.fillText(line, x, cursor);
}

function downloadCard() {
  const data = state.report;
  if (!data) return;
  const p = data.personality;
  const W = 640;
  const H = 800;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');

  ctx.fillStyle = '#ffc300';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fffdf7';
  roundRect(ctx, 24, 24, W - 48, H - 48, 24);
  ctx.fill();

  ctx.fillStyle = '#da291c';
  ctx.font = '700 34px system-ui, "PingFang SC", "Microsoft YaHei"';
  ctx.fillText('我的麦麦足迹', 56, 106);
  ctx.fillStyle = '#8a9099';
  ctx.font = '16px system-ui';
  ctx.fillText(data.rangeLabel, 56, 138);

  ctx.fillStyle = '#fff3c4';
  roundRect(ctx, 56, 166, W - 112, 104, 16);
  ctx.fill();
  ctx.fillStyle = '#7a3b00';
  ctx.font = '700 26px system-ui, "PingFang SC"';
  ctx.fillText(`${p.emoji} ${p.code}`, 76, 214);
  ctx.font = '16px system-ui';
  ctx.fillStyle = '#96631f';
  wrapText(ctx, `${p.label} · ${p.blurb}`, 76, 246, W - 152, 22);

  const stats = [
    ['下单', `${data.totals.orders} 次`],
    ['消费', `¥${data.totals.spend}`],
    ['常去门店', data.topStore || '—'],
    ['涉及单品', `${data.totals.items} 份`],
  ];
  const colW = (W - 112) / 2;
  stats.forEach(([k, v], i) => {
    const x = 56 + (i % 2) * colW;
    const y = 300 + Math.floor(i / 2) * 104;
    ctx.fillStyle = '#faf6ec';
    roundRect(ctx, x, y, colW - 12, 92, 12);
    ctx.fill();
    ctx.fillStyle = '#8a9099';
    ctx.font = '15px system-ui';
    ctx.fillText(k, x + 18, y + 34);
    ctx.fillStyle = '#1f2329';
    ctx.font = '700 24px system-ui, "PingFang SC"';
    ctx.fillText(String(v).slice(0, 11), x + 18, y + 70);
  });

  ctx.fillStyle = '#1f2329';
  ctx.font = '16px system-ui, "PingFang SC"';
  const favText = '最爱：' + (data.topItems.slice(0, 3).map((i) => `${i.name}×${i.count}`).join('、') || '—');
  wrapText(ctx, favText, 56, 540, W - 112, 26);

  ctx.fillStyle = '#8a9099';
  ctx.font = '13px system-ui';
  ctx.fillText('麦麦时光机 · 非麦当劳官方产品', 56, H - 56);

  cv.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `麦麦足迹-${data.rangeLabel}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, 'image/png');
}

/* ---------- export HTML report ---------- */

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

function buildHtmlReport(data) {
  const p = data.personality;
  const max = Math.max(1, ...data.topItems.map((i) => i.count));
  const bars = (data.topItems.length ? data.topItems : [{ name: '—', count: 0 }])
    .map((i) => `<div class="bar-row"><span class="bar-name">${esc(i.name)}</span>`
      + `<span class="bar-track"><i style="width:${Math.round((i.count / max) * 100)}%"></i></span>`
      + `<span class="bar-count">×${i.count}</span></div>`)
    .join('');
  const stats = [
    ['下单', `${data.totals.orders} 次`],
    ['消费', `¥${data.totals.spend}`],
    ['常去门店', data.topStore || '—'],
    ['涉及单品', `${data.totals.items} 份`],
  ].map(([k, v]) => `<div class="stat"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('');
  const points = data.points
    ? `<p class="points">积分：可用 ${esc(data.points.available)} / 累计 ${esc(data.points.total)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>我的麦麦足迹 · ${esc(data.rangeLabel)}</title>
<style>
 body{margin:0;background:#ffc300;font-family:-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;color:#1f2329;}
 .wrap{max-width:720px;margin:24px auto;background:#fffdf7;border-radius:20px;padding:32px;box-shadow:0 8px 30px rgba(0,0,0,.08);}
 h1{margin:0 0 4px;font-size:26px;color:#da291c;}
 .range{color:#8a9099;margin:0 0 20px;}
 .persona{background:linear-gradient(135deg,#fff3c4,#ffe27a);border-radius:14px;padding:18px 20px;margin-bottom:20px;}
 .persona .t{font-size:22px;font-weight:800;color:#7a3b00;}
 .persona .b{margin-top:6px;color:#96631f;font-size:14px;}
 .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px;}
 .stat{background:#faf6ec;border-radius:12px;padding:14px 16px;}
 .stat .k{font-size:13px;color:#8a9099;}
 .stat .v{font-size:20px;font-weight:800;margin-top:4px;}
 h2{font-size:16px;margin:0 0 12px;}
 .bar-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:14px;}
 .bar-name{width:42%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
 .bar-track{flex:1;background:#f0ead9;border-radius:6px;height:12px;overflow:hidden;}
 .bar-track i{display:block;height:100%;background:#da291c;border-radius:6px;}
 .bar-count{width:44px;text-align:right;color:#8a9099;}
 .points{color:#8a9099;font-size:13px;}
 footer{margin-top:24px;text-align:center;color:#8a9099;font-size:12px;border-top:1px dashed #eee7d8;padding-top:14px;}
</style></head>
<body><div class="wrap">
 <h1>我的麦麦足迹</h1>
 <p class="range">${esc(data.rangeLabel)}</p>
 <div class="persona"><div class="t">${esc(p.emoji)} ${esc(p.code)} · ${esc(p.label)}</div><div class="b">${esc(p.blurb)}</div></div>
 <div class="grid">${stats}</div>
 <h2>最爱单品</h2>${bars}
 ${points}
 <footer>麦麦时光机 M-Moments · 非麦当劳官方产品 · 数据来自麦当劳中国 MCP</footer>
</div></body></html>`;
}

function exportHtmlReport() {
  const data = state.report;
  if (!data) return;
  const blob = new Blob([buildHtmlReport(data)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `麦麦足迹-${data.rangeLabel}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  els.status.textContent = '已导出 HTML 报告';
}

/* ---------- wiring ---------- */
for (const t of els.tabs) t.addEventListener('click', () => switchTab(t.dataset.tab));
for (const b of els.segBtns) {
  b.addEventListener('click', () => {
    state.days = Number(b.dataset.days);
    for (const x of els.segBtns) x.classList.toggle('active', x === b);
    loadReport();
  });
}
els.refresh.addEventListener('click', () => (state.tab === 'report' ? loadReport() : loadBenefits()));
els.claim.addEventListener('click', claimAll);
els.options.addEventListener('click', openOptions);
els.bannerSetup.addEventListener('click', openOptions);
els.copy.addEventListener('click', copyShare);
els.html.addEventListener('click', exportHtmlReport);
els.card.addEventListener('click', downloadCard);

switchTab('report');
