# @mjasnikovs/pi-task 研究报告

> 查阅范围：npm dist-tag `latest` 指向的 0.37.7、GitHub `main` 分支，以及 Pi 当前文档。本文没有安装或运行该扩展；所有行为描述均标注为“源码确认”“上游声明”或“基于源码的推断”。

## Summary

`@mjasnikovs/pi-task` 是给 Earendil Pi coding agent 使用的 TypeScript 扩展，解决本地模型在复杂任务中容易跳步、丢上下文和臆造 API 的问题。它不是简单的待办列表：核心是把 `/task` 固定为 `refine → research → grill → compose → critique` 五阶段规格生成流水线，将每个阶段写入项目内 `.pi-tasks/`，再把最终 spec 作为后续用户消息交回 Pi 主会话执行；此外还提供多任务编排、验证/规范门禁、远程 Web UI 和四个隔离 worker 工具。[上游 README](https://github.com/mjasnikovs/pi-task/blob/main/README.md) [流水线源码](https://github.com/mjasnikovs/pi-task/blob/main/src/task/orchestrator.ts)

适合希望用本地模型得到可恢复、可审计、较确定的规划/实施流程的 Pi 用户；代价是实现面很大、会产生多个子会话和本地状态，并可能执行命令、修改工作区、提交 Git、启动无认证 LAN/Tailscale Web 服务。是否采用应先评估 AGPL-3.0-only、运行时成本及远程端口暴露风险。[许可证正文](https://github.com/mjasnikovs/pi-task/blob/main/LICENSE) [README 的 Remote/Settings 说明](https://github.com/mjasnikovs/pi-task/blob/main/README.md#remote--drive-a-task-from-your-phone)

## Key facts

| 项目 | 结论 | 证据性质 |
| --- | --- | --- |
| 完整 npm identity | `@mjasnikovs/pi-task`（scoped package，不能与未加 scope 的同名项目混淆） | **源码/registry 确认**：[npm registry 元数据](https://registry.npmjs.org/@mjasnikovs%2Fpi-task) |
| 当前版本 | 查阅时 npm `dist-tags.latest`、仓库 `package.json` 与 Pi 包页面均为 **0.37.7** | **registry/源码/Pi 页面确认**：[registry](https://registry.npmjs.org/@mjasnikovs%2Fpi-task)、[package.json](https://github.com/mjasnikovs/pi-task/blob/main/package.json)、[Pi 页面](https://pi.dev/packages/@mjasnikovs/pi-task) |
| 上游仓库 | `https://github.com/mjasnikovs/pi-task`；npm 的 repository/homepage/bugs 均指向该仓库 | **registry 确认**：[registry](https://registry.npmjs.org/@mjasnikovs%2Fpi-task) |
| 作者 | package manifest：`mjasnikovs <mjasnikovs@googlemail.com>` | **源码确认**：[package.json](https://github.com/mjasnikovs/pi-task/blob/main/package.json) |
| 许可证 | **AGPL-3.0-only**；README 另称贡献受 CLA 约束，并可联系作者取得商业许可 | **源码确认 + 上游声明**：[LICENSE](https://github.com/mjasnikovs/pi-task/blob/main/LICENSE)、[README License](https://github.com/mjasnikovs/pi-task/blob/main/README.md#license) |
| 安装 | `pi install npm:@mjasnikovs/pi-task` | **Pi 页面/上游声明**：[Pi package page](https://pi.dev/packages/@mjasnikovs/pi-task)、[README](https://github.com/mjasnikovs/pi-task/blob/main/README.md#install) |
| Pi 兼容性 | peer dependencies 要求 `@earendil-works/pi-coding-agent`、`pi-agent-core`、`pi-tui` 均 `>=0.80.0` | **源码确认**：[package.json](https://github.com/mjasnikovs/pi-task/blob/main/package.json) |
| 包入口 | Pi manifest 声明 `pi.extensions = ["dist/index.js"]`；npm 包发布 `dist`、`assets`、README、LICENSE | **源码确认**：[package.json](https://github.com/mjasnikovs/pi-task/blob/main/package.json) |
| 主要技术 | ESM TypeScript；生产依赖包括 TypeBox、linkedom、Readability、Turndown、ws、qrcode、web-push | **源码确认**：[package.json](https://github.com/mjasnikovs/pi-task/blob/main/package.json) |

没有把下载量写作稳定事实：它是实时指标，且 Pi 页面与 npm 搜索结果可能缓存不同时间窗口。

## How it works / Structure

### 1. 核心调用流

**源码确认：** npm/Pi 加载 `dist/index.js` 后，默认导出函数接收 `ExtensionAPI`，依次注册配置、单任务、多任务、交互规划、worker、remote、thinking compression、命令超时 watchdog 和流停滞 watchdog。[`src/index.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/index.ts)

单任务主路径为：

1. `/task <prompt>` 进入 `registerTask` 注册的 handler；根据配置选择普通 `runSingleTask` 或带 verify/enforce gates 的 `runGatedTask`。[`orchestrator.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/orchestrator.ts)
2. 新任务通过 `allocateTaskId` 分配 `TASK_NNNN`，立即写入 raw prompt 和 YAML front matter；恢复任务则读取既有 front matter 的 `phase`，把状态改回 `in_progress`。[`task-io.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/task-io.ts) [`orchestrator.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/orchestrator.ts)
3. `TaskRunner` 按 `PHASES` 配置表顺序运行五阶段；每阶段完成即写对应 Markdown section，并更新 front matter。取消只在安全检查点退出，因此文件仍可恢复。[`phases.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/phases.ts) [`orchestrator.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/orchestrator.ts)
4. `research` 会组织项目文件、API、上下文、工具链等隔离 worker，并做外部资料补充与 tooling 验证；最终 `compose` 生成 spec，`critique` 判断是否需要重写。具体提示词和大量确定性校验分散在 `phases.ts` 及 `src/task/*` 模块。[`phases.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/phases.ts)
5. spec 必须含可解析的 `VERIFY` block，否则任务失败；通过后任务文件标为 `completed/done`，写 phase timings 与 handoff，再用 `sendUserMessage(..., {deliverAs: "followUp"})` 交给主 Pi 会话实施。[`orchestrator.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/orchestrator.ts)

**基于源码的推断：**“deterministic”主要指阶段顺序、持久化边界和若干校验/恢复规则由代码固定，不表示 LLM 阶段输出本身可复现；模型、工具、网络和工作区变化仍会导致结果不同。

### 2. 任务数据模型与持久化

**源码确认：**普通任务 front matter 为：

- `id: string`
- `state: pending | in_progress | completed | failed | cancelled`
- `phase: refine | research | grill | compose | critique | done`
- `created_at`、`updated_at`、`title`
- 可选 `label`、`reason`

可恢复状态为 `in_progress`、`pending`、`cancelled`、`failed`。[`task-types.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/task-types.ts)

任务默认保存在 `<cwd>/.pi-tasks/TASK_NNNN.md`。正文逐步形成 `raw prompt`、`refined prompt`、`research`、`grill Q&A`、`spec`、`phase timings`、`handoff`、可选 `gates` 等 section。写入使用 Node `fs/promises`；目录会带一个 `.ignore`，让 fd/ripgrep 跳过任务状态，但该文件**不会**让 Git 忽略它，所以是否提交仍由用户的 `.gitignore` 决定。需注意，普通任务的 `completed/done` 首先在 **spec handoff 前**写入；启用默认 verify/enforce gates 时，外层流程继续等待实施与门禁，失败后再把任务降为可恢复的 `failed`，因此不能脱离 `gates` 记录把这一瞬时状态解释成“代码已验证完成”。[`task-io.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/task-io.ts) [`orchestrator.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/orchestrator.ts) [README Configuration](https://github.com/mjasnikovs/pi-task/blob/main/README.md#configuration)

`/task-auto` 使用同类 front matter 的 `TASK_AUTO_NNNN.md`，正文包含 feature prompt、clarifications、Markdown checkbox task list 和可选 coverage；每个子项开始时会盖上生成的 `TASK_NNNN` id，完成后勾选。恢复游标就是“第一个未勾选项”，而非另建数据库。[`auto-io.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/auto-io.ts)

另有非任务 Markdown 状态：全局设置持久化到 `~/.config/pi-task/config.json`；docs worker 使用 SQLite cache；push subscriptions/VAPID key 使用 XDG data 目录。后两项由上游 README 声明，本文未运行验证。[README Settings/Configuration](https://github.com/mjasnikovs/pi-task/blob/main/README.md#settings--task-config)

### 3. 核心模块

- `src/index.ts`：扩展 composition root，注册全部子系统。**源码确认**。[源码](https://github.com/mjasnikovs/pi-task/blob/main/src/index.ts)
- `src/task/orchestrator.ts`：`TaskRunner`、`/task`、list/resume/cancel、spec handoff、单任务 gates 接线。**源码确认**。[源码](https://github.com/mjasnikovs/pi-task/blob/main/src/task/orchestrator.ts)
- `src/task/phases.ts`：五阶段实现、研究 fan-out、tooling/API 事实校验、grill/compose/critique。**源码确认**。[源码](https://github.com/mjasnikovs/pi-task/blob/main/src/task/phases.ts)
- `src/task/task-types.ts`、`task-io.ts`、`task-parsers.ts`：状态机、Markdown front matter/section I/O 与解析。**源码确认**。[types](https://github.com/mjasnikovs/pi-task/blob/main/src/task/task-types.ts) [I/O](https://github.com/mjasnikovs/pi-task/blob/main/src/task/task-io.ts)
- `src/task/auto-orchestrator.ts`、`auto-io.ts`：多任务澄清、分解、顺序执行、checkbox 恢复。**源码确认**。[orchestrator](https://github.com/mjasnikovs/pi-task/blob/main/src/task/auto-orchestrator.ts) [I/O](https://github.com/mjasnikovs/pi-task/blob/main/src/task/auto-io.ts)
- `src/workers/*`：注册 `pi-worker`、`pi-worker-search`、`pi-worker-fetch`、`pi-worker-docs`；分别用于隔离代码调查、搜索、网页提取和已安装 npm 类型/README 检索。**源码确认注册；能力细节为上游声明。**[`workers/index.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/workers/index.ts) [README Bundled tools](https://github.com/mjasnikovs/pi-task/blob/main/README.md#bundled-tools)
- `src/remote/*`：HTTP/WebSocket UI、桥接、本地/远程 first-answer-wins、QR/Tailscale、Web Push。**源码目录确认；用户能力为上游声明。**[remote register](https://github.com/mjasnikovs/pi-task/blob/main/src/remote/register.ts) [README Remote](https://github.com/mjasnikovs/pi-task/blob/main/README.md#remote--drive-a-task-from-your-phone)
- `src/task/*gate*`、`verify-work.ts`、`enforce-guidelines.ts`、`auto-commit.ts`：实施后验证、最终集成检查、规范执行和逐任务提交。**源码确认；`verifyWork`、`enforceGuidelines` 与 `autoCommit` 默认开启。**[源码树](https://api.github.com/repos/mjasnikovs/pi-task/git/trees/main?recursive=1) [`config.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/config/config.ts) [README Settings](https://github.com/mjasnikovs/pi-task/blob/main/README.md#settings--task-config)

## User workflow / Pi integration

### 命令与 UI 工作流

**上游声明（未实际运行）：**

- `/task <prompt>`：完整五阶段并把 spec 交回当前聊天。
- `/task-plan <prompt>`：在执行前一次问一个决策问题；可回答、反问模型或立即执行，规划期只允许 read，并把 decisions/notes 写入 `TASK_PLAN_NNNN.md`。
- `/task-list`：在 editor dialog 展示任务列表。
- `/task-resume [id]`：恢复指定或最近未完成任务。
- `/task-cancel`：软终止当前任务，仍可恢复。
- `/task-auto <feature>`：先澄清和分解为标题，再逐项调用完整 `/task`；默认顺序、阻塞，无子任务重叠。
- `/task-auto-resume [--unattended]`、`/task-auto-cancel`：恢复或停止自动循环。
- `/task-config`：TUI editor dialog 修改 remote、thinking compression、auto-commit、verify/enforce、research、timeouts、yolo、debug、工具/扩展白名单等。
- `/remote`：显示 QR 和连接 URL；浏览器可观看状态、回答 grill/clarify、发命令和消息。

完整命令表与 UI 描述见[上游 README](https://github.com/mjasnikovs/pi-task/blob/main/README.md#slash-commands)。

### Pi 扩展 API 接入

**源码确认：**

- package manifest 通过 `pi.extensions: ["dist/index.js"]` 声明入口。[`package.json`](https://github.com/mjasnikovs/pi-task/blob/main/package.json)
- 默认导出接收 `ExtensionAPI`，符合 Pi 官方扩展 factory 约定；官方文档说明扩展可用 `registerCommand`、`registerTool`、生命周期 events 和 `ctx.ui`。[Pi 官方 Extensions 文档](https://pi.dev/docs/latest/extensions) [`src/index.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/index.ts)
- 命令经项目自己的 `registerBridgeCommand` 包装后落到 Pi command API，同时把本地 TUI 与 remote browser 输入桥接起来。[`orchestrator.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/orchestrator.ts) [`remote/bridge.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/remote/bridge.ts)
- worker 最终通过 `pi.registerTool()` 注册；工具 schema 使用 TypeBox。[`workers/index.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/workers/index.ts) [Pi 官方 Extensions 文档](https://pi.dev/docs/latest/extensions)
- `TaskRunner` 使用 `ctx.ui` 的 notify/editor/widget 类能力展示列表、状态和问题；用 `AbortController` 取消子流程；用 `ctx.newSession()`、`waitForIdle()` 隔离/等待实施会话；用 `pi.sendUserMessage` 或 replacement-session context 的 `sendUserMessage` 将 spec 作为 `followUp` 触发实施。[`orchestrator.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/orchestrator.ts) [Pi 官方 API 类型](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts)
- thinking compression、command watchdog、stream watchdog 和 remote 还订阅 Pi lifecycle/tool/input events；这是扩展级接入，不是外部 MCP server。主 README 所称“MCP-style worker tools”应理解为工具交互风格，而非已确认独立 MCP transport。[`src/index.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/index.ts)

## 测试和发布状况

- **源码确认：**仓库使用 Bun + TypeScript；scripts 为 `bun run test`、`bun run lint`、`bun run build`，发布前执行 build。[`package.json`](https://github.com/mjasnikovs/pi-task/blob/main/package.json)
- **上游声明：**README 当前写有“3028 tests across 173 files”，badge 写“3025 passing”；前者是总测试数，后者是 passing 数，并非相互矛盾。本文未运行测试，因此这些数字只作为上游声明。[README Development](https://github.com/mjasnikovs/pi-task/blob/main/README.md#development)
- **源码/API 确认：**CI 在 push 到 `main` 和 PR 上运行；Linux/Windows 执行 build 与测试，另有 Node 22.19/24 的发布构建 smoke。0.37.7 对应 commit `0fc5751` 的 CI run 31215215242 为 `success`；但 workflow 明确通过 `PI_SKIP_SMOKE=1` 跳过 live-model smoke，因此该成功不能证明真实模型端到端行为。[CI workflow](https://github.com/mjasnikovs/pi-task/blob/main/.github/workflows/ci.yml) [CI run 31215215242](https://github.com/mjasnikovs/pi-task/actions/runs/31215215242)
- **registry 确认：**npm 已有连续多个版本，查阅时 latest 为 0.37.7，发布物提供编译后的 `dist/index.js`。[npm registry](https://registry.npmjs.org/@mjasnikovs%2Fpi-task)
- **API 查询事实（瞬时）：**GitHub Releases API 查阅时返回空数组，说明没有 GitHub Release 对象；版本发布看起来以 npm + package version commit 为主。该结论不代表未来不会添加 release。[GitHub Releases API](https://api.github.com/repos/mjasnikovs/pi-task/releases?per_page=5)
- **API 查询事实（瞬时）：**GitHub open issues API 查阅时返回空数组；这不是“没有已知缺陷”的证明，已关闭 issue、PR、提交注释和 README/VALIDATION-DEBT 仍记录过问题。[Open issues API](https://api.github.com/repos/mjasnikovs/pi-task/issues?state=open&per_page=10)

## Open questions / Limitations

1. **未做运行验证。** 本报告没有安装 0.37.7、没有连接真实 Pi/local model，也没有验证五阶段耗时、恢复、remote first-answer-wins、push、auto-commit、verify/enforce 的实际效果。
2. **发布文档链接失效。** README 称设计文档位于 npm 包的 `docs/`，但 `package.json` 的发布白名单不包含该目录，查阅时对应 jsDelivr URL 返回 404；当前只能从 README、源码和提交历史重建设计背景。[README Development](https://github.com/mjasnikovs/pi-task/blob/main/README.md#development) [`package.json`](https://github.com/mjasnikovs/pi-task/blob/main/package.json) [0.37.7 docs URL](https://cdn.jsdelivr.net/npm/@mjasnikovs/pi-task@0.37.7/docs)
3. **端到端模型覆盖有限。** CI 明确跳过 live-model smoke；大量单元/集成测试并不等价于不同本地模型/provider 上的稳定表现。[CI workflow](https://github.com/mjasnikovs/pi-task/blob/main/.github/workflows/ci.yml)
4. **安全边界较宽。** remote 默认开启，源码把 HTTP/WebSocket server 绑定到 `0.0.0.0`，且没有认证；任何能访问该端口的客户端都可查看会话并发送消息、命令或中断。worker/gates 可获得 `bash`，部分流程可编辑、提交或回滚。只应在可信 LAN/Tailscale 边界使用，或先在 `/task-config` 关闭 remote。[`config.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/config/config.ts) [`remote/server.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/remote/server.ts) [README Remote](https://github.com/mjasnikovs/pi-task/blob/main/README.md#remote--drive-a-task-from-your-phone)
5. **许可证适配需法律判断。** AGPL-3.0-only 对修改、分发及网络交互版本的义务不能仅靠 README 摘要判断；组织或托管场景应由法律/合规人员审阅 LICENSE 和 CLA。[LICENSE](https://github.com/mjasnikovs/pi-task/blob/main/LICENSE) [CLA](https://github.com/mjasnikovs/pi-task/blob/main/CLA.md)
6. **复杂度与成本未知。** 仓库源码和测试面很大，research fan-out、重新生成、验证及最终 gates 会增加 token、GPU 与墙钟成本；尚无本次独立 benchmark 可量化相对于普通 Pi 会话的收益。
7. **CHANGELOG 缺失。** 查阅的仓库树没有发现顶层 CHANGELOG，GitHub Releases API 也为空；逐版本变化需追踪 commits/npm metadata，升级审计不够集中。[仓库树](https://api.github.com/repos/mjasnikovs/pi-task/git/trees/main?recursive=1) [Releases API](https://api.github.com/repos/mjasnikovs/pi-task/releases?per_page=5)

## Sources

### 保留的一手来源

- [Pi package page](https://pi.dev/packages/@mjasnikovs/pi-task) — Pi 生态身份、安装命令与查阅时版本。
- [npm registry package document](https://registry.npmjs.org/@mjasnikovs%2Fpi-task) — authoritative dist-tag、版本、发布物 metadata、仓库和许可证字段。
- [上游 package.json](https://github.com/mjasnikovs/pi-task/blob/main/package.json) — 当前源码版本、入口、Pi manifest、peer/runtime dependencies、scripts、license。
- [上游 README](https://github.com/mjasnikovs/pi-task/blob/main/README.md) — 作者声明的目标、命令、UI、配置、remote、测试数量和开发方式。
- [上游 LICENSE](https://github.com/mjasnikovs/pi-task/blob/main/LICENSE) 与 [CLA](https://github.com/mjasnikovs/pi-task/blob/main/CLA.md) — 实际法律文本与贡献安排。
- [上游源码树](https://api.github.com/repos/mjasnikovs/pi-task/git/trees/main?recursive=1) — 模块、测试和 CHANGELOG/工作流存在性核对。
- [`src/index.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/index.ts)、[`orchestrator.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/orchestrator.ts)、[`phases.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/phases.ts)、[`task-types.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/task-types.ts)、[`task-io.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/task-io.ts)、[`auto-io.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/task/auto-io.ts)、[`workers/index.ts`](https://github.com/mjasnikovs/pi-task/blob/main/src/workers/index.ts) — 入口、调用流、模型与持久化的直接证据。
- [CI workflow](https://github.com/mjasnikovs/pi-task/blob/main/.github/workflows/ci.yml) — 实际 CI 平台、命令和 live-model skip。
- [GitHub Releases API](https://api.github.com/repos/mjasnikovs/pi-task/releases?per_page=5) 与 [Open issues API](https://api.github.com/repos/mjasnikovs/pi-task/issues?state=open&per_page=10) — 查阅时的发布/问题状态。
- [Pi 官方 Extensions 文档](https://pi.dev/docs/latest/extensions) 与 [Extension API types](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts) — `ExtensionAPI`、command/tool/UI/events/`sendUserMessage` 的官方语义。

### 未采用的来源

- npm.io、Libraries.io、jsDelivr 展示页及第三方博客：可能缓存旧版本或转述 README；identity/version/license 均可由 npm registry 和上游仓库直接确认。
- 搜索结果中的下载量：实时且不同页面窗口/缓存不一致，不写作稳定事实。
