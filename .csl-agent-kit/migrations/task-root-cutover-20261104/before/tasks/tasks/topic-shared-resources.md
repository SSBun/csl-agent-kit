# 为长期 Topic 增加共享资料目录与索引

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-13 18:17) |
| Artifacts | [Artifacts](../artifacts/topic-shared-resources/) |
| Kind | Task |

## Scope

为 Topic 增加按用途分类的共享资料索引和 resources 存储约定；资料正文由正常文件工具在授权任务内维护，CLI 管理引用与版本，不自动复制已有来源、不迁移历史产物。保留原有 specifications、revisions、Task artifacts 职责。

## Plan

1. 扩展 Topic 读写契约：主文档展示 Resources，兼容旧记录；规范性资料纳入规格投影，参考资料排除。
2. 增加显式更新资源索引的 CLI，维护乐观版本与来源安全校验；同步 Topic/Task 文档。
3. 增加资源分类、链接、摘要失效与旧记录兼容的回归定义，执行当前授权范围内检查并完成所需审查。

## Task Summary

**Topic 数据与 CLI**：["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared) — 增加 Resources 可点击索引和 update-resources 命令，将规范性资料纳入规格摘要及来源核对，参考资料排除；保留无 Resources 的旧记录格式。

**Topic 工作流**：["/Users/caishilin/Desktop/personal/skills/skills/meta/topic"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/topic) — 定义共享 resources 目录、资料分类及索引维护方式，区分长期资料和任务专属产物。

**Task 产物规则**：["/Users/caishilin/Desktop/personal/skills/skills/meta/task"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/task) — 增加 Topic 共享材料与 Task artifacts 的归属边界，已有权威来源仅引用。

**回归与说明**：["/Users/caishilin/Desktop/personal/skills/tests"](file:///Users/caishilin/Desktop/personal/skills/tests)、["/Users/caishilin/Desktop/personal/skills/README.md"](file:///Users/caishilin/Desktop/personal/skills/README.md) — 补充资料分类、链接、版本失效、旧格式与 CLI 用例，并更新公开说明。

## Target
- [x] T1: Topic 支持主题级 resources 目录及主文档 Resources 索引，记录资料链接、用途和有效约定/参考材料分类。
- [x] T2: 影响实现与验收的资料纳入现有规格版本核对；纯参考资料变更不使任务证据失效。
- [x] T3: 保留 Topic 主文档、revisions 和任务产物的既有职责；已有权威文件仅引用，不自动复制或迁移历史资料。

## Review Reports

| Round | Report | Snapshot | Outcome |
| --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/topic-shared-resources/reviews/round-01.md) | evidence/scope-01.json | findings: TR-1 |
| 02 | [Round 02](../artifacts/topic-shared-resources/reviews/round-02.md) | evidence/scope-02.json | no blocking findings; TR-1 resolved; SHA matched |

## Result

- T1: 新Topic创建resources目录与可点击Resources表；update-resources提供完整索引替换和purpose/kind/target校验，show返回目录和标准资源项。CLI演示见evidence/cli-resource-example.md，8个资源回归覆盖表与链接。
- T2: 规范资源进入spec投影并核对文件sha，reference变化不改revision/任务正文；TR-1路径去重改用与读取一致的safePath。专项回归修复前缺少拒绝、修复后通过（tr1-before-fix.log/tr1-after-fix.log）；当前Topic+core69/69通过（unit-tests-03.log），快照scope-02.json。
- T3: 旧记录形状及digest兼容、无自动copy/delete/migrate、文件/URL/归档校验均有当前69/69回归覆盖；两包质量仅context-budget警告无失败，语法及Context检查通过（checks-02.log）。
- Review gate: Passed — 第02轮fresh独立审查（5731133d-63df-4a9e-8549-c92873ff7328）确认TR-1解决且无新增finding；报告round-02.md已保存索引；主Agent复算7文件SHA一致，解除唯一快照绑定条件性阻断。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 共享记录格式和规范性资源版本门禁变更；TR-1修复后保留fresh复审义务。
- Snapshot: tasks/artifacts/topic-shared-resources/evidence/scope-02.json
- Evidence: T1-T3；7文件scope-02/task-owned-02；69/69测试、TR-1红绿回归和两包质量检查。
- Task fingerprint: 7de76cfc72690f21bb0f759fc3ba0df8a3cf1863bf5819d7e2be0116e185914d

## Verification

- Passed: 审查后最终Topic+core单测69/69通过（unit-tests-final.log）；7文件摘要仍与scope-02一致；Context及diff检查通过，两轮报告有效。两包Skill质量无失败，仅context-budget警告。未做全宿主新会话回放。
