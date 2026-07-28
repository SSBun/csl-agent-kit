# 让 Triggerify 识别 Pi 文件工具变更

Status: Completed (2026-07-28 13:37)

## Scope

- 包含：Pi adapter 对 `write`、`edit` 成功结果的标准 `changed_files` 映射，以及用户级任务通知规则对该映射的消费。
- 保留：Codex `apply_patch` 任务通知行为。
- 不包含：在 Pi TUI 内新增通知组件。

## Target

- [x] T1: Pi 的成功 `write`、`edit` 结果向 Triggerify 规则提供工作区相对路径及准确的 `created`、`modified` 操作。
- [x] T2: 失败、非文件工具及工作区外路径不会被误报为工作区文件变更。
- [x] T3: 相关 Triggerify 与 Pi 回归检查通过，且既有无关工作树改动保持不变。
- [x] T4: 用户级任务通知 Hook 能在 Pi 创建或修改 `tasks/todo/*.md` 后发送 macOS 通知，同时保留 Codex `apply_patch` 行为。

## Plan

1. 让现有通知规则接受 Pi 文件工具，并复用 adapter 已提供的标准变更信息。
2. 以脚本自检、规则状态和真实 Pi 文件修改验证跨宿主行为。

## Result

- T1：`tests/pi-context-hooks.test.mjs` 通过真实 Triggerify `run-script` 捕获 Pi 标准事件，验证并行反序完成的 `edit` 与 `write` 分别产生工作区相对的 `modified`、`created`；adapter 已改用 facade `createEvent()` 并以 `ctx.cwd` 作为工作区。
- T2：同一回归用例确认失败文件工具和工作区外路径产生空 `changed_files`，非文件工具保持 `null`，且 `tool.success` 与结果一致。
- T3：TypeScript 严格类型检查、4 项 Pi context hook 聚焦测试、`npm test`、任务契约测试及 `git diff --check` 均通过；完整 `npm run test:pi` 的相关 4 项通过，仍有既有且无关的 `missing /ubiquitous-language` 失败。任务仅修改 adapter、对应测试、所属任务记录及 durable context，未覆盖其他工作树改动。
- T4：`global:notify-todo-changed` 在 Pi 与 Codex 的 `show` 结果均为 active/valid/supported；脚本语法检查和自检通过，隔离的 notifier probe 分别以 Pi `edit` + `changed_files` 与 Codex `apply_patch` 事件各捕获一次通知。本任务完成状态的真实 Pi `edit` 作为最终系统通知验证。
- Review gate: Skipped — 无显式或 critical 审查要求；Pi/Triggerify 集成、路径边界和通知投递均可通过确定性自检及真实事件验证，不存在 verification gap。
