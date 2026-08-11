# 闭合 adversarial-deliberate 的高优先级协议缺口

**Status:** Completed (2026-07-24 14:05)

## Scope

- 包含已确认的三项高优先级缺口：路由、循环进展和议题 ledger 闭环。
- 不包含中优先级的 workflow runner、资源依赖和多决策改进。

## Target

- [x] T1: 路由必须具有明确的迭代或全面多视角意图，同时不能错拒使用 review 措辞的非审批决策讨论。
- [x] T2: `CONTINUE` 必须对应实质性开放议题和具体预期变化；重复且无进展不得维持循环。
- [x] T3: 主题与议题 ID 具有稳定生命周期，`SUFFICIENT` 必须以所有实质性议题显式关闭且所有主题复查为前提。
- [x] T4: 聚焦的路由、workflow、语法和 skill 验证全部通过，且现有路由用例无回归。

## Plan

1. 收紧语义路由概念并增加边界回归用例。
2. 在核心 workflow 指引和 fixture 中闭合进展与 ledger 契约。
3. 运行聚焦验证、Yao 审计与风险匹配的审查门禁。

## Result

- T1: `trigger_eval.py` 对 10 条正例、8 条反例和 13 条近邻用例全部通过；新用例同时覆盖裸角色名误触发与非审批 `adversarial review` 漏触发。
- T2: `SKILL.md` 现要求 `CONTINUE` 引用实质性开放 D-ID 并说明下一轮具体变化；`material_continue` fixture 覆盖无进展退出。
- T3: `SKILL.md` 固定 T-ID、单调分配且不复用 D-ID，并要求全量 D-ID 复审和全主题闭环；`ledger_closure` fixture 覆盖该契约。
- T4: Skill Creator quick validation 通过；Yao 的 structure、lint、governance 和非预算 resource checks 通过，仅保留允许的 1302/1000 initial-load token 告警；`npm run check` 全部通过，包含 CLI、Triggerify、task、Pi 与 install dry-run。
- Review gate: Required — 修改共享多 Agent 循环的终止和完成判定，属于全局 Agent lifecycle 风险。
- Review decision: `APPROVED` — 独立 Reviewer 在 `INITIAL (1)` 完整检查后无未解决项。
- Report: [Adversarial review report](../../reports/adversarial-review/close-adversarial-deliberate-gaps.md)
