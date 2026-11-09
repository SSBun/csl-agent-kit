# 将 test-triage 重命名为 bug-fix

Status: Completed (2026-08-21 17:17)
Kind: Task

## Scope

- 包含共享 Skill 包及当前 README、manifest、运行时引用和相关测试中的名称同步。
- 不改写历史任务、历史分析报告或上游来源 URL。

## Target
- [x] T1: 可分发技能以 bug-fix 名称被发现，test-triage 不再作为当前 Skill 或 alias 保留。
- [x] T2: 技能原有的故障复现、诊断、修复与验证能力保持不变，仓库内相关引用一致且验证通过。

## Plan

1. 重命名 Skill 包并同步当前分发与运行时引用。
2. 检查旧名称仅剩历史记录或上游来源。
3. 运行 Skill、发现机制及仓库一致性校验。

## Result

- T1: Pi 定向发现测试 1/1 通过，六个当前 manifest 均包含 bug-fix 且不含 test-triage；新路径存在、旧路径和旧 alias 均不存在。
- T2: 与 HEAD 旧 Skill 逐字比较确认除 frontmatter 名称和标题外工作流内容不变；当前 README、manifest 与 macOS 运行时引用已同步。
- Review gate: Skipped — 用户未请求独立 adversarial review。

## Verification

- Passed: 定向 Node 测试、manifest 与唯一名称断言、行为保持比较及 git diff --check 通过；local quality gate 阻塞检查通过，仅有允许的初始加载 token 预算告警。
