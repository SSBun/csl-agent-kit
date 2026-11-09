---
created: 2026-07-25
task: dispatch-real-subagents-in-adversarial-skills
---

# Dispatch real subagents in adversarial skills

Status: Completed (2026-07-25 12:38)

## Target

- T1..T4: (completed in first pass)
- T5: Provide the four adversarial roles as separate example agent definition files (inner agents), split into individual files, reusable on Pi and Codex without editing the skill body.

## Plan

1. Add `references/subagent-dispatch.md` under adversarial-review (shared content, referenced by both skills) covering: capability detection, role→subagent mapping, per-host dispatch (Pi subagent tool, Codex multi_agent + plugin agents, tmux), inline fallback, and isolation disclosure.
2. Extend `agents/interface.yaml` `execution.context` to express "isolation-preferred, inline-fallback".
3. Edit adversarial-deliberate `SKILL.md` Roles/Workflow to dispatch Synthesizer and Challenger as real subagents when available, inline otherwise.
4. Edit adversarial-review `SKILL.md` Roles/Gate to dispatch Reviewer and Editor as real subagents when available, inline otherwise.
5. Verify: re-read edited files for contract consistency; confirm evals untouched and still aligned.
6. Add four example agent role files under a new `agents/` example directory per skill (or shared), cross-referenced from subagent-dispatch.md.
7. Verify example files parse as frontmatter+markdown and reference the right contracts.

## Result

- T1 ✓: `agents/interface.yaml` `execution` 段新增 `dispatch` 块（prefer: subagent, fallback: inline, roles, disclosure）并把 `context` 改为 `isolation-preferred, inline-fallback`；YAML 语法校验通过。adversarial-review 无 interface.yaml，其偏好由 SKILL.md 表达。
- T2 ✓: 新增 `skills/adversarial-review/references/subagent-dispatch.md`（共享 reference，deliberate 跨目录引用）：能力探测顺序、角色→subagent 映射表、按宿主 dispatch（Pi subagent 工具 chain、Codex multi_agent + plugin agents、tmux）、inline 回退与角色分离规则、disclosure 契约、"契约不变"清单。
- T3 ✓: adversarial-deliberate SKILL.md Contract 加 dispatch 条款，Workflow 新增 Step 0 (Resolve dispatch mode)；adversarial-review SKILL.md Gate Contract 加 dispatch 条款，Workflow 新增 Step 0。两者均在 SUBAGENT 模式跑隔离 subagent，INLINE-FALLBACK 模式跑 inline 并标 `ISOLATION: simulated`。
- T4 ✓: git status 确认 evals/ 目录零变更；CLI `node --check` 通过；所有 markdown 引用的 reference 路径存在。状态机、ledger、report 格式、review-loop/decision-consensus/review-lenses/resource-handoff/final-review-report 全部未动。

- T5 ✓: 四个角色作为独立示例 agent 文件提供，分别放在各 skill 的 `examples/agents/` 下：`adversarial-reviewer.md`、`adversarial-editor.md`、`adversarial-synthesizer.md`、`adversarial-challenger.md`。frontmatter 格式 Pi/Codex 通用（数组 tools + model），正文复用各 skill 已有契约（review-lenses/review-loop/decision-consensus/state-packet/resource-handoff）作为角色指令，使 subagent 自包含。subagent-dispatch.md 的角色映射表新增 Example file 列指向它们。未污染 `agents/` adapter 元数据语义；evals 零变更。

第一版改动文件：4 改（两个 SKILL.md、interface.yaml、tasks/todo.md）+ 2 新增（subagent-dispatch.md、任务记录）。

## Review gate

Skipped — documentation/protocol-layer change to skill prompts; no code, no runtime behavior change, deterministic verification by re-reading contracts and confirming evals are untouched.
