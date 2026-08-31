# Adversarial Review: 重写 analyze-project 双模式 skill

## Summary

- Gate: BLOCKED
- Review state: CONTINUE
- Stop reason: in-progress
- Reviewer: `analyze_skill_reviewer`
- Current round: INITIAL (1)
- Task: [tasks/tasks/analyze-project-skill.md](../../../tasks/analyze-project-skill.md) — 重写 analyze-project 双模式 skill
- Updated: 2026-07-19T21:57:14+08:00

## Reviewed scope

- Base or revision: `HEAD 14d1ba51d694e448e5bf1fd949c5aae444561247` plus current task-local working-tree changes
- Artifacts: `skills/analyze-project/**`；`README.md` 中 analyze-project 条目；`skills/repo-map/references/repo-map-workflow.md` 中相邻能力边界
- Fingerprint: `c17c6b6ae3de49761582ca8d6ba78e77bb0789f876ae5d7b9fe9fb0f003bffd1`
- Non-goals: 不修改两份已批准 PRD；不增加运行时框架、依赖、课程状态或报告模板系统

## Outcome

首次审查发现三个阻塞项：契约场景尚未执行、两模式 output eval 尚未完成、Develop unborn 语义不完整。Gate 保持关闭，等待 Editor 整批处理。

## Findings

### R1 — BLOCKER: 契约场景未执行

- Location: `skills/analyze-project/evals/contract_cases.json`
- Evidence: 28/28 只核对 JSON 结构与 ID 唯一性，未执行路径、symlink/lstat、原子替换、秘密过滤、Mermaid 与覆盖图行为。
- Risk: 关键安全与失败契约可能与实际执行不符，而现有验证仍通过。
- Editor response: Pending.
- Resolution: Pending.
- Verification: Pending.
- Status: UNRESOLVED

### R2 — BLOCKER: Output eval 尚未完成

- Location: `skills/analyze-project/evals/`、当前验证证据
- Evidence: Develop 只有无 validator 零写入试用；Learn 只有 with-skill 报告。没有批准 PRD 规定的 baseline、匿名评分、Develop 5/5 或 Learn sealed held-out transfer 与重放 artifacts。
- Risk: 无法证明 skill 改善最终输出，也未满足任务的最小 output eval 目标。
- Editor response: Pending.
- Resolution: Pending.
- Verification: Pending.
- Status: UNRESOLVED

### R3 — BLOCKER: Develop unborn 语义不完整

- Location: `skills/analyze-project/SKILL.md`、`skills/analyze-project/references/develop-mode.md`
- Evidence: 当前只要求记录 `HEAD: unborn` 与通用工作树状态，未要求明确说明地图完全基于尚未提交的工作树内容且不伪造 revision。
- Risk: 首次提交前报告可能误导 freshness 与证据基线。
- Editor response: Pending.
- Resolution: Pending.
- Verification: Pending.
- Status: UNRESOLVED

## Round history

| Round | State | New findings | Resolved | Unresolved |
|---|---|---|---|---|
| INITIAL (1) | CONTINUE | R1, R2, R3 | none | R1, R2, R3 |

## Verification

- Skill Creator quick validation — 通过。
- local quality gate lint/resource boundary — 通过；入口 646 tokens，无资源边界 warning。
- Trigger eval — 24/24 通过，precision/recall 均为 1.0。
- Contract cases — 28/28 结构与唯一 ID 验证通过。
- `npm run check` — 53 项测试与 Codex 安装 dry-run 通过。
- Develop forward test — 无本地 Mermaid validator 时零写入，隔离工作树 clean。
- Learn forward test — 在隔离仓库生成一份 file-scope guide；独立 Judge 核验路径、schema、覆盖链、材料顺序、Agent 语义及全部源码锚点后通过。
- skill schema validation validate-only — 通过。
- Limitations: local quality gate 完整 `validate` 仍报告本仓库内置 skill 的既有 `agents/interface.yaml` 发布元数据差异；lint、governance 与 resource boundary 单项通过。

## Unresolved items

- R1：执行 28 个行为契约 fixture，而非只验证 JSON。
- R2：完成两模式 PRD 规定的最小 output eval 与可重放证据。
- R3：补齐 Develop `HEAD: unborn` 的完整未提交工作树声明。

## Approval boundary

- Approval covers only the identified revision and scope.
- Reviewed-artifact changes invalidate approval and resume the same numbered history.
- Report and task-summary synchronization are administrative review records.
- External action authorization: 未授权 commit、publish 或 release。
