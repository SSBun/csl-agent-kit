# 引导 SOP 生成可匹配关键词

Status: Completed (2026-08-18 19:20)
Kind: Task

## Target
- [x] T1: SOP Manager 契约要求创建或更新 SOP 时生成利于路由匹配的关键词并说明提取规则
- [x] T2: skill 校验与相关验证通过

## Result

- T1: SOP Manager SKILL.md 新增 Routing keywords 契约，并要求 create 步骤 5 与 learn 步骤 3 生成或再生可匹配关键词。
- T2: local quality gate lint/governance/structure 通过，仅保留允许的初始加载 token 预算失败；test:tasks 与 git diff --check 通过。
- Review gate: Skipped — 用户未要求独立审查。

## Verification

- Passed: local quality gate 校验除允许的 token 预算外全部通过；npm run test:tasks 与 git diff --check 通过。
