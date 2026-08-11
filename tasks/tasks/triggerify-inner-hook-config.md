# Triggerify inner hook 用户配置

Status: Completed (2026-07-27 18:22)

## Scope

- 包含：在 `~/.csl-agent-kit/triggerify/config.json` 持久化 inner hook 禁用列表，并让 CLI 与运行时读取同一状态。
- 包含：把终端标题 hook 迁移为内置 `inner:refresh-tab-title`，删除重复的 global 规则。
- 包含：在同一配置文件保存每个 inner hook 的设置，并只向对应脚本传递其配置。
- 不包含：允许用户修改或删除 inner hook 源文件，或改变 global/project hook 的 enable/disable 行为。

## Target

- [x] T1: 配置缺失或 `disabledHooks` 为空时，所有 inner hooks 默认启用；无效配置只让 inner hooks fail-closed，并产生可诊断状态。
- [x] T2: `list`/`show` 展示 inner hook 的默认、禁用覆盖和最终状态；`disable` 添加禁用项，`enable` 移除禁用项。
- [x] T3: inner hook 源文件继续禁止 create/update/delete，global/project 行为保持兼容。
- [x] T4: 终端标题规则以 `inner:refresh-tab-title` 运行且默认启用，原 `global:refresh-tab-title` 规则不再存在。
- [x] T5: Triggerify 聚焦测试、skill 校验和资源边界检查通过，或仅保留规则允许的 Yao token-budget 非阻塞项。
- [x] T6: `config.json` 可选保存按 qualified inner ID 分组的 hook settings，enable/disable 更新时不会丢失这些设置。
- [x] T7: Triggerify 只通过 `TRIGGERIFY_HOOK_CONFIG` 向当前脚本传递其 settings，不改变现有 stdin event payload。
- [x] T8: 标题脚本使用用户配置的 `provider/model`，未配置或值无效时回退 `deepseek/deepseek-v4-flash`。
- [x] T9: 新数据流有聚焦测试，并重新通过 Triggerify 与 Yao 校验。

## Plan

1. 扩展 inner config schema，并在 discover 时解析当前 hook settings。
2. 通过脚本环境变量传递配置，让标题脚本选择配置模型并保留默认回退。
3. 验证配置保留、运行时隔离与标题选择，然后重新执行审查。

## Result

- T1: 自动测试覆盖配置缺失/空数组默认启用、无效 JSON 时 inner hooks 全部 inactive 并返回 `inner:config-invalid`，同时 global hook 仍正常执行。
- T2: `disable inner:refresh-tab-title` 实测显示 `Override: disabled` / `Effective: inactive`，`enable` 后恢复 `Override: none` / `Effective: active`；[`config.json`](file:///Users/caishilin/.csl-agent-kit/triggerify/config.json) 为 `0600` 且当前 `disabledHooks` 为空。
- T3: `create`/`update`/`delete inner:*` 回归测试继续拒绝源文件变更；Triggerify 测试 27/27 通过，CLI 既有 global/project 测试未回归。
- T4: `show inner:refresh-tab-title --host pi` 显示 enabled/valid/supported/active；`prompt-submit` 端到端执行 39ms、无诊断，原 global 规则已由 CLI 删除，其脚本按 Triggerify 安全约定保留。
- T5: `npm run test:triggerify`、Node 语法检查和标题脚本 self-test 通过；Yao validate 的结构、lint、governance 均通过，唯一失败为允许记录的 initial-load token budget（1372 > 1000）。`npm test` 的 CLI 与 Triggerify 套件通过，task-files 套件仍因预存 `inner-scope-simple-rules.md` 只有 frontmatter status、索引写 `Completed` 而失败。
- Review gate: Required — inner 配置会影响所有内置 hook 的全局 Agent 生命周期，且默认启用的标题 hook 会额外发送最新 prompt 给模型 provider。
- Review: `APPROVED`（累计 2 轮）— [Triggerify inner hook 用户配置审查](../../reports/adversarial-review/triggerify-inner-hook-config.md)
- T6: 配置校验接受可选 `hookSettings` 的 qualified inner ID → object 映射；live disable/enable 前后 `config.json` SHA-1 不变，证明模型设置未被 toggle 丢弃。
- T7: 新集成测试由临时脚本同时回显 `TRIGGERIFY_HOOK_CONFIG` 与 stdin prompt，确认只传当前 hook object 且 `triggerify.event/v1` payload 保持原结构。
- T8: `modelFromConfig` 聚焦测试覆盖用户模型、缺失配置、非法 model 和非法 JSON；live discover 解析到 `deepseek/deepseek-v4-flash`，端到端 `prompt-submit` 43ms、无诊断。
- T9: Triggerify 测试 27/27、Node 语法检查和标题 self-test 通过；Yao 结构、lint、governance 通过，唯一非阻塞项仍为 initial-load token budget（1372 > 1000）。
