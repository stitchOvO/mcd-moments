import { test } from 'node:test';
import assert from 'node:assert/strict';

import { extractJson, parseAvailableCoupons, parseMyCoupons, parseCampaigns, latestDate } from '../src/lib/parse.js';

const ACCOUNT_TEXT = `# API Response Information

Below is the response from an API call.

## Response Structure

- **data**: 积分账户信息 (Type: object)

## Original Response

{"success":true,"code":200,"message":"请求成功","data":{"availablePoint":"0","accumulativePoint":"234.5","currentMouthExpirePoint":"12","expiredPoint":"0"}}`;

const AVAILABLE_TEXT = `### 麦麦省优惠券列表：
- 优惠券标题：麦旋风任选 \\
  状态：已领取 \\
  优惠券图片：\\
    <img src="https://x/y.png" alt="麦旋风任选" height="auto" width="300">
- 优惠券标题：免费脆薯饼 \\
  状态：可领取 \\
  优惠券图片：\\
    <img src="https://x/z.png" alt="免费脆薯饼" height="auto" width="300">`;

const MY_COUPONS_TEXT = `# 您的优惠券列表

共 2 张可用优惠券 | 第 1/1 页 | 每页 200 条

## 麦旋风任选
- **优惠**: ¥9.9 (用券价格)
- **有效期**: 2026-10-05 10:30-2026-10-09 23:59 周一、二、三、四、五 10:30-23:59
- **领取时间**: 4日前收到
- **标签**: 今日到期、到店专用、外送专用

## 火腿扒堡早餐两件套
- **优惠**: ¥9.9 (用券价格)
- **有效期**: 2026-10-12 05:00-2026-10-12 10:29 周一 05:00-10:29
- **标签**: 到店专用`;

const CAMPAIGNS_TEXT = `### 当前时间：2026-10-09 16:35:05

### 活动列表：

#### 2026年10月7日 往期回顾

-   **活动标题**：超值9.9元早餐两件套
    **活动内容介绍**：早八的快乐

#### 2026年10月9日 今日

-   **活动标题**：韩式风味蘸酱上新
    **活动内容介绍**：上新啦

-   **活动标题**：蓝莓爆爆珠麦旋风上新
    **活动内容介绍**：上新啦`;

test('extractJson pulls the object after "## Original Response"', () => {
  const json = extractJson(ACCOUNT_TEXT);
  assert.equal(json.data.accumulativePoint, '234.5');
});

test('extractJson returns null when there is no JSON', () => {
  assert.equal(extractJson('- 优惠券标题：x\n  状态：可领取'), null);
});

test('parseAvailableCoupons reads title and status, strips line-break backslash', () => {
  const items = parseAvailableCoupons(AVAILABLE_TEXT);
  assert.equal(items.length, 2);
  assert.equal(items[0].name, '麦旋风任选');
  assert.equal(items[0].status, '已领取');
  assert.equal(items[1].status, '可领取');
});

test('parseMyCoupons reads name, price, validity and tags', () => {
  const items = parseMyCoupons(MY_COUPONS_TEXT);
  assert.equal(items.length, 2);
  assert.equal(items[0].name, '麦旋风任选');
  assert.equal(items[0].amount, 9.9);
  assert.deepEqual(items[0].tags, ['今日到期', '到店专用', '外送专用']);
  assert.equal(items[1].name, '火腿扒堡早餐两件套');
});

test('parseCampaigns dedupes titles and derives status from the date heading', () => {
  const items = parseCampaigns(CAMPAIGNS_TEXT);
  assert.equal(items.length, 3);
  assert.equal(items[0].title, '超值9.9元早餐两件套');
  assert.equal(items[0].status, '已结束');
  assert.equal(items[1].status, '进行中');
  assert.equal(items[1].date, '2026年10月9日 今日');
});

test('latestDate returns the deadline from a validity range', () => {
  assert.equal(latestDate('2026-10-05 10:30-2026-10-09 23:59 周一、二'), '2026-10-09');
  assert.equal(latestDate('2026-10-12 05:00-2026-10-12 10:29 周一'), '2026-10-12');
  assert.equal(latestDate(''), '');
});
