/**
 * Verify the parsers against the real payloads captured by scripts/probe.mjs.
 * Run after `npm run probe`:  node scripts/verify-probe.mjs
 * Reads .debug/probe-output.txt (local only, gitignored) and prints a summary.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractJson, parseAvailableCoupons, parseMyCoupons, parseCampaigns } from '../src/lib/parse.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILE = join(ROOT, '.debug/probe-output.txt');
let raw;
try {
  raw = readFileSync(FILE, 'utf8');
} catch {
  console.error(`找不到 ${FILE}，请先运行：npm run probe`);
  process.exit(1);
}

const texts = {};
for (const section of raw.split(/={70}/)) {
  const m = section.match(/## TOOL:\s*(\S+)/);
  if (!m) continue;
  const idx = section.indexOf('--- RAW TEXT ---');
  texts[m[1]] = idx >= 0 ? section.slice(idx + '--- RAW TEXT ---'.length).trim() : '';
}

const now = extractJson(texts['now-time-info']);
console.log('now-time-info     ->', now ? now.data.formatted : 'PARSE FAIL');

const account = extractJson(texts['query-my-account']);
console.log('query-my-account  ->', account
  ? { available: account.data.availablePoint, accumulative: account.data.accumulativePoint }
  : 'PARSE FAIL');

const avail = parseAvailableCoupons(texts['available-coupons']);
const claimable = avail.filter((c) => c.status.includes('可领取'));
console.log(`available-coupons -> total ${avail.length}, claimable ${claimable.length}:`,
  claimable.map((c) => c.name).join(', '));

const mine = parseMyCoupons(texts['query-my-coupons']);
console.log(`query-my-coupons  -> ${mine.length} coupons, first:`,
  mine[0] ? `${mine[0].name} (¥${mine[0].amount})` : 'none');

const camps = parseCampaigns(texts['campaign-calendar']);
const active = camps.filter((c) => c.status === '进行中');
const upcoming = camps.filter((c) => c.status === '预告');
console.log(`campaign-calendar -> total ${camps.length}, 进行中 ${active.length}, 预告 ${upcoming.length}`);
console.log('  今日活动:', active.map((c) => c.title).join(' | '));
