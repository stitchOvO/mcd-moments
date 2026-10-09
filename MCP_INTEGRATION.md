# MCP 集成说明（MCP_INTEGRATION）

本文件说明 **麦麦福利雷达 McRadar** 实际使用的麦当劳 MCP Server、Tool、调用流程与业务价值。

## 1. 使用的 MCP Server

| 项目 | 值 |
|---|---|
| 名称 | 麦当劳中国 MCP Server（远程托管） |
| 接入地址 | `https://mcp.mcd.cn` |
| 传输协议 | Streamable HTTP |
| 认证方式 | 请求头 `Authorization: Bearer <MCP_TOKEN>` |
| 协议版本 | `2025-06-18`（JSON-RPC 2.0） |
| 官方文档 | https://github.com/M-China/mcd-mcp-server |

## 2. 调用的 Tool 清单

| Tool | 用途 | 读/写 |
|---|---|---|
| `now-time-info` | 获取当前时间，用于临期券/积分与报告区间判断 | 读 |
| `order-list` | 拉取历史订单，生成「麦麦足迹」报告 | 读 |
| `available-coupons` | 查询当前可领取的「麦麦省」券列表 | 读 |
| `query-my-coupons` | 查询账户下已领取且可用/临期的券 | 读 |
| `query-my-account` | 查询积分账户（可用/累计/临期积分） | 读 |
| `campaign-calendar` | 查询进行中/预告的营销活动 | 读 |
| `auto-bind-coupons` | 一键领取全部当前可用券（唯一写动作） | 写 |

> 明确**不调用** `create-order` / `calculate-price` / `draw-lottery` / `mall-create-order` 等交易类工具，本项目不代下单、不代支付。

## 3. 调用流程

```
Popup (popup.js)
   │  chrome.runtime.sendMessage({type:'benefits:load'})
   ▼
Service Worker (background/service-worker.js)         ← MCP Token 只在此上下文使用
   │  loadBenefits()
   ▼
tools.js  ──►  mcp-client.js  ──►  POST https://mcp.mcd.cn
                                    │
                                    ├─ 1) initialize                → 返回 Mcp-Session-Id
                                    ├─ 2) notifications/initialized
                                    └─ 3) tools/call ×N（并发）
                                           now-time-info
                                           available-coupons
                                           query-my-coupons
                                           query-my-account
                                           campaign-calendar
   ◄── 归一化为统一 view model（account / claimable / mine / campaigns）
```

「我的足迹」报告为独立动作：

```
popup「我的足迹」 → service worker → loadReport({ days })
   ├─ order-list        （历史订单）
   └─ query-my-account  （积分资产）
   ◄── report.js 聚合：下单次数 / 消费 / 常去门店 / 最爱单品 / 麦门人格
```

一键领券为独立动作：

```
popup「一键领券」 → service worker → tools.callTool('auto-bind-coupons', {})
   → 成功后重新 loadBenefits() 刷新界面
```

### 关键实现细节

- **Streamable HTTP 双编码**：服务端可能返回 `application/json`，也可能返回 `text/event-stream`（SSE）。客户端两者都解析，见 `parseSse()`。
- **会话头**：`initialize` 响应返回的 `Mcp-Session-Id` 会被后续所有请求携带。
- **限流**：每个 Token 每分钟最多 600 次请求，超限返回 `429`；客户端按 HTTP 状态码抛出可读错误。
- **错误码**：`401` = Token 无效/过期；`429` = 触发限流。二者在 Popup 中以警告形式提示。
- **只读优先**：除「一键领券」外全部为只读调用，最小化权限面。

## 4. 业务价值

- 把分散在会员中心/小程序里的**券、积分、活动**聚合到浏览器一个入口，**降低用户找券成本**。
- 「一键领券」把「记得领券」这件反人性的事变成一键动作，直接提升权益使用率。
- 以**独立插件**形态交付，覆盖不会配置 AI Agent 的普通消费者，扩大 MCP 能力的触达人群。
