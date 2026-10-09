import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseOrderList } from '../src/lib/parse.js';
import { buildReport, derivePersonality, shareText, parseDate } from '../src/lib/report.js';

const ORDER_TEXT = `# API Response Information

## Original Response

{"success":true,"code":200,"data":{"list":[{"orderId":"A1","orderType":"1","createTime":"2026-10-01 12:00:00","storeName":"麦当劳南京雨润大街餐厅","orderStatus":"订单已完成","realTotalAmount":"30","orderProductList":[{"productCode":"1","productName":"辣鸡腿堡","quantity":2,"comboItemList":[{"name":"可乐中杯","quantity":1}]}]},{"orderId":"A2","orderType":"1","createTime":"2026-09-01 08:00:00","storeName":"麦当劳南京雨润大街餐厅","orderStatus":"订单已完成","realTotalAmount":"12.5","orderProductList":[{"productName":"麦咖啡拿铁","quantity":1,"comboItemList":[]}]}]}}`;

const NOW = new Date('2026-10-09T12:00:00');

test('parseOrderList extracts orders, items and amounts', () => {
  const orders = parseOrderList(ORDER_TEXT);
  assert.equal(orders.length, 2);
  assert.equal(orders[0].storeName, '麦当劳南京雨润大街餐厅');
  assert.equal(orders[0].amount, 30);
  assert.equal(orders[0].items[0].name, '辣鸡腿堡');
  assert.deepEqual(orders[0].items[0].subItems, ['可乐中杯']);
});

test('parseDate handles "yyyy-MM-dd HH:mm:ss"', () => {
  assert.equal(parseDate('2026-10-01 12:00:00').getFullYear(), 2026);
  assert.equal(parseDate('nonsense'), null);
});

test('buildReport aggregates within the selected range', () => {
  const orders = parseOrderList(ORDER_TEXT);
  const report = buildReport(orders, { availablePoints: 5, totalPoints: 10 }, { days: 30, now: NOW });
  assert.equal(report.totals.orders, 1); // 09-01 order is outside 30 days
  assert.equal(report.totals.spend, 30);
  assert.equal(report.topStore, '麦当劳南京雨润大街餐厅');
  assert.equal(report.topItems[0].name, '辣鸡腿堡');
  assert.equal(report.personality.code, '麦门·无肉不欢');
});

test('buildReport with a full-year range includes older orders', () => {
  const orders = parseOrderList(ORDER_TEXT);
  const report = buildReport(orders, null, { days: 365, now: NOW });
  assert.equal(report.totals.orders, 2);
  assert.equal(report.totals.spend, 42.5);
});

test('derivePersonality handles the no-order case', () => {
  const p = derivePersonality({ orders: 0, topItems: [] });
  assert.match(p.code, /路过的风/);
});

test('shareText contains persona and range', () => {
  const report = buildReport(parseOrderList(ORDER_TEXT), null, { days: 30, now: NOW });
  const text = shareText(report);
  assert.match(text, /我的麦麦足迹/);
  assert.match(text, /最近 30 天/);
  assert.match(text, /麦门·无肉不欢/);
});
