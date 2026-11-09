# 核对 Pi 任务面板的目录迁移兼容性

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-03 19:58) |
| Kind | Task |

## Scope

只读核对截图中的Pi任务面板与相关核心路径，不移动任务数据、不修改插件或运行测试。

## Execution Log

### 001 — 旧路径依赖已确认

csl-task-overlay.ts第101/173行固定读取旧tasks/tasks.md；第45/50/63行固定Task/Topic文件和Topic索引，第86/215/276行固定链接及进度正文路径，第195行固定缓存范围。第482—484行task_focus依赖loadTasks查找任务，索引搬走会报Canonical task not found。loadTasks缺失索引时返回空数组，并非自动寻找统一数据根。

task-core.js第33—38行仍固定tasks/tasks与tasks/tasks.md，产物位置第623行亦为旧树；topic-core.js的记录、索引及事务位置仍为旧树。结论：仅移动目录或只改规范不能正确显示新数据；删除旧源可能空面板/缺项，保留旧源则可能继续显示旧数据。需协调核心读写、面板索引/链接/进度/focus/Topic与证据迁移后再切换，不能只改面板常量。未进行实际搬迁验证。

## Task Summary

没有修改代码或数据，仅核对现有读取链路。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 直接读取面板及核心路径定义，未引入修改。 | 无已知额外复杂度。 |
| 稳定性 | A | 硬编码路径、缺失处理和focus校验提供直接源码证据。 | 未在真实工作区移动数据做运行复现。 |
| 完整性 | A | 回答能否读取及必要的配套范围，区分Memory与Task目录。 | 尚未设计或实现统一路径解析及迁移。 |

## Target
- [x] T1: 根据当前面板及Task核心源码，说明迁移任务目录后能否正确读取及所需配套变更，不修改运行时或数据。

## Result

- T1: 面板旧索引/正文/Topic/链接/缓存路径写死；focus依赖旧索引。Task及Topic核心也使用旧树。因此只移动任务目录不能可靠读取，必须同步消费者与核心后再迁移。源码位置见Log001；未实施搬迁或修改。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R0
- State: Current
- Reason: 只读兼容性调查，无交付文件修改。
- Snapshot: no-file:overlay-lines-45-101-173-195-215-276-482/task-core-33-38-623/topic-core-paths
- Evidence: Log001源码调用链与Self Assessment。
- Task fingerprint: 11687e6f27860a74ee5b723bc6df9986a085075f5dadee1ae20ec13877960797

## Verification

- Passed: 已核对loadTasks缺失返回空数组及task_focus查索引拒绝行为；Task核心和Topic路径与结论一致。未运行测试或迁移。
