# 研究 @mjasnikovs/pi-task

Status: Completed (2026-08-09 10:31)

## Scope

- Included: 研究 pi.dev 页面对应包的定位、安装与使用方式、源码结构、核心工作流、Pi 集成机制、发布状态及已确认的限制，并输出带来源的中文报告。
- Excluded: 安装该包、修改其上游源码或对未实际运行的行为作性能结论。

## Target

- [x] T1 报告以 pi.dev、上游源码、发布元数据和 Pi 官方资料等一手来源为证据，明确区分事实与推断。
- [x] T2 报告解释项目解决的问题、用户工作流、核心架构、状态持久化与 Pi 接入方式，并列出已确认的边界或限制。
- [x] T3 在 `docs/research/pi-task.md` 交付结构清晰、关键主张可追溯来源的中文 Markdown 报告。

## Plan

1. 从 pi.dev 定位发布包、上游仓库和当前版本。
2. 阅读上游文档、源码、测试、发布记录及相关 Pi 官方契约。
3. 交叉核验关键行为，撰写并检查报告。

## Result

- T1：报告查阅 pi.dev、npm registry、上游 README/LICENSE/CLA、源码、测试树、CI 与 Pi 官方扩展资料；正文逐项标注“源码确认”“上游声明”或“基于源码的推断”。独立核验确认 0.37.7 的 npm identity、gitHead 与 AGPL-3.0-only 元数据一致。
- T2：报告覆盖固定五阶段流水线、`/task`/`/task-plan`/`/task-auto` 用户路径、Markdown 状态模型、Pi 命令/工具/事件/UI 接入、验证与发布状态，并确认无认证 remote、live-model CI 缺口和发布文档 404 等边界。
- T3：已交付 `docs/research/pi-task.md`；结构检查确认六个必需一级章节，文件共 138 行、21,333 字节，`git diff --check` 通过。

Review gate: Skipped — no explicit user request
