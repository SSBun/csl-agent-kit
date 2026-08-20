# 退役 analyze-project 并统一 tldr 能力

Status: Completed (2026-08-20 17:16)
Kind: Queue

## Scope

- 包含：按顺序退役并归档 `analyze-project`，随后统一 `tldr` 的简略与深入能力并移除全局 `/explore`。
- 不包含：改写历史任务、PRD、既有分析报告和归档评测产物；除非用户另行明确要求，不运行项目或单元测试套件。

## Target
- [x] T1: analyze-project 不再被发现且源码完整归档，tldr 成为简略与深入理解的唯一入口，旧 explore 模板移除并通过集成验证。

## Plan

1. 完成 `deprecate-analyze-project-skill`，确认活动发现清理和源码归档后再继续。
2. 完成 `merge-tldr-explore-skills`，以前序退役结果作为路由边界。
3. 对组合后的共享发现、Pi 命令、文档、Context 与 skill 审计执行父级集成验证。

## Children

1. [设计 analyze-project 技能退役方案](deprecate-analyze-project-skill.md)
2. [设计 tldr 与 explore 技能合并方案](merge-tldr-explore-skills.md)

## Result

- T1: Both ordered children completed. analyze-project is absent from active paths, manifests, README, Context, Pi aliases, and the npm package while its 6-file package is hash-preserved under deprecated/analyze-project. tldr is the sole brief/detailed chat-understanding entry, and the global explore prompt template is absent.
- Review gate: Skipped — Independent review was not requested.

## Verification

- Passed: Integrated identity/discovery assertions, Pi alias discovery, semantic routing evaluation (30/30), Yao checks, resource boundaries, JSON/YAML parsing, npm pack dry-run, Context validation, archive hashes, child/parent task validation, and git diff --check passed. Project/unit tests were not run because the user did not request them. An unrelated pre-existing Claude manifest parity drift remains: active task-grill is not listed.
