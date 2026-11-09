# 创建 Deep Explore Skill

Status: Completed (2026-08-07 19:25)

## Target

- [x] T1：新增 `deep-explore` skill，在用户批准探索指南后，按顺序调查主题、项目或任务，并为每次探索创建新的 `tasks/reports/<date>-<slug>/` 报告目录。
- [x] T2：主题、项目和任务分别具有可按范围裁剪的详细探索指南，任务探索不得执行目标任务本身。
- [x] T3：路由与契约评测覆盖批准门禁、逐项完成、证据映射、新目录策略和相邻 skill 边界。
- [x] T4：共享 skill 发现入口与用户文档包含 `deep-explore`，且适用验证全部通过。
- [x] T5：`deep-explore` skill package 的 `SKILL.md`、references、prompts、templates 与 eval prose 全部使用英文。
- [x] T6：主契约要求报告先给出简洁准确的定义，再解释用途、工作原理与实现；限制、开放问题和冲突作为认知边界而非缺陷清单。
- [x] T7：三类候选指南保留各自解释维度，同时让定义与解释内容优先于边界内容，且不把探索变成审计、review 或实施。
- [x] T8：更新后的路由、契约、语言和 skill package 通过适用项目测试、local quality gate 与资源边界验证。

## Scope

- 包含：`skills/deep-explore/` 内的运行契约、三类 reference guides、interface 和 eval 资源。
- 不包含：批量翻译或修改其他 skill packages；探索报告继续使用用户语言。

## Plan

1. 将 `deep-explore` package 的 Agent-facing prose 翻译为英文。
2. 以最小增量加入 definition-first、explanatory-before-boundary 和 non-audit stance。
3. 更新契约评测以覆盖语言与报告组织要求。
4. 运行任务索引、package、local quality gate、资源边界及项目验证。

## Result

- T1：`skills/deep-explore/SKILL.md` 固定批准门禁、顺序执行和 `<workspace>/tasks/reports/YYYY-MM-DD-<slug>[-n]/` 全新目录策略；契约 fixture 校验通过。
- T2：`references/topic-guide.md`、`project-guide.md` 和 `task-guide.md` 提供可裁剪候选指南；任务指南与主契约均禁止实施目标任务。
- T3：trigger eval 覆盖 8 个正例、10 个反例和 7 个近邻例，结果 precision `1.0`、recall `1.0`、零误触发与零漏触发；13 个 contract cases 覆盖批准、顺序、阻塞、输出和三类证据边界。
- T4：README 与 Claude manifest 已加入 `deep-explore`；`npm run check`、local quality gate validation、resource-boundary check、JSON/契约 fixture 检查及 `git diff --check` 全部通过，初始加载估算为 `776/1000` tokens。
- T5：`SKILL.md`、三个 reference guides、interface 和 contract prose 已改为英文；确定性 CJK scan 通过。`trigger_cases.json` 与 `semantic_config.json` 仅保留用于验证多语言路由的有意中文 fixtures。
- T6：主契约新增 definition-first explanatory order，并明确 limitations、unknowns、alternatives 和 source conflicts 是认知边界，不是对象缺陷或审计结论；contract fixture 已同步。
- T7：topic/project/task guides 已全部使用英文，并在保留各自风险、冲突、候选方案等解释维度的同时，将定义、机制和实现置于边界内容之前。
- T8：语义 phrase contract 为 precision `1.0`、recall `1.0`；JSON、语言、报告契约和新目录检查通过；`npm run check` 全部通过。local quality gate syntax/lint/governance 通过；resource-boundary 唯一未满足项是允许的初始加载预算 `1979 > 1000`，无其他资源边界失败。
- Review gate: Skipped — no explicit user request.
