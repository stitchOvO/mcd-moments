# WorkBuddy 对话上下文（workbuddy.md）

> 本文件用于核验「麦麦时光机 M-Moments」是否符合 WorkBuddy 专项奖励的联动条件。
> 本项目使用**腾讯 WorkBuddy** 开发：导入 `mcradar` 技能 + 连接**麦当劳中国 MCP**，
> 完成「麦麦足迹」报告生成与「麦麦省」领券实测。
>
> 来源：WorkBuddy 会话日志（2026-10-09T09:37:02.268Z）
> 已脱敏：MCP Token（Bearer）、券码、账号 ID 等凭证均已移除。

## 会话主题

查看麦当劳一年足迹

## 对话记录

### 🧑 用户

<user_query>使用 mcradar 技能，看看我近一年的麦当劳足迹</user_query>

### 🤖 WorkBuddy

我来加载 mcradar 技能，为你整理近一年的麦当劳足迹。

- 🔧 调用工具 `Skill`：`"{\"skill\": \"mcradar\", \"args\": \"近一年 麦当劳足迹\"}"`
  - ↩︎ 返回：`{"type":"text","text":"Base directory for this skill: C:\\Users\\Administrator\\.workbuddy\\skills\\mcradar\n# 麦麦时光机 M-Moments（WorkBuddy / 通用 Agent Skill）\n\n把麦当劳中国 MCP 的能力，做成两件用户真正想要的事：**回顾自己的麦麦足迹** `
- 🔧 调用工具 `ToolSearch`：`"{\"tool_names\": [\"mcp__mcd-mcp__now-time-info\", \"mcp__mcd-mcp__order-list\", \"mcp__mcd-mcp__query-my-account\"]}"`
  - ↩︎ 返回：`{"type":"text","text":"Found 3 tool(s). Use DeferExecuteTool to invoke them.\n\n## mcp__mcd-mcp__now-time-info\n获取当前时间信息 - 返回当前服务器的完整时间信息，包括：\n- 时间戳（毫秒级）\n- 格式化的日期时间\n- 年月日信息\n- 时区和UTC时间\n在你不知道当前时间，并且`
- 🔧 调用工具 `DeferExecuteTool`：`"{\"toolName\": \"mcp__mcd-mcp__now-time-info\", \"params\": {}}"`
- 🔧 调用工具 `DeferExecuteTool`：`"{\"toolName\": \"mcp__mcd-mcp__order-list\", \"params\": {}}"`
- 🔧 调用工具 `DeferExecuteTool`：`"{\"toolName\": \"mcp__mcd-mcp__query-my-account\", \"params\": {}}"`
  - ↩︎ 返回：`{"type":"text","text":"# API Response Information\n\nBelow is the response from an API call. To help you understand the data, I've provided:\n\n1. A detailed description of all fields in the response `
  - ↩︎ 返回：`{"type":"text","text":"# API Response Information\n\nBelow is the response from an API call. To help you understand the data, I've provided:\n\n1. A detailed description of all fields in the response `
  - ↩︎ 返回：`{"type":"text","text":"# API Response Information\n\nBelow is the response from an API call. To help you understand the data, I've provided:\n\n1. A detailed description of all fields in the response `
- 🔧 调用工具 `widget_guidelines`：`"{\"modules\": \"[\\\"art\\\", \\\"diagram\\\"]\"}"`
  - ↩︎ 返回：`[{"type":"input_text","text":"{\"type\":\"visualizer_read_me_result\",\"content\":\"# Visualizer Core Design System\\n\\n## Philosophy\\n- **Seamless**: Users shouldn't notice where the host UI ends a`
- 🔧 调用工具 `show_widget`：`"{\"title\": \"近一年麦当劳足迹卡片\", \"loading_messages\": \"[\\\"正在汇总订单数据\\\",\\\"计算常去门店\\\",\\\"生成麦门人格\\\",\\\"渲染足迹卡片\\\"]\", \"widget_code\": \"<h2 class=\\\"sr-only\\\">近一年麦当劳足迹：下单 2 次`
  - ↩︎ 返回：`[{"type":"input_text","text":"{\"type\":\"visualizer_show_widget_result\",\"success\":true,\"title\":\"近一年麦当劳足迹卡片\",\"widget_code\":\"<h2 class=\\\"sr-only\\\">近一年麦当劳足迹：下单 2 次，消费 0 元，常去南京雨润大街餐厅</h2>\\`
### 🤖 WorkBuddy

近一年的麦当劳足迹查完了。先说结论：**你的记录很清淡——近一年只有 2 笔订单，而且都是 ¥0 的权益兑换单**。

```
## 我的麦麦足迹 · 近一年（2025-10-09 → 2026-10-09）
🍟 麦门·老铁 · 尝鲜选手 —— 路过门店顺便薅一杯，也算来过麦门

- 下单：2 次
- 消费：¥0
- 常去门店：麦当劳南京雨润大街餐厅（唯一一家）
- 涉及单品：2 份
- 最爱：【美汁源】"多汁柠柠"×1、饮品任选（阳光柠檬红茶中杯）×1

> 非麦当劳官方产品 · 数据来自麦当劳中国 MCP
```

可分享文案：

```
我的麦麦足迹 · 近一年 🍔
下单 2 次 · 最爱「【美汁源】多汁柠柠」
常去：麦当劳南京雨润大街餐厅
麦门人格：🍟 麦门·老铁（尝鲜选手）
#麦当劳 #麦门
```

**订单明细（接口实际返回的全部记录）**

| 时间 | 门店 | 内容 | 金额 | 状态 |
|---|---|---|---|---|
| 2026-08-07 15:17 | 南京雨润大街餐厅 | 【美汁源】"多汁柠柠" ×1 | ¥0 | 已完成 |
| 2026-04-02 13:09 | 南京雨润大街餐厅 | 饮品任选（阳光柠檬红茶中杯）×1 | ¥0 | 已完成 |

**积分账户**（顺便查了一下）

- 累计积分 234.5，已使用 0
- 可用积分 **0**，已过期 **234.5** —— 也就是说这 234.5 分全部到期作废了，账户目前是空的状态

**两点说明**

1. 两笔都是 ¥0，看形态应是领券/权益兑换的单，不含消费金额，所以"消费 ¥0"不代表你没花过钱 —— 历史订单接口只返回了这 2 条，如果你记得点过更多次，可能是接口对查询区间或历史深度有限制。
2. 人格判定走的是确定性规则：最爱单品里没有咖啡、早餐、辣堡、甜品等关键词，所以落在兜底项"🍟 麦门·老铁"；2 次 < 5 次，等级为"尝鲜选手"。

需要的话，我可以接着帮你做**权益速览**：看看有哪些券可以领、哪些快到期、最近有什么活动（领券是唯一的写操作，我会先问过你再动手）。

### 🧑 用户

<user_query>我有哪些麦麦省券可以领？帮我领一下，并看看哪些券今天到期</user_query>

### 🤖 WorkBuddy

收到，先看看有哪些可领的券。

- 🔧 调用工具 `ToolSearch`：`"{\"tool_names\": [\"mcp__mcd-mcp__available-coupons\", \"mcp__mcd-mcp__query-my-coupons\", \"mcp__mcd-mcp__auto-bind-coupons\", \"mcp__mcd-mcp__campaign-calendar\"]}"`
  - ↩︎ 返回：`{"type":"text","text":"Found 4 tool(s). Use DeferExecuteTool to invoke them.\n\n## mcp__mcd-mcp__available-coupons\n查询用户当前可领取的麦麦省的优惠券列表。返回券名称、图片、状态和促销标签。当用户询问有什么优惠、可以领什么券时使用此工具。\n\nParameters:\n```jso`
- 🔧 调用工具 `DeferExecuteTool`：`"{\"params\": {}, \"toolName\": \"mcp__mcd-mcp__available-coupons\"}"`
- 🔧 调用工具 `DeferExecuteTool`：`"{\"params\": {\"page\": \"1\", \"pageSize\": \"200\"}, \"toolName\": \"mcp__mcd-mcp__query-my-coupons\"}"`
  - ↩︎ 返回：`{"type":"text","text":"### 麦麦省优惠券列表：\n- 优惠券标题：麦旋风任选 \\\n  状态：已领取 \\\n  优惠券图片：\\\n    <img src=\"https://img.mcd.cn/cms/images/b4753dc54f708435.png\" alt=\"麦旋风任选\" height=\"auto\" width=\"300\">\n- 优惠券`
  - ↩︎ 返回：`{"type":"text","text":"# 您的优惠券列表\n\n共 14 张可用优惠券 | 第 1/1 页 | 每页 200 条\n\n## 麦旋风任选\n- **优惠**: ¥9.9 (用券价格)\n- **有效期**: 2026-10-05 10:30-2026-10-09 23:59 周一、二、三、四、五 10:30-23:59\n- **领取时间**: 4日前收到\n- **标签*`
### 🤖 WorkBuddy

可领的有 3 张，我先帮你领。

- 🔧 调用工具 `DeferExecuteTool`：`"{\"params\": {}, \"toolName\": \"mcp__mcd-mcp__auto-bind-coupons\"}"`
  - ↩︎ 返回：`{"type":"text","text":"### 领券结果\n\n总计: 3 张优惠券\n成功: 3 张\n失败: 0 张\n\n---\n\n#### 成功领取的优惠券：\n\n- 免费脆薯饼\n  - couponId：<REDACTED>\n  - couponCode：MCD<REDACTED>\n  - 图片：<img src=\"https://img.mcd.cn/cms/ima`
### 🤖 WorkBuddy

领到了。再刷新一次卡包，看看新券有效期和今天到期的券。

- 🔧 调用工具 `DeferExecuteTool`：`"{\"params\": {\"page\": \"1\", \"pageSize\": \"200\"}, \"toolName\": \"mcp__mcd-mcp__query-my-coupons\"}"`
  - ↩︎ 返回：`{"type":"text","text":"# 您的优惠券列表\n\n共 16 张可用优惠券 | 第 1/1 页 | 每页 200 条\n\n## 9.9元中杯冰美式\n- **优惠**: ¥9.9 (用券价格)\n- **有效期**: 2026-10-09 00:00-2026-10-15 23:59\n- **领取时间**: 今日收到\n- **标签**: 到店专用、外送专用\n\n<img`
### 🤖 WorkBuddy

券已经领好了，卡包从 14 张变成 16 张。下面是完整速览：

- 🔧 调用工具 `show_widget`：`"{\"loading_messages\": \"[\\\"读取卡包数据\\\",\\\"标记今日到期券\\\",\\\"整理有效期时间线\\\",\\\"渲染权益速览\\\"]\", \"title\": \"卡包权益速览与今日到期券\", \"widget_code\": \"<h2 class=\\\"sr-only\\\">卡包共 16 张可用券，`
  - ↩︎ 返回：`[{"type":"input_text","text":"{\"type\":\"visualizer_show_widget_result\",\"success\":true,\"title\":\"卡包权益速览与今日到期券\",\"widget_code\":\"<h2 class=\\\"sr-only\\\">卡包共 16 张可用券，其中麦旋风任选、薯薯任选两张今日到期</h2>\\n`
### 🤖 WorkBuddy

券都领好了。**可领 3 张，领取成功 3 张，失败 0 张**：

| 券名 | 结果 | 券码 |
|---|---|---|
| 免费脆薯饼 | 成功 | MCD<REDACTED> |
| 人气麦旋风买一送一 | 成功 | MCD<REDACTED> |
| 9.9 元中杯冰美式 | 成功 | MCD<REDACTED> |

卡包数量从 14 张涨到 **16 张**。

**今天（10-09 周五）到期的券 · 2 张，今晚 23:59 失效**

| 券名 | 用券价 | 可用时段 | 渠道 |
|---|---|---|---|
| 麦旋风任选 | ¥9.9 | 周一至周五 10:30-23:59 | 到店 + 外送 |
| 薯薯任选 | ¥9.9 | 周一至周五 10:30-23:59 | 到店 + 外送 |

现在是周五 17:29，两张券都在可用时段内 —— **想吃的话今晚就是最后机会，用完即止。**

**新领的两张**

- **9.9 元中杯冰美式**：10-09 → 10-15，到店/外送通用（这张从今天就能用）
- **人气麦旋风买一送一**：10-05 → 10-11 每天 10:00-22:00，仅到店

**后续还有 12 张按天生效的早餐券**（10-10 至 10-21），全部 05:00-10:29 到店专用：周末是巧克力味厚松饼猪柳蛋套餐 ¥29.9，工作日轮到火腿扒堡／芝香脆鸡扒堡／高达芝士蛋堡／大脆鸡扒堡两件套，各 ¥9.9。

⚠️ **一个要留意的点**：「免费脆薯饼」接口返回领取成功，但刷新卡包后**没看到它出现在券列表里**。可能是入账有延迟，或它属于另一种券类型不走卡包列表。建议你在麦当劳 App 的卡包里核对一下；如果确实没到，我可以帮你再查或重试。

需要的话我接着看这个月的活动日历（品鉴会之类）—— 说一声就行。

