# 先保存本地基线再完成全部 Skill 审计修复

Status: In Progress (2026-09-11 18:14)
Kind: Queue

## Scope

- 先提交当前仓库全部未忽略本地变更；不推送、不发布、不在基线保存前修改 Skills。
- 修复上一轮审计记录 A01–A20；有条件合并 eli5/task-grill 和知乎能力可选分发不是本轮删除或拆包授权。
- 当前请求未明确授权运行测试；测试与自测保持禁止，需在运行前获得授权。非测试检查、读取测试源码和编写回归用例不受此限制。

## Plan

1. `save-pre-audit-fix-baseline`：核对并提交修复前的全部本地内容，保存可回溯基线。
2. `fix-skill-audit-findings`：依赖基线提交完成，修复 A01–A20，逐包质量检查、逐项验证及独立 task-review。
3. 两个子任务完成后独立核对提交顺序、修复覆盖与最终证据，完成父级集成验证。

## Target
- [x] T1: 开始审计修复前，当前仓库全部本地改动已保存为 Git 提交。
- [ ] T2: 上轮 Skill 审计列出的全部问题已修复，并提供逐项验证证据。

## Children

1. [提交审计修复前的全部本地改动](save-pre-audit-fix-baseline.md)
2. [修复 A01–A20 全部 Skill 审计问题](fix-skill-audit-findings.md)

## Result

- T1: 首阶段已完成，所有修复前本地内容保存于提交 20583fbcf0f0cae3f9e53496d94e2175eb4a1a13；tree=5fb31ce18270847ef2e153513ee01f93c0389f44，提交时工作区干净，尚未混入任何审计修复。
