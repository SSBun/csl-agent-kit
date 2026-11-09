# 删除无消费者的 Interface YAML 元数据

Status: Completed (2026-08-27 15:28)
Kind: Task

## Target
- [x] T1: 共享、项目本地及 deprecated Skill 中的 25 个无消费者 agents/interface.yaml 已删除，由此产生的空 agents 目录已清理，现有 agents/openai.yaml 保持不变；历史 eval snapshots 保持原样。
- [x] T2: 内置 skill-quality 不再说明、校验或警告缺失的 interface.yaml，相关 fixtures 与聚焦测试契约已同步。
- [x] T3: 使用更新后的 skill-quality 检查全部可发现 Skill packages，结果无 missing-interface warning、无 failure，并记录其余 warning。

## Scope

- 删除共享、项目本地及 deprecated Skill 中的全部 `agents/interface.yaml`，并仅删除因此变空的 `agents/` 目录。
- 保留 `agents/openai.yaml` 及其目录；不改动 Skill 行为、routing 或宿主发现机制。
- 同步收窄 skill-quality 的文档、实现与测试契约；不运行单元测试或项目测试套件。

## Plan

1. 删除全部 interface metadata 文件并清理空目录，同时确认 OpenAI metadata 保持不变。
2. 从 skill-quality 删除 interface schema、缺失 warning 和测试 fixture，更新 Context Pack。
3. 搜索当前消费者与残留路径，运行全仓 skill-quality、结构化文件、Context、Task 和 diff 校验。

## Result

- T1: 已从共享、项目本地及 deprecated Skills 删除 25 个 interface.yaml，并删除 19 个空 agents 目录；6 个 openai.yaml 的 SHA-256 逐字节未变，3 个历史 eval snapshot 保持原样。
- T2: skill-quality 的 SKILL、checker、Context Pack 与聚焦测试 fixture 已移除 interface schema、missing-interface warning 及相关契约；当前非历史消费者搜索为 0，checker 与测试文件语法通过。
- T3: 更新后的 skill-quality 检查 28 packages：19 pass、9 warning、0 failure，且无 missing-interface。其余均为 context-budget：adversarial-review 1111、deliberate 1599、agent-hooks 1281、agent-sops 1914、task 2259、task-context 3360、task-lessons 2428、task-plan 1231、task-queue 1288。
- Review gate: Skipped — 用户未请求独立审查；已检查消费者、历史 snapshot 边界、OpenAI metadata 完整性、空目录和全仓质量结果。

## Verification

- Passed: skill-quality self-check pass，全仓 28 packages 为 19 pass/9 context-budget warning/0 failure；接口文件与当前消费者搜索、OpenAI metadata 哈希、Node 语法、68 JSON、7 JSONL（606 records）、10 YAML、Context/task validate 和 git diff --check 均通过；未运行单元测试或项目测试套件。
