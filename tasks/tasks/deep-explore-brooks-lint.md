# 深度探索 brooks-lint

Status: Completed (2026-08-07 19:25)

## Target

- [x] T1：将用户确认的 14 项探索指南保存到全新的 `tasks/reports/2026-08-07-brooks-lint/`，并逐项记录完成状态与来源。
- [x] T2：主报告包含 Summary、Key facts、How it works / Structure、Context、Open questions / Limitations 和 Sources 六个指定章节。
- [x] T3：重要事实均绑定实际查阅来源，明确区分事实、推断与未知，并如实记录来源冲突。
- [x] T4：报告覆盖项目身份、诊断模型、功能表面、组件结构、运行机制、评分与引用、评测、分发、维护、领域背景和限制。
- [x] T5：将用户确认的修订指南保存到新的 `tasks/reports/2026-08-07-brooks-lint-2/`，不覆盖首次探索。
- [x] T6：修订报告保留六个指定章节，并按“准确定义 → 用途与概念 → 工作原理 → 实现 → 背景 → 认知边界”组织内容。
- [x] T7：修订报告复用并保持既有来源与证据标签，将限制、未知和冲突解释为认知边界而非项目缺陷清单。
- [x] T8：首次探索目录保持不变；新指南、报告、引用、内部链接和任务记录通过确定性验证。

## Scope

- 包含：基于 commit `814174cd5b340bc0d8b0161b6d8288980428a44d` 与既有 61 个来源，在全新探索目录中重组指南和报告。
- 不包含：覆盖首次探索、无必要的重新取证、安装或运行 brooks-lint、修改目标仓库、执行安全审计、独立核验无法取得的完整书籍原文。

## Plan

1. 创建新的探索目录并保存用户确认的修订指南。
2. 复用既有证据，将报告重组为 definition-first 的解释性结构。
3. 校验六个指定章节、证据标签、来源、覆盖链接和旧目录不变性。

## Result

- T1：已在全新目录 `tasks/reports/2026-08-07-brooks-lint/` 保存批准后的 `explore-guide.md`；P01–P14 均按顺序记录结论、来源状态并链接主报告。
- T2：`report.md` 已生成且六个指定二级章节各出现一次；未创建不必要的 `sections/`。
- T3：报告使用 `[确认]`、`[项目自述]`、`[推断]`、`[未知]`、`[冲突]`，列出并定义 61 个实际查阅来源；固定 commit 文件路径、引用定义和内部锚点均通过脚本检查。
- T4：报告覆盖表将 P01–P14 映射到项目身份、taxonomy、六模式、结构、交互/CI 机制、评分、引用、评测、分发、维护、官方替代方案和限制章节；所有项均为 `[x]`。
- 验证：确定性 Markdown 契约检查通过（6 个指定章节、6 个内部锚点、61 个来源、P01–P14、固定 commit 文件路径）；`git diff --check` 与 `npm run test:tasks`（14/14）通过。
- T5：新目录 `tasks/reports/2026-08-07-brooks-lint-2/` 已保存用户批准的 14 项修订指南；P01–P14 均按顺序完成并链接报告，首次探索目录未被复用或覆盖。
- T6：修订 `report.md` 保留 Summary、Key facts、How it works / Structure、Context、Open questions / Limitations、Sources 六节；Summary 首句给出准确定义，主体依次解释心智模型、架构、交互/CI 流程、源码实现、示例和集成。
- T7：报告复用 56 个固定 commit 仓库来源与 5 个官方对照来源，并保留 `[确认]`、`[项目自述]`、`[推断]`、`[未知]`、`[冲突]`；第五节明确作为认知边界而非缺陷清单。
- T8：确定性检查确认 6 个章节、P01–P14 完成与链接、61 个引用定义、内部锚点和 fresh output；首次探索文件 mtime 保持 13:29/13:30，新报告文件写于 19:22/19:23；`git diff --check` 与 `npm run check` 通过。
- Review gate: Skipped — no explicit user request.
