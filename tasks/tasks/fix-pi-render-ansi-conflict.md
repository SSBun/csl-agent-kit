# 修复 Pi render_ansi 工具注册冲突

Status: Completed (2026-09-15 20:30)
Kind: Task

## Scope

仅处理 render_ansi 重复加载；按用户后续指示删除用户目录中的相同副本，仅保留 CSL Agent Kit 版本、ANSI 能力及其他扩展。不修改加载配置，不使用全局禁用扩展的绕过方式。

## Plan

1. 复现正常扩展发现路径的启动失败，并核对两个注册来源。
2. 核对内容一致后，删除用户目录中的独立副本，保留包内扩展。
3. 验证配置差异、实际启动与工具加载来源，记录证据和验证限制。

## Target
- [x] T1: 正常加载扩展启动 Pi 时不再出现 render_ansi 重复注册导致的启动失败

## Result

- T1: 修改前通过 PTY 启动 pi --offline --no-session 复现 render_ansi 冲突，退出码 1；删除用户目录的逐字节相同副本后，同一命令正常进入 TUI，扩展列表包含 csl-ansi.ts 且不含 colored-text.ts，无扩展加载错误，/quit 正常退出码 0。未发起模型请求，未运行单元测试。
- Review gate: Skipped — R1 四项依据及启动前后对比已记录，用户未要求独立审查。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 仅删除用户明确指定的相同扩展副本，未修改实现或设置；正常发现扩展的启动故障已直接复现和验证修复。
- Snapshot: 用户扩展 /Users/caishilin/.pi/agent/extensions/colored-text.ts 已删除；保留 pi/extensions/csl-ansi.ts SHA256=16cf9a94c723fa83580995180ce96d5eb59073bf584b68a2207c3456814b6d77；仓库已有其他改动不属本任务。
- Evidence: T1 Result：PTY 启动前退出 1；删除后正常进入 TUI 并退出 0；删除前 cmp/逐字节比较相同。
- Result clarity: 用户明确要求删除用户副本、仅保留 CSL Agent Kit 版本；结果符合要求。
- Bounded impact: 自动发现目录少一个重复注册者，包 manifest 和用户 packages 仍加载 csl-ansi.ts，其他扩展加载正常。
- Low risk: 两份源码逐字节相同且保留完整包内版本，删除可从保留版本恢复，不改变权限和工具实现。
- Sufficient verification: 真实 PTY 启动正常，扩展列表确认 csl-ansi.ts 保留，/quit 退出 0；未运行单元测试或调用渲染工具，渲染实现未修改。
- Task fingerprint: 9adbbdcdeeca4bbb24e7bbc3f151c8e99a55ecb25632ad9150e37df551cfde2a

## Verification

- Passed: 最终复核用户副本不存在、包内 SHA256 未变、settings 无扩展排除且仍加载本地包；PTY 启动已正常并退出 0；Context validate 与 git diff --check 通过。未运行单元测试。
