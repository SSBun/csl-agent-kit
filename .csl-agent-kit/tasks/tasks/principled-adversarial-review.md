# 让 adversarial review 基于共同原则独立审议

状态：已完成（2026-07-20）

## 目标

- 将 Finding、Required Outcome 和 Suggested Remedy 分离，避免把 Reviewer 建议当作修改命令。
- 为 BLOCKER 建立明确成立条件，并收紧 QUESTION 与 NOTE 的语义。
- 要求 Editor 审计当前方案充分性、最小解法、影响范围与比例性。
- Reviewer 只以 Required Outcome 是否满足关闭 Finding，不得强制采用 Suggested Remedy。
- Reviewer 与 Editor 共同遵守用户意图、关键属性保护、证据优先、最小改动、范围保护、比例性和可验证性原则。

## 计划

- [x] 在现有契约中定义共同原则、核心概念与裁决顺序。
- [x] 更新 Reviewer 输出和 Editor 回答契约，保留接受、缩小、拒绝、确认和用户决定路径。
- [x] 更新文件化报告格式和回归评测。
- [x] 运行 Skill Creator、local quality gate、仓库检查、前向试用与独立复审。

## Review status

- Gate: APPROVED
- State: APPROVED
- Reviewer: `principled_review_reviewer`
- Round: 2
- Scope: adversarial-review 共同原则、Finding 契约、Editor 独立审计与报告评测
- Summary: 共同原则、Finding 有效性门槛、Editor 独立审计、议题式报告和契约案例已完成并通过复审。
- Unresolved: none
- Report: [Adversarial review report](../artifacts/principled-adversarial-review/reports/adversarial-review.md)

## 复核

- 无证据 BLOCKER 前向测试：在进入 Editor 前省略，不进入台账。
- 过度全局方案前向测试：Editor 选择 `NARROW`，保留局部最小充分解法。
- 独立复审发现并关闭 R1：无 Suggested Remedy 的有效 Finding 现在可由 Editor 选择最小充分解法。
- 仓库检查、Skill Creator 校验、local quality gate lint/resource/IR、trigger eval、JSON 解析、diff check 与插件缓存一致性均通过。
