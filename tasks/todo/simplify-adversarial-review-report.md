# 轻量化 adversarial review 最终报告

- **Status:** 已完成（2026-07-21）

## Goals

- 将任务级流程细节从项目 `AGENTS.md` 撤回，避免用高频规则修改承担 skill 配置职责。
- 保留 adversarial review 的 Reviewer–Editor 闭环和 fail-closed 行为。
- 将持久化报告收敛为用户关心的讨论结果与最终决定，减少中间轮次的文件同步。
- 用触发与输出契约评测证明基础操作不会误触发、报告不再包含管理型技术附录。

## Plan

1. 精简默认 agent 模板中的任务与审查原则，并撤回项目规则中的任务级细节。
2. 简化 adversarial-review 的记录生命周期、任务状态和最终报告契约。
3. 更新相应 eval、经验和工作区约定，执行 skill 校验与独立复核。

## Results and verification

- 通用 `AGENTS.md` 只保留稳定的任务与验证原则，项目 `AGENTS.md` 相对 HEAD 无改动。
- adversarial-review 活跃轮次只通过 Agent handoff 传递 ledger，不写中间报告或同步 task 状态。
- 最终报告仅包含 `Discussion results` 与 `Final decision`；`Reviewer position` 和 `Editor response` 使用嵌套列表，每项一个核心观点。
- Wiki 原样写入、普通 review 与明确本人自审均不触发；明确独立 Reviewer–Editor 请求正常触发。
- `quick_validate.py`、resource boundary、JSON、Markdown 结构和 `git diff --check` 通过；routing eval 28/28，precision/recall 均为 1.0。

## Review

- Decision: APPROVED
- Report: [Adversarial review report](../../reports/adversarial-review/simplify-adversarial-review-report.md)
