# 分析 ADHD Skill 与 CSL Contract 的融合可能

Status: Completed (2026-09-03 10:31)
Kind: Task

## Scope

- 包含：分析上游 `i-have-adhd` Skill，并与 CSL Agent Kit Contract 及相邻承载机制比较。
- 不包含：修改 Contract、导入第三方 Skill 或新增持久规则。

## Target
- [x] T1: 基于链接中的完整 Skill 内容与当前 CSL Agent Kit Contract，说明两者的核心机制、重合点和差异。
- [x] T2: 给出是否适合融合的明确结论，并区分应纳入 Contract、应由其他载体承接和不建议引入的内容。

## Plan

1. 提炼上游 Skill 的行为目标、具体规则、例外与持久化语义。
2. 对照当前 Contract 及 Agent Rules、Agent Hooks、Skill 的职责边界。
3. 将候选内容分为 Contract 最小融合项、其他载体承接项和不建议引入项，并验证结论覆盖全部 Target。

## Result

- T1: 逐项核对上游 Skill 的持久化说明、10 条主规则、6 条例外和发送前检查，并与当前 Contract、Task Target 协议及相邻机制对照。
- T2: 形成三层分类：Contract 仅承接稳定通用交互原则，严格输出格式与模式切换由 Skill/Rules/Hooks 承接，硬上限、强制估时与逐轮复述不建议纳入。
- Review gate: Skipped — 用户未请求独立 adversarial review；已执行常规来源核对和自审。

## Verification

- Passed: 在记录最终 review gate 后重新核对：对照矩阵覆盖上游全部 10 条主规则及关键例外，且分类符合当前 Contract 的稳定边界、自动执行和验证要求。
