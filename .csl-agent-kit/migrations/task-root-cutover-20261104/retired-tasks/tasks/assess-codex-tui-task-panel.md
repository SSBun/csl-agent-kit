# 评估 Codex TUI 插件任务面板可行性

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-23 15:47) |
| Kind | Task |

## Target
- [x] T1: 对照当前 Codex 插件能力与 Pi 面板实现，说明任务面板可行范围、限制和建议路径。

## Scope

仅探索可行性，核对本会话 codex_tui 接口、实际安装的 Codex CLI、官方插件／UI／配置／App Server 文档及当前 Pi 面板源码。不创建面板、安装插件、改变会话标题或修改产品代码。

## Plan

1. 核对本地宿主与当前会话可用工具，并读取官方能力说明。
2. 对照 Pi 的宿主 UI 挂载和刷新实现，区分任务数据能力与终端渲染能力。
3. 给出当前限制与最小替代路径，说明证据边界。

## Decisions

2026-10-23 的观察：本地 codex --version 输出 0.163.0；当前会话 codex_tui 工具包括会话创建／读取／列出／发消息／重命名／归档、等待及 worktree 管理，没有 registerWidget、setWidget 或任意 TUI 布局挂载接口。没有因能力询问而创建真实 Codex thread、worktree 或修改用户配置。

当前 [Pi 面板源码](../../pi/extensions/csl-task-overlay.ts) refresh() 通过 ctx.ui.setWidget(..., { placement: "aboveEditor" }) 注册组件，并原位 setLines；session_start 启动刷新定时器，task_focus 记录会话关联。因此 Pi 的常驻效果依赖宿主提供终端 UI 插槽。任务状态和 Target 进度来自 canonical Task Markdown，显示层与数据层可分别复用。

已检索并实际读取的官方来源：

- [Plugins](https://developers.openai.com/codex/plugins)：插件可提供 Skills、MCP servers、browser capabilities 与 Hooks，CLI 有插件浏览／安装能力；没有在该文档中公开 Pi 风格的终端组件注册接口。
- [MCP UI](https://developers.openai.com/plugins/build/chatgpt-ui)：UI 资源通过 MCP Apps 返回，文档明确描述 ChatGPT 中的 iframe；其他宿主须支持相应渲染能力。
- [Plugin Extensions](https://developers.openai.com/plugins/build/extensions)：sidebar／conversation panels 是 ChatGPT 的扩展表面，不能据此证明 Codex CLI 可挂载相同面板。
- [Config reference](https://developers.openai.com/codex/config-reference)：tui.status_line 和 tui.terminal_title 公开为 item identifiers 数组，可选择／排序预设字段；未查到自定义任务列表组件或文件数据绑定接口。
- [App Server](https://developers.openai.com/codex/app-server)：支持自建丰富客户端，提供历史、审批及流式 Agent 事件；这可作为将来完整自定义界面的基础，不等同于给现有 TUI 安装一个 widget 插件。

结论限定为当前公开文档和本会话实际接口：可以通过 Skills／MCP 读取、汇总、更新任务数据，但未找到能直接向现有 Codex TUI 挂载 Pi 式固定面板的公开插件 API；这不是对所有私有或未来宿主能力的绝对否定。最小建议是外置只读任务视图，放在终端分屏或独立窗口，继续以现有 canonical Task 数据为权威；需要完整自定义界面时再评估 App Server 客户端。按需 MCP 文本输出和内置状态栏不能自动获得任意常驻布局能力。

证据边界：核对了实际版本、工具 schema、插件 manifest、Pi 源码和官方文档；未开发／安装原型、未测试 TUI 渲染。新发现属于外部产品的当前能力，保留在本任务而不缓存到 Project Context；Pi Pack 的 UI 与数据所有权陈述仍与源码一致，无需维护。宿主未提供 task_focus 工具，任务记录已激活而未宣称宿主焦点绑定成功。

## Task Summary

本任务没有修改代码、插件、配置或组件，仅维护本任务记录与精确索引项。

## Result

- T1: 已对照本地 Codex CLI 0.163.0、本会话 codex_tui 工具 schema、Pi refresh/setWidget 与官方 Plugins/MCP UI/Extensions/Config/App Server 文档；结论限定为当前公开接口无 Pi 式 TUI widget 挂载能力，任务数据可复用，建议外置视图，完整客户端可评估 App Server。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R0
- State: Current
- Reason: 只读能力调查，无交付物代码或配置修改，仅任务生命周期记录；无显式或既有独立审查义务。
- Snapshot: no-file-analysis:2026-10-23; Decisions official source URLs and tool schema inventory; Pi overlay sha256 12927bfddd2a8f3ce48a6ba195b797adb323655c530f0d9c72a31b137411603e; manifest sha256 ffe5f1ed5026cd536bc9d03314a6bb374822fd94a97dffaacd84b7ffda2101cd
- Evidence: 自检已将 T1 与用户询问逐项核对，实际读取官方页面及 Pi 源码，将公开接口观察与缺少 API 的推断分开；未将 ChatGPT iframe 扩展当成 Codex TUI 能力，未改变产品或用户设置。
- Task fingerprint: d48926ab4bf13657ebf4660edcc331f827efd946c58b88d4e75c71ebc69daba1

## Verification

- Passed: sync/check valid；完成前复核 Pi 的 aboveEditor 挂载、当前 codex_tui 工具清单和官方 status_line/插件 UI 描述一致；无产品改动，未运行测试或开发原型。宿主没有 task_focus，已披露。
