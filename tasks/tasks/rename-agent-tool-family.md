# 统一 Agent 工具名称前缀

Status: Completed (2026-08-21 14:47)
Kind: Task

## Scope

- 彻底重命名项目自有身份、代码路径、Hook schema 与脚本环境变量，并把 Hook 数据迁移为按内容类型命名的 `hooks/` 路径；不保留旧名称、旧协议、旧路径回退或兼容别名。
- 自动迁移内置、用户级与项目级 Hook 规则、配置及脚本中的已知旧协议标识，迁移完成后只使用新名称、新协议与新路径。
- 保持 SOP 的用户级、项目级与内置三级所有权边界；用户级与项目级 `sops/` 内容目录不改名。
- `agent-rules` 的名称与职责保持不变；历史任务记录不因本次重命名而回写。

## Target
- [x] T1: Triggerify 的项目自有 skill 身份及相关引用统一使用 agent-hooks。
- [x] T2: sop-manager 的项目自有 skill 身份及相关引用统一使用 agent-sops。
- [x] T3: agent-rules、agent-hooks、agent-sops 形成一致的可发现工具命名族，且现有能力与宿主集成保持有效。
- [x] T4: 用户级 Hook 规则与配置使用 `<data-root>/hooks/`，项目级 Hook 规则使用 `<workspace>/.agents/hooks/`，内置 Hook 由 agent-hooks 包内的 `hooks/` 提供。
- [x] T5: SOP 的用户级、项目级与内置路径分别保持正确所有权并由 agent-sops 正确解析。
- [x] T6: 内置、用户级与项目级 Hook 规则、配置及脚本中的已知协议标识迁移为 `agent-hooks/*` schema 与 `AGENT_HOOKS_*` 环境变量。
- [x] T7: 现有用户级与项目级 Hook 数据可一次性无损迁移到新路径，迁移后仅使用新路径与新协议。
- [x] T8: 当前源码、文档、清单与运行时消费者不再依赖旧 skill 名称、旧代码路径、旧 Hook 数据路径或旧 Hook 协议标识。

## Plan

1. 重命名两个 skill 包、公开命令、协议标识及所有当前消费者。
2. 将 Hook 存储统一为用户级和项目级 `hooks/` 路径，并实现冲突时拒绝覆盖的一次性迁移。
3. 迁移内置 Hook 与当前用户 Hook 数据，保留 SOP 的三级所有权边界。
4. 更新当前文档、Context、Lessons、清单及验证入口，保留历史任务与报告。
5. 运行语法、结构、skill package、资源边界和旧引用检查；不运行项目测试。

## Result

- T1: Skill discovery、CLI help 与 manifest 路径均只解析到 skills/meta/agent-hooks 和 agent-hooks；旧 skill 目录不存在。
- T2: Skill discovery、SOP summary 与宿主消费者均只解析到 skills/meta/agent-sops 和 agent-sops；旧 skill 目录不存在。
- T3: 递归 discovery 确认 agent-rules、agent-hooks、agent-sops 各唯一可发现；Agent Hooks native dispatch 与 Agent SOPs summary smoke 均成功。
- T4: 实际用户规则/配置位于 ~/.csl-agent-kit/hooks；临时项目迁移落到 .agents/hooks；3 个内置 Hook 从 skills/meta/agent-hooks/hooks 解析且有效。
- T5: Agent SOPs summary 读取内置与用户 sops/；隔离 smoke 证明同名 SOP 按 project > user > built-in 解析，三级存储路径未改名。
- T6: 内置规则 validator、实际用户配置/规则/脚本检查和临时项目迁移均确认 agent-hooks/* schema 与 AGENT_HOOKS_*，无旧协议标识。
- T7: 实际用户旧根已移除且 2 条规则有效；临时用户+项目迁移保留脚本执行位与内容，双根冲突时退出 2 且两侧数据均保留。
- T8: 当前源码全文与文件名搜索仅剩迁移实现、迁移 fixture 和 Context 迁移说明中的有意旧标识；所有当前消费者目标路径均存在。
- Review gate: Skipped — 用户未请求独立 adversarial review 或双 Agent Reviewer–Editor 审批。

## Verification

- Passed: 语法、JSON、TS transpile、diff、Context/Lessons、skill discovery、Hook/SOP 路由、实际用户数据与隔离迁移/冲突 smoke 均通过；Yao 仅有规则允许的 initial-load token 超额；按计划未运行 unit tests，完整 tsc 仅剩未改动的既有第 165 行类型错误。
