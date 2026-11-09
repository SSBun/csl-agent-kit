# 精简用户级 AGENTS 中与注入 Contract 重复的规则

Status: Blocked (2026-09-11 15:45)
Kind: Task

## Scope

- 只精简 `/Users/caishilin/AGENTS.md`；保留语言规则、plan mode 与子 Agent 偏好、3–5 个高概率失败模式的额外自检要求、主动修复 bug/CI 的偏好及 RTK 引用。
- 不修改仓库级 AGENTS、Contract、hooks、其他宿主规则或发现的悬空软链接；不运行单元测试或项目测试套件。

## Target
- [x] T1: 用户级 AGENTS 中已由 CSL Agent Kit 注入 Contract 承担的重复规则被移除。
- [x] T2: 用户级 AGENTS 中 Contract 未覆盖的独有约束保持有效，修改不扩展到仓库级规则或注入 Contract。

## Plan

1. 核对实际注入来源、Contract 有效状态与逐段覆盖关系，保存用户级文件原文作为非 Git 修改的审查基线。
2. 删除工程判断、任务/经验流程、最小改动与验收的重复描述，保留独有偏好。
3. 检查保留条款、Markdown 结构、改动边界和内容身份；记录逐 Target 证据，执行 fresh 只读 task-review。
4. 对最终审查快照重新核验并完成任务，披露 hook 依赖和未执行检查。

## Decisions

- 用户原始请求：`csl-agent-kit 会使用 hook 注入 contract，能移除当前的AGENTS.md 中的重复内容吗？`；随后明确：`我说的是系统用户级别的AGENTS文件`。实际文件为 `/Users/caishilin/AGENTS.md`，不是各宿主专属全局路径。
- Contract 的 Engineering Judgment、Simplicity First、Surgical Changes、Verification Before Done 已承担对应通用原则；Task, Context, and Lessons 与 Task-family 路由把任务和经验记录细则交给对应 Skill，因此不保留旧 `tasks/todo.md` 工作流或另一份纠错写入流程。
- 原文强制 plan mode、按任务边界使用子 Agent、额外失败模式数量及主动修复偏好不是 Contract 的等价复述，保留而不扩大本次清理。
- 此精简依赖用户明确指出的 Contract 注入环境；不添加未安装或禁用 hook 时的兜底副本。

## Evidence

- 修改前原文：[审查基线](../artifacts/deduplicate-user-agents-contract/evidence/AGENTS.before.md)。
- 逐项自检：[checks.json](../artifacts/deduplicate-user-agents-contract/evidence/checks.json)。原文件 89 行，精简后 30 行，字节减少 69.4%。
- 内容身份：用户文件 SHA256 `42754df2b02ac9ff9db940921569f07ebb2816f3fb069ac1008d7831fe7d601f`；原文 `2aeed7dd2af037d44c6a6f3e2f4f62a9e53130b6fb74806af5bb419fe3e72736`；只读 Contract `fcb7fb0a3e16d2a8f372925ed033040ab2c81c224bbddf519365544406a27cbf`；仓库 AGENTS `ff4a4c9fd091b98ebcb2be8cd4b580ccb066e93ffe7b11735c72f2be52bd11cf`。
- 自检覆盖的主要失败模式：误改宿主软链接而不是实际父级文件、误删独有偏好、Contract 未生效、影响仓库规则。通过目标实路径、逐字保留比较、hook 有效状态及输出比较、只读文件 SHA256 检查排除。
- 非本次问题：三个宿主专属 AGENTS 软链接仍指向已不存在的旧 super-agent 文件，本次不修复；当前会话实际加载的用户级文件是普通文件。
- 限制：未运行测试或启动新宿主会话；`skill-quality` 不适用于此次非 Skill 规则变更。已检查 Markdown 结构一致性及 `git diff --check`。其他宿主注入状态未验证。
- 独立审查运行 `d5bb2826-e5bb-44e0-a00a-046d9294075c` 在启动时失败，未生成 child session 或审查结论。错误为 `MODULE_NOT_FOUND: Cannot find module '@earendil-works/pi-tui'`，加载来源 `/Users/caishilin/.pi/agent/npm/node_modules/pi-subagents/src/watchdog/register-main.ts`；runner PID 19812 已消失，原 run 不支持 resume。
- 失败后核验：目标仍是 SHA256 `42754df2b02ac9ff9db940921569f07ebb2816f3fb069ac1008d7831fe7d601f`；修改前原文已保留，可重建全部差异。工作区为 `/Users/caishilin/Desktop/personal/skills`，分支 `main`，HEAD `0f14393430bcae1bb8d807542f2841151c2619e4`；存在其他会话的未提交任务记录，本任务未修改它们。

## Block

- Reason: 必需的 fresh 只读 task-review 因 pi-subagents 缺少 `@earendil-works/pi-tui` 而无法启动；没有审查结果，不能以主 Agent 自检替代或标记 Passed。用户文件修改与自检证据已保留，未自动修改宿主依赖或切换执行模式。
- Unblock when: pi-subagents 的依赖加载恢复正常，并能通过同一宿主协议成功启动新的 fresh 只读 Reviewer；恢复任务后重新核对当前内容身份和自检证据，再派发新审查。若改用其他执行模式，先取得用户明确授权。

## Result

- T1: 对照修改前原文与 Contract：工程判断、任务/经验管理、最小修改和验收的重复内容已移除，89行变30行；当前用户文件 SHA256=42754df2b02ac9ff9db940921569f07ebb2816f3fb069ac1008d7831fe7d601f。详见 Evidence 的原文与 checks.json；Pi Contract hook 为 active，注入脚本输出与 Contract 原文逐字节一致。
- T2: 逐字比较语言、规划、子Agent、bug/CI偏好及RTK引用通过；3–5失败模式约束保留；目标普通文件身份及仓库AGENTS/Contract前后SHA256不变检查通过。Markdown结构和git diff --check通过；未运行测试、未检查新会话或其他宿主。
- Review gate: Required — 主Agent已按T1/T2记录当前结果、原文基线、内容身份和检查局限；对用户级AGENTS修改派发一次fresh只读task-review，审查范围冻结。
