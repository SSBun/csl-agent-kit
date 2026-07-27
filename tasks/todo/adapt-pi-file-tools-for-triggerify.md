# 让 Triggerify 识别 Pi 文件工具变更

Status: Completed (2026-07-27 18:37)

## Scope

- 包含：Pi adapter 对 `write`、`edit` 成功结果的标准 `changed_files` 映射及回归验证。
- 不包含：修改用户级 Triggerify 通知规则或通知脚本。

## Target

- [x] T1: Pi 的成功 `write`、`edit` 结果向 Triggerify 规则提供工作区相对路径及准确的 `created`、`modified` 操作。
- [x] T2: 失败、非文件工具及工作区外路径不会被误报为工作区文件变更。
- [x] T3: 相关 Triggerify 与 Pi 回归检查通过，且既有无关工作树改动保持不变。

## Plan

1. 固定当前基线并为 Pi 文件事件标准化补充回归覆盖。
2. 在现有宿主适配边界内实现最小映射，不把 Pi 原生输入泄漏给规则脚本。
3. 运行聚焦测试与适用的仓库校验，记录既有无关失败或残余风险。

## Result

- T1：`tests/pi-context-hooks.test.mjs` 通过真实 Triggerify `run-script` 捕获 Pi 标准事件，验证并行反序完成的 `edit` 与 `write` 分别产生工作区相对的 `modified`、`created`；adapter 已改用 facade `createEvent()` 并以 `ctx.cwd` 作为工作区。
- T2：同一回归用例确认失败文件工具和工作区外路径产生空 `changed_files`，非文件工具保持 `null`，且 `tool.success` 与结果一致。
- T3：TypeScript 严格类型检查、4 项 Pi context hook 聚焦测试、`npm test`、任务契约测试及 `git diff --check` 均通过；完整 `npm run test:pi` 的相关 4 项通过，仍有既有且无关的 `missing /ubiquitous-language` 失败。任务仅修改 adapter、对应测试、所属任务记录及 durable context，未覆盖其他工作树改动。
- Review gate: Skipped — 无显式或 critical 审查要求；虽涉及 Pi/Triggerify 集成和按调用保存状态，但成功、失败、路径边界及反序完成均有确定性回归覆盖，不存在 verification gap。
