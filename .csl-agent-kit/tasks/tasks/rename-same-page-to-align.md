# 将 same-page 重命名为 align

Status: Completed (2026-08-09 20:38)
Kind: Task

## Scope

- Included: 重命名当前技能包、发现身份、README 与技能内部标题/引用。
- Excluded: 历史任务记录和历史分析产物；不保留旧名称兼容别名。

## Target
- [x] T1: 当前技能目录、frontmatter name、发现清单和 slash identity 均使用 align，旧 same-page 不再作为当前技能暴露。
- [x] T2: align 保留原 same-page 的重新解释、证据校验、置信度和可选 ASCII 图能力，当前文档与运行时引用同步为新名称。
- [x] T3: 相关发现测试、技能校验、资源边界检查和旧名称残留检查通过；历史任务与历史分析记录保持不变。

## Plan

1. 将技能包和内部身份重命名为 `align`，不改变行为契约。
2. 同步当前 README、插件清单和测试中的发现名称。
3. 运行定向搜索、发现测试与技能包验证，记录结果并完成任务。

## Result

- T1: skills/align、三份插件清单与 README 均使用 align；Pi 命令测试确认 /align 存在且 /same-page 不存在。
- T2: 将 HEAD 中旧技能正文按三处身份替换后与新 SKILL.md 完全一致，reference 除标题和文件名外完全一致；能力契约保持不变。
- T3: 25 项发现/安装测试、local quality gate validate、resource boundary、JSON 解析、git diff --check 与旧身份定向检查均通过；历史记录未修改。
- Review gate: Skipped — 用户未要求 adversarial、双 Agent 或独立 Reviewer 审查。

## Verification

- Passed: local quality gate 全步骤通过，resource boundary 无失败，node --test 25/25 通过，canonical identity 与 behavior-preservation 断言通过。
