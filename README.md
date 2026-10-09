# 麦麦时光机 M-Moments

> 用**麦当劳中国 MCP**，做两件用户真想要的事：**回顾自己的麦麦足迹**（下单/消费/常去门店/最爱单品/「麦门人格」）和**不遗漏任何权益**（一键领券、临期提醒、积分与活动）。
> 提供两种形态：**浏览器插件**（开箱即用，无需配 Agent）与 **WorkBuddy / 通用 Agent Skill**（`SKILL.md`）。
> 非麦当劳官方产品，数据来自麦当劳中国 MCP。

[![Manifest V3](https://img.shields.io/badge/Chrome-MV3-ffc300)](https://developer.chrome.com/docs/extensions/mv3/)
[![MCP](https://img.shields.io/badge/MCP-mcd.cn-da291c)](https://open.mcd.cn/mcp)

## 为什么做这个

市面上的麦当劳 MCP 作品几乎都是「AI Agent Skill」，需要用户会配置 Agent 才能用，且清一色在回答**「下一单怎么点」**。麦麦时光机做了两件不一样的事：

1. **往回看**：把你的麦当劳消费足迹做成一份可截图的**个人报告**，还给出「麦门人格」——天然适合分享传播。
2. **换载体**：把能力做成一个**开箱即用的浏览器插件**，装完填 Token 就能用，覆盖不会配置 AI Agent 的普通消费者。

## 两种形态

| 形态 | 文件 | 面向 |
|---|---|---|
| **浏览器插件** | `src/`（Chrome / Edge, MV3） | 普通用户，零配置、可视化、可分享 |
| **Agent Skill** | `SKILL.md` | WorkBuddy / Cursor / Trae / Cherry Studio 等 |

## 功能

**① 我的足迹（个人报告）** — 依赖 `order-list` / `query-my-account`

- 近 30 天 / 近一年 切换
- 下单次数、消费总额、常去门店、涉及单品、最爱 Top3
- **麦门人格**（确定性规则生成）
- **复制分享文案** / **下载分享卡（PNG）** / **导出 HTML 报告**

**② 今日福利** — 依赖 `available-coupons` / `query-my-coupons` / `query-my-account` / `campaign-calendar`

- 可用积分、临期积分
- 可领取券 + **一键领券**（`auto-bind-coupons`）
- 我的券（含「今日到期」标签）
- 进行中的活动

**③ 每日提醒** — `chrome.alarms` + `chrome.notifications`

- 每天 9:00 提醒：可领券 / 今日到期券 / 临期积分
- 可选「提醒时自动领取全部可用券」（设置页开关）
- 设置页提供「立即测试提醒」

> 全部为**只读**工具 + 一个显式的「一键领券」动作，**不涉及下单、支付、积分消费**。

## 安装（浏览器插件，开发者模式）

1. 克隆本仓库到本地
2. 打开 Chrome/Edge → `chrome://extensions`（Edge 为 `edge://extensions`）
3. 打开右上角 **开发者模式**
4. **加载已解压的扩展程序** → 选择仓库中的 **`src/`** 目录
5. 点击工具栏的「麦麦时光机」图标（默认 **演示模式**，可先看效果）

## 配置真实数据

1. 在 [open.mcd.cn/mcp](https://open.mcd.cn/mcp) 手机号登录 → 「控制台」→「激活」→ 复制 MCP Token
2. 插件内点 **⚙ 设置**（或扩展列表 →「扩展程序选项」）
3. 粘贴 Token → **取消勾选「演示模式」** → 保存
4. 回到插件点 ↻ 刷新，徽标从「演示」变为「实时」

> 🔒 Token 仅保存在浏览器本地（`chrome.storage.local`），不上传、不入库、不落盘到项目。

## 在 WorkBuddy / Agent 中使用

把 `SKILL.md` 作为技能导入（或直接把其内容粘给 Agent），并在 WorkBuddy 的「连接器」里配置麦当劳 MCP（见 `mcp-config.example.json`）。之后即可用自然语言触发，例如：

- 「看看我近一年的麦当劳足迹」
- 「帮我领一下能领的券」

## 技术栈

- **原生 ES Module JavaScript + MV3**，**零构建**，加载解压目录即可运行
- MCP：`Streamable HTTP` + `JSON-RPC 2.0`（`initialize → notifications/initialized → tools/call`），见 `src/lib/mcp-client.js`
- 真实返回是 **Markdown/JSON 混合文本**，解析见 `src/lib/parse.js`（含单测）
- 演示模式内置 fixtures，无 Token 也能完整走通 UI
- Node ≥18 仅用于本地测试

## 开发

```bash
# 单元测试
npm test

# 真实 MCP 冒烟测试（Token 从环境变量读取，不会打印）
# PowerShell:
$env:MCD_MCP_TOKEN="<your-token>"; npm run smoke
# bash:
MCD_MCP_TOKEN=<your-token> npm run smoke

# 抓取真实返回格式到 .debug/（本地，gitignored）
npm run probe && npm run verify
```

## 目录结构

```
mcradar/
├─ src/                       # 插件本体（加载此目录）
│  ├─ manifest.json
│  ├─ background/service-worker.js   # MCP 调用网关
│  ├─ lib/                    # mcp-client / config / tools / parse / report / mock
│  ├─ popup/                  # 主界面（我的足迹 / 今日福利）
│  └─ options/                # 设置页（填写 Token）
├─ SKILL.md                   # WorkBuddy / 通用 Agent Skill 形态
├─ scripts/                   # smoke / probe / verify
├─ tests/                     # 单元测试
├─ mcp-config.example.json    # 脱敏 MCP 配置示例（仅占位符）
├─ MCP_INTEGRATION.md         # 使用的 MCP Server / Tool / 调用流程
└─ CONTEST_DECLARATION.md     # 参赛声明（官方原文）
```

## 隐私与合规

- 仅调用只读工具与「一键领券」，不代下单、不代支付
- Token 仅存本地，仓库内不含任何真实凭证（`mcp-config.example.json` 只用 `${MCD_MCP_TOKEN}` 占位）
- 本项目为 2026 麦当劳程序员创意开发大赛参赛作品，非官方产品；输出仅供参考

## License

MIT
