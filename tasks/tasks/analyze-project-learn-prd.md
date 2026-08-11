# 设计 analyze-project 的 Learn 模式 PRD

状态：已完成（2026-07-19）

## 目标

- 定义 Learn 模式帮助人或 Agent 学会一个项目/组件的核心结果，并与 Develop、`repo-map`、`teach` 明确分工。
- 收敛最小且高信息密度的报告结构、输出路径、证据规则、学习检验与失败契约。
- 通过无轮次上限的 `adversarial-discuss` 取得充分答案，再形成并审查 Learn PRD。

## 计划

- [x] 建立问题、约束、事实与待决项，生成完整候选设计。
- [x] 由独立 Reviewer 反复挑战覆盖、边界与可执行性，直到 `SUFFICIENT` 或需要用户裁决。
- [x] 写入 Learn PRD，并运行结构、密度与一致性验证。
- [x] 通过最终独立 `adversarial-review`，打开生成的 Markdown 供用户检查。

## 边界

- 本任务只设计 Learn 模式；不实现 skill。
- 不重复 Develop 的静态项目地图，也不复制 `teach` 的通用、多课次教学工作区。

## Discussion status

- Gate: SUFFICIENT
- Reviewer: /root/prd_reviewer
- Round: 3
- Resolved: D1-D16
- Unresolved: none

## Review status

- Gate: APPROVED
- State: APPROVED
- Reviewer: learn_prd_final_reviewer
- Round: 5
- Scope: `docs/analysis/analyze-project-v2-learn-prd.md`
- Summary: `RE-REVIEW (5)` 已批准当前 PRD，R1–R10 全部解决。
- Unresolved: none
- Report: [Adversarial review report](../../reports/adversarial-review/analyze-project-learn-prd.md)

## 复核

- `adversarial-discuss` 在第 3 轮以 `SUFFICIENT` 结束，D1–D16 全部解决；正式 PRD 随后通过 5 轮独立 `adversarial-review`，R1–R10 全部关闭。
- 最终 PRD SHA-256 为 `b441bcf52ee75c23c910791fe3a326b4ca3b59f2a97c78f49344578fbee6ac51`；18 个连续编号章节，固定 eval 证据锚点存在。
- `git diff --check` 与未跟踪 PRD 的 no-index whitespace 检查通过；占位符、旧增量更新/map 复用、泄漏 hidden 场景和主观 scope 阈值扫描无命中。
- PRD 与审查报告已用 Typora 打开；本任务未实现 skill。
