# 创建通用 tldr overview skill

Status: Completed (2026-08-09 22:00)
Kind: Plan

## Target
- [x] T1: `skills/tldr/SKILL.md` defines an input-agnostic overview workflow that resolves an explicit target or the current topic, gathers only necessary information, and produces a faithful one-screen overview.
- [x] T2: The `tldr` skill is discoverable through the existing Claude, Codex, Cursor, and Pi integration paths, with README documentation and no new runtime dependency or script.
- [x] T3: Positive and negative routing fixtures, Pi alias coverage, repository tests, local quality gate validation, resource-boundary validation, and `git diff --check` verify the implementation.

## Scope

- Include the input-agnostic `tldr` skill, its routing fixtures, cross-host discovery, README entry, and deterministic validation.
- Exclude deep research, code review, full repository analysis, recommendations, scripts, subagents, and automatic file output.
- Preserve the approved design in `tasks/plans/2026-08-09-tldr-design.md` as the implementation handoff.

## Decisions

- Accept any user-supplied target rather than maintaining a closed input-type taxonomy.
- When no target is supplied, summarize the current topic segment from the latest material topic or task change.
- Build a concise overview that explains the target's identity, purpose, important structure, and material current information according to the target itself.
- Use existing host tools and knowledge; perform only the minimum retrieval needed for current or uncertain facts.
- Keep the default response to roughly one screen, usually an opening `TL;DR` statement and no more than five useful points.
- Preserve source fidelity, disclose partial coverage and uncertainty, and do not add unsupported advice or analysis.
- Implement a single instruction-only leaf skill; add no scripts, dependencies, references, or subskills. Keep only the `agents/interface.yaml` metadata required by the repository's cross-platform packaging contract.
- Respond in chat by default and write a file only when the user explicitly requests persistence.

## Plan

1. Create the minimal English `skills/tldr/SKILL.md` contract from the approved design, including target resolution, information acquisition, overview construction, output, boundaries, and failure behavior.
2. Add focused positive and negative routing fixtures that distinguish concise overview requests from research, review, tutorials, and full repository analysis.
3. Add only the required discovery and documentation references: the Claude explicit skill list, README skill table, and Pi alias assertion; rely on existing recursive discovery for Codex, Cursor, and Pi.
4. Run focused routing and Pi checks, the repository test suite, local quality gate validation, resource-boundary validation, and `git diff --check`; fix only failures caused by this task.

## Result

- T1: 新增 input-agnostic `skills/tldr/SKILL.md`；OpenAI quick validation 与 local quality gate validate 均通过，resource boundary 初始加载估算为 993/1000 tokens。
- T2: Claude 显式清单和 README 已加入 tldr；Codex、Cursor、Pi 继续递归发现，CLI leaf-skill 测试与 Pi `/tldr` alias 测试通过。
- T3: Routing fixtures 28/28（precision/recall 1.0）、npm tests 83/83、Pi tests 8/8、local quality gate/resource checks、OpenAI quick validation、JSON/英文扫描及完整 `git diff --check` 均通过。
- Review gate: Skipped — 用户未要求独立 adversarial review；按任务契约跳过。

## Verification

- Passed: 最终验证通过：npm test、npm run test:pi、routing eval、OpenAI quick validation、local quality gate validate、resource boundary、manifest/package shape 与 git diff --check。
