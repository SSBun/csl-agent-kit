# 合并 code-reviewer 与 code-review

Status: Completed (2026-08-09 21:45)
Kind: Plan

## Scope

- Included: 建立一个合并后的共享代码审查技能，收敛发现身份、审查契约、必要 references、接口元数据、回归夹具、当前文档和插件清单。
- Included: 移除 `skills/mattpocock/code-review/` 的 vendored 副本与来源元数据，并同步第三方技能清单和示例。
- Excluded: 修改上游 `mattpocock/skills`、执行实际全局安装、改变 `adversarial-review` 的显式触发边界、改写历史任务或历史分析报告。

## Target
- [x] T1: 当前共享技能只暴露一个 project-owned canonical code-review；其目录、frontmatter、README、manifest 与 slash identity 均为 code-review，旧 code-reviewer 与 vendored 重复副本不再被发现。
- [x] T2: 合并后的 code-review 同时支持 PR/MR、用户提供的 diff 与固定比较点，优先检查正确性、安全和数据风险，并在有证据时检查 Spec 与仓库 Standards，同时覆盖测试和可维护性。
- [x] T3: 审查输出按严重级别集中呈现，每项包含 lens、file:line、影响、证据与可执行修复；普通审查不强制固定点、spec、并行 subagent 或 adversarial approval。
- [x] T4: 当前文档、发现清单、第三方来源清单与示例、相邻技能引用和测试只使用 canonical code-review；历史任务与历史分析产物保持不变。
- [x] T5: 路由与输出契约回归、skill discovery、manifest/JSON、Yao、resource boundary、diff check 与旧身份残留检查全部通过。

## Decisions

- Canonical identity 采用 `code-review`，位置为 project-owned `skills/code-review/`；`code-reviewer` 不保留兼容 alias，确保只有一个当前发现身份。
- 合并后的默认流程是普通单次审查，不要求用户必须提供 fixed point 或 spec；PR/MR、现成 diff、当前 worktree 和用户明确给出的比较点都是有效输入。
- 审查顺序先处理 correctness、security 与 data safety，再处理 Spec、documented Standards、tests 和 maintainability；Spec 或 Standards 缅缺时跳过对应 lens 并明确说明，不阻塞普通审查。
- 输出使用一个按 `Critical`、`Suggestion`、`Nit` 排序的 findings 集合，以 lens 标签保留 Correctness、Security、Spec、Standards、Tests 和 Maintainability 来源；不维持两份互不排序的并行报告。
- 每项 finding 必须包含 lens、`file:line`、impact、evidence 和具体修复；没有发现时明确报告无发现和未验证边界，禁止用风格偏好填充结果。
- 不强制并行 subagent，也不触发 `adversarial-review`；独立 Reviewer–Editor 审批仍只由用户明确请求进入。
- 保留 `code-reviewer` 当前三份简洁 reference 的有效检查内容，只吸收 vendored `code-review` 独有的比较点、Spec 来源和仓库 Standards 选择语义；不复制其完整 prose 或重复 Fowler smell 清单。
- 新 canonical package 使用英文 Agent-facing prose，采用本项目 `agents/interface.yaml` 契约，并增加最小路由与输出契约夹具。
- 删除 vendored `code-review` 后，第三方来源测试移除该条目；当前 integration 示例改用仍存在的第三方 skill。历史任务和分析报告中的旧名称不迁移。

## Plan

1. 建立 canonical `code-review` package，合并两者非重复的输入解析、审查 lenses、finding 契约与必要运行时资源。
2. 移除两个旧来源位置中的重复身份，更新当前发现清单、README、marketplace、相邻路由引用及第三方来源清单和示例。
3. 增加最小路由、输出和旧身份拒绝回归，运行发现测试、项目检查、Yao、resource-boundary、JSON/manifest、残留搜索和 `git diff --check`。

## Result

- T1: npx skills discovery 仅列出一个 code-review；npm pack 含 9 个 canonical 文件且旧 code-reviewer、vendored code-review 路径均为 0；插件 manifest 与 README 已统一。
- T2: SKILL.md、review_workflow.md 与 contract_cases.json 覆盖 PR/MR、现成 diff、worktree、固定点及 Correctness/Security/Data Safety、Spec、Standards、Tests、Maintainability lenses。
- T3: 合并契约按 Critical/Suggestion/Nit 排序，并强制 lens、file:line、impact、evidence、fix；contract cases 断言普通审查不要求 fixed point、spec、subagent 或 adversarial approval。
- T4: 当前 README、全部插件 manifest、相邻 adversarial-review 路由、第三方 integration 示例与测试已使用 code-review；全局残留搜索只剩两条旧名不存在的负向断言。
- T5: npm run check 全部通过（CLI 27、Triggerify 29、Tasks 26、Pi 8）；code-review 路由 23/23、adversarial 邻域 28/28；Yao/resource、JSON、discovery、pack dry-run、Context validate 与 git diff --check 均通过。
- Review gate: Skipped — 用户未要求 adversarial、双 Agent 或独立 Reviewer 审查；已完成普通自审与确定性验证。

## Verification

- Passed: 最终复跑 npm run check、两组 trigger eval、两个受影响 skill 的 Yao/resource、JSON/manifest、skill discovery、npm pack、旧身份搜索、Context validate 与 git diff --check，结果均通过。
