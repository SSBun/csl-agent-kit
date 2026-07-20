# 重写 analyze-project 双模式 skill

状态：进行中（2026-07-19）

## 目标

- 按已批准的 Develop 与 Learn PRD，一次性将 `analyze-project` 重写为双模式 skill。
- 只保留生成单份高密度报告所需的最小指令、reference 与 eval，删除旧多报告 prompts/templates/workflow。
- 验证触发边界、输出契约、资源边界与安装发现，并通过最终独立审查。

## 计划

- [x] 核对当前 skill、仓库分发模式与近邻 eval 约定，冻结最小文件集合。
- [x] 重写 `SKILL.md` 与必要模式 reference，删除旧多报告资源。
- [x] 添加最小 trigger/output eval 与契约检查，运行 Skill Creator、Yao 和仓库测试。
- [ ] R1：以任务专用 runner 实际执行 28 个契约 fixture，并保存逐项证据。
- [ ] R2：完成 Develop/ Learn 最小 output eval，保存匿名评分与可重放证据。
- [ ] R3：补齐 Develop unborn 仓库语义，明确仅依据未提交工作树且不伪造 revision。
- [ ] 按项目规则复跑 Yao 审计与相关回归验证。
- [ ] 通过独立 `adversarial-review`，完成任务记录与交付。

## 边界

- 不修改两份已批准 PRD。
- 不增加运行时框架、依赖、课程状态或报告模板系统。

## Review status

- Gate: BLOCKED
- State: CONTINUE
- Reviewer: `analyze_skill_reviewer`
- Round: 1
- Scope: `skills/analyze-project/**`、README 条目与 repo-map 相邻边界
- Summary: 初审发现契约 fixture、output eval 与 Develop unborn 语义三个阻塞项，等待整批修复。
- Unresolved: R1, R2, R3
- Report: [Adversarial review report](../../reports/adversarial-review/analyze-project-skill.md)
