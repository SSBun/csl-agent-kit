# 分析当前 Task Target 对齐系统

Status: Completed (2026-09-11 15:36)
Kind: Task

## Scope

- 分析当前仓库 Task Target 对齐机制，在对话中交付结论；不修改运行时协议、实现或评测，不创建额外报告。

## Target
- [x] T1: 说明当前 Task Target 对齐系统如何工作，并区分现行规则、实现保障和分析判断。

## Plan

1. 核对共享对齐协议、Task 家族入口及授权与生命周期边界。
2. 检查核心实现和评测依据，区分可机械验证的状态与依赖 Agent 判断的语义。
3. 汇总机制、代表场景、设计价值与局限，核验来源并在对话中交付；不运行测试或模型评测。

## Result

- T1: 核对现行共享协议、三个 Task 消费入口、Contract、task-core 的 parseTask/completeTask 与 v4 evaluator：确认授权原子与双向等价检查、L0-L4/L2 覆盖、委派/恢复/Safety 边界；核心只校验记录状态与证据，不证明用户授权语义。离线 validate 观察到 46 场景/92 cases、provisional/report-only；评测不覆盖自由生成 Target，未运行测试或模型评测。分析在本次对话交付。
- Review gate: Skipped — 本次为只读系统分析，未修改请求交付物文件；仅创建并维护 canonical task 及其索引项，不触发交付物修改的独立审查。

## Verification

- Passed: 自检对照当前源码与协议，已区分规则事实、核心机械保障和分析判断；HEAD 0f14393，分析相关文件 git diff --exit-code 通过。评测 layout/validate 通过，当前任务 check、workspace validate、git diff --check 通过；未执行测试、自检测试或模型评测，不主张运行时可靠率。
