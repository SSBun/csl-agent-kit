# 精简任务面板为标题状态与进度

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-23 15:20) |
| Artifacts | [Artifacts](../artifacts/compact-task-panel/) |
| Kind | Task |

## Target
- [x] T1: 任务面板所有区域均不再显示当前产物、下一动作、所需输入和阻塞恢复详情。
- [x] T2: 任务标题、状态、进度及任务记录中的完整交接信息保持不变。

## Scope

仅精简 Pi 任务展示，不修改共享 core、任务记录格式或已有任务的交接内容；分区、Topic 面板、任务链接和刷新机制保持不变。保留无关未提交改动，不运行单元测试或项目测试套件。

## Plan

1. 移除任务面板的恢复详情渲染及不再需要的依赖。
2. 同步回归断言、使用说明和受影响 Context。
3. 检查语法、直接观察渲染结果并对照本任务修改前副本，记录完成证据。

## Task Summary

**Pi 任务面板**：[pi/extensions](../../pi/extensions/) 移除恢复详情渲染、专用标签、可见性参数和不再需要的 task-core 依赖；任务条目统一保持单行标题、状态及进度，This Session／Workspace 分组保持不变。

**任务面板回归断言**：[tests](../../tests/) 同步 This Session 与 Topic 并排展示、活动／阻塞／取消任务聚焦和恢复内容变化的断言，要求面板始终不展示交接详情且不改写记录。

**使用说明**：[README.md](../../README.md) 说明面板统一采用精简条目，完整交接信息保留在任务记录中。

## Decisions

- 自查使用 Node TS／JS 语法检查、渲染预览和修改前后的增量比较；未运行单元测试或项目测试套件，也未调用包含测试的 npm run check。
- 直接渲染预览覆盖 Pending、In Progress、Blocked、Cancelled、Completed、Aborted 聚焦，以及无聚焦、清除、失效聚焦、RPC 和 /tasks。全部只展示标题、状态及 1/2 进度；样例索引和六份完整任务记录前后字节相同。
- 自查确认任务排序、数量限制、链接生成、进度计算、Topic 展示和刷新入口未修改；共享 core 与其他任务交接内容未改。真实 Pi 会话需 reload 后采用新代码，本次未执行宿主热重载。
- Context 更新仅涉及 CTX-pi-task-overlay 的展示与依赖事实；validate 通过，三个原有未索引章节警告保留，不影响本任务使用的有效 Pack。未修改 Skill package，无需 Skill Quality 检查。

## Result

- T1: 渲染预览覆盖六种任务状态聚焦、无聚焦、清除及失效聚焦、RPC 和 /tasks，全部无当前产物、下一动作、所需输入及 Block 恢复详情；源码已删除恢复渲染与专用依赖。
- T2: 所有预览保留任务标题、对应状态图标及 1/2 进度；样例索引与六份完整任务记录前后字节相同。相对修改前副本的增量核对确认进度、链接、排序、分组、Topic 与刷新逻辑未改，共享 core 和其他任务内容未改。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 仅删除只读导航中的详情渲染，剩余单行条目沿用既有格式；不改变任务记录或生命周期。
- Snapshot: snapshot:tasks/artifacts/compact-task-panel/evidence/1599215f5e417f26fba6571f052f7833d8e5eec181d2a19e1b25da5ec792880f.json#1599215f5e417f26fba6571f052f7833d8e5eec181d2a19e1b25da5ec792880f
- Evidence: T1/T2 的直接渲染观察与增量比较；TS/JS 语法检查、Context validate、git diff --check 通过。回归断言已更新，未运行测试套件或真实宿主 reload；Context 保留三个原有未索引章节警告。
- Result clarity: 用户已确认包括 This Session 在内均仅显示标题、状态和进度，完整交接信息留在任务记录。
- Bounded impact: 恢复渲染只有 renderTaskLines 一处调用，已连同专用标签、参数及依赖删除；其他入口沿用同一单行渲染，/tasks 保持原有精简输出。
- Low risk: 只读 UI 精简且易于恢复，不涉及授权、安全、持久化内容或数据丢失；任务记录及共享 core 不变。
- Sufficient verification: 六种状态与多种焦点和输出模式直接渲染观察支持显示条件；完整样例记录字节比对与源码增量支持保留行为，语法检查通过。未运行测试套件。
- Task fingerprint: 1d257963f7127318f15420deb022ba7f1988257c756292996703cfe0182c7bea

## Verification

- Passed: 最后重跑 TS/JS 语法检查和 git diff --check 均通过，task_focus 确认当前任务；最终四文件身份已由 managed snapshot 冻结并在终态写入时重验。
