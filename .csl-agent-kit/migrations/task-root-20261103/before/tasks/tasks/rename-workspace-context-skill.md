# 将 workspace-maintain-context 重命名为 workspace-context

Status: Completed (2026-08-09 20:17)
Kind: Task

## Target
- [x] T1: 当前 canonical skill 的目录、frontmatter name、Agent metadata 和 slash/discovery identity 全部为 workspace-context，且不存在旧 skill 兼容别名。
- [x] T2: 当前 README、manifest、默认 Agent rules、workflow gates、CSL Task consumer、Context Authority、分析文档和测试只引用 workspace-context；历史 task records 保持不变。
- [x] T3: 重命名后的 CLI、Context schema、query/admission behavior 和现有 workflow 契约保持不变。
- [x] T4: skill discovery、Pi command、focused tests、routing、OpenAI validation、local quality gate、resource-boundary、Context validation 和残留搜索满足门禁。

## Result

- T1: Canonical directory、frontmatter name、Agent default prompts、README slash aliases、Claude manifest 与 Pi discovery 均为 `workspace-context`；旧目录不存在且 tests 明确拒绝旧 alias。
- T2: README、manifest、super-agent AGENTS、workflow gates、csl-task consumer、Project Core、CTX-workspace-context、评分报告和当前 tests 已同步；旧名只保留在历史 task/report 或负向拒绝断言。
- T3: 重命名后的 `context.js --self-test` 与实际 Context validate 通过，focused task tests 26/26 通过，Core/Pack schema 和 workflow 正文未发生语义改写。
- T4: `npm test`、Pi tests 8/8、routing 13/13、OpenAI quick validation、Claude manifest、34 leaf discovery、Agent symlink comparison、Context validation 与 diff check 通过；local quality gate 仅有允许的 initial-load token overage。
- Review gate: Skipped — 用户未要求 adversarial、双 Agent 或独立 Reviewer 审查。

## Verification

- Passed: 全套 npm 与 Pi tests、CLI self-test、实际 Context validation、routing、OpenAI validation、discovery/manifest/残留搜索、Agent symlinks、local quality gate 除允许 token 超限外的门禁及 git diff check 均符合结果。
