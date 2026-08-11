# 用 conventions skill 取代 tips

- **Status:** Completed (2026-07-21)
- Date: 2026-07-21

## Goal

退役失效的 `tips` skill，建立始终在场的用户约定机制：`~/.csl-agent-kit/conventions.md` 作为载体，经 `references/agents.md` 引用 + `SessionStart` hook 注入双保险确保每轮在场；新建极简 `conventions` skill 只负责增删改，不参与运行时注入。

## Why tips 失效（根因）

tips 用"关键词按需注入"承载"应始终在场"的约定，机制与目的错配：
- 关键词未命中 → 不注入 → 不生效（最常见失效路径）；
- 20 条 / 2000 字符限制是为按需注入省 token 的妥协，代价是容量不足；
- 现有 5 条真实数据全部是"应始终在场"的约定，没有一条需要按上下文触发。

## Decisions

- Q1 始终在场（用户确认）：排除任何按上下文触发机制。
- Q2 载体 = `~/.csl-agent-kit/conventions.md` + `references/agents.md` 引用一行（个人/通用分离，可分发文件保持纯净）。
- Q3 5 条 tips 全量迁移，原文保留。
- Q5 skill 名 = `conventions`。
- Q6 触发边界 = 严（只在用户明确要求保存时写）。
- Q7 a + b：agents.md 强指令让 agent 主动读 + SessionStart hook 一次性注入双保险。

## Plan

- [x] 建 `~/.csl-agent-kit/conventions.md`，迁入 5 条 tips 原文（按主题分组）。
- [x] `references/agents.md` 末尾加 `### User Conventions` 段，引用 conventions.md 并要求 agent 遵守。
- [x] 新建 `skills/conventions/`：
  - `SKILL.md`：触发边界（严）、内容边界（持续约定 vs 临时要求/工程原则/纠正经验/SOP）、存储位置、增删改流程（用 edit 工具直接改 md，无脚本）。
  - `evals/trigger_cases.json` + `semantic_config.json`：覆盖"明确要求保存才触发"。
- [x] `hooks/hooks.json`：
  - 移除 `UserPromptSubmit` 里的 `tips-candidates.js` 条目；
  - 在 `SessionStart` 和 `PostCompact` 加一条 cat `~/.csl-agent-kit/conventions.md` 的注入命令。
- [x] 退役 `skills/tips/`（删目录）。
- [x] 重写 `pi/extensions/csl-context-hooks.ts`：移除 tips-store 依赖，session_start/compact 与 before_agent_start 全量注入 conventions.md。
- [x] 删除 `~/.csl-agent-kit/tips/`（数据已迁移）。
- [x] 各 plugin manifest（.claude-plugin / .codex-plugin / .cursor-plugin / .agents）移除 tips、加 conventions。
- [x] `README.md`：移除 tips 行，加 conventions 行，同步描述注入机制改为 SessionStart 全量注入。
- [x] `tasks/context.md` 同步 components（删 tips 条目，加 conventions 条目，更新 AGENTS.md 引用）。
- [x] `tasks/lessons.md` 加一条：tips 失效根因 = 机制错配；约定应始终在场，不要用按需注入承载。

## Verification

- conventions.md 5 条与原 tips.json 一一对应，原文不丢。
- SessionStart hook 命令本地实跑，输出 conventions.md 全文。
- hooks.json 合法 JSON，tips-candidates 引用清零。
- 活跃文件 grep `tips` 仅剩历史 tasks/reports 和被保留的文件名引用。

## Risks

- SessionStart hook 在非 Claude 平台（Codex/Pi/Cursor）行为不一致 → 先保证 Claude 路径，其他平台靠 AGENTS.md 引用兜底。
- 迁移过程中删 `~/.csl-agent-kit/tips/` 不可逆 → 迁移完成并核对后再删。
