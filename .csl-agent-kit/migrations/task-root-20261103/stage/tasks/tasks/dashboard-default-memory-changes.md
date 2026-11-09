# Dashboard 默认仅展示实际记忆变更记录

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-03 18:03) |
| Artifacts | [Artifacts](../artifacts/dashboard-default-memory-changes) |
| Kind | Task |

## Scope

调整截图所示维护队列的默认展示，不删除历史数据，不修改维护执行、授权和存储行为。CLI/API 未指定筛选时保持原行为。

## Plan

1. 在分页前按已记录 transaction 筛选队列，前端默认启用并允许选择全部记录。
2. 通过当前数据只读检查及浏览器交互核验筛选、分页与详情浮窗。

## Execution Log

### 001 — 筛选依据与实现

确认 effects 的 transaction 来自成功提交或已提交变更的去重恢复；proposal 本身不表示实际写入。queue.list 增加可选 changesOnly，在分页前过滤；HTTP 参数仅字符串 true 启用。界面默认选中仅有记忆变更，同时可切回全部记录；保留失败或中断但带 transaction 的记录。

### 002 — 验证及运行环境限制

当前真实队列只读查询为115条，其中36条带 transaction。每页7条遍历筛选结果，与完整队列的 transaction 筛选 ID 顺序一致；其中1条为失败或中断。未指定筛选的 API 行为保持115条。Chrome 使用实际前端资源与模拟 API，观察默认请求 changesOnly=true，切换全部后为 false 且 offset=0；浮窗打开、关闭、焦点恢复、窄屏继续通过。三份 JS 的 node --check 和 git diff --check 通过。未运行单元测试或项目测试套件。

现有 Memory daemon 有1个活跃维护任务，未中断或重启。旧进程仍需空闲后重启才能加载新的后端筛选代码；已向用户披露，当前运行页面尚未切换。

### 003 — 修正未生效的交付

用户截图显示无变更记录仍在默认列表。真实服务复现 changesOnly=true 返回120条，前100条有69条无transaction，截图记录包含在内，证明旧daemon未加载新代码。前次代码完成不等于实际界面生效，撤回该交付判断。确认后台active=0后调用既有带ifIdle保护的restart入口成功启动新进程，没有中断活动任务。

筛选器从折叠的范围区移到顶部记录区，增加change自动提交，切换立即刷新并重置分页。真实Chrome连接实际授权Dashboard验证默认1—20/37、全部1—20/120、切回1—20/37；筛选器可见，只有记录区展开，详情浮窗包含1条transaction。真实接口返回37条，全部带transaction，截图中的无变更记录已排除。通过本机open打开新的授权Dashboard，未打印或保存凭据。此结果取代002的待重启限制。未运行测试套件。

## Task Summary

**Memory 服务及审计 Dashboard**：组件 [memory](../../../bin/memory) 增加可选的分页前记忆变更筛选，Dashboard 默认启用，提供顶部可见且切换立即生效的全部记录选项并调整表单列布局。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 使用已有 effects.transaction，无额外索引或逐条详情请求。 | 无已知实质缺口。 |
| 稳定性 | A | 真实服务和Chrome验证37条默认变更记录、120条全部记录及切换回默认；详情浮窗正常；重启经过ifIdle检查。 | 未运行单元或项目测试套件。 |
| 完整性 | S | 实际运行服务已加载筛选，默认列表无无变更记录且排除截图记录，顶部筛选可见并立即生效。 | 记录数为验证时刻快照，后台维护可继续新增记录。 |

## Target
- [x] T1: Dashboard 默认仅展示实际产生记忆变更的记录，过滤未改变记忆的记录。
- [x] T2: 实际运行的 Dashboard 默认筛选生效，用户截图中的无变更记录不再出现在默认列表，并可使用可见筛选器切换全部记录。

## Result

- T1: 实际运行API默认筛选参数返回37条，全部带transaction；全部记录120条。截图无变更记录已排除。
- T2: 空闲保护重启后，Chrome连接真实Dashboard观察默认1—20/37、可见筛选切换全部立即1—20/120、切回1—20/37；详情浮窗正常。已打开当前有效Dashboard。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 修复旧进程未加载筛选并将现有筛选控件移到可见记录区，数据逻辑不扩展。
- Snapshot: snapshot:tasks/artifacts/dashboard-default-memory-changes/evidence/905853a6a734e062f5f0dae3a8ce8e26112c2113375057c52cd491a2e5462667.json#905853a6a734e062f5f0dae3a8ce8e26112c2113375057c52cd491a2e5462667
- Evidence: Execution Log 003和当前T1/T2真实HTTP与Chrome观察。
- Result clarity: 要求默认不出现未改记忆记录，截图记录已真实排除。
- Bounded impact: 复用已存在筛选与表单提交逻辑，无新存储或授权行为。
- Low risk: 仅列表展示与带ifIdle保护的空闲重启，无历史删除或维护任务中断。
- Sufficient verification: 真实HTTP核验37条全部有transaction，Chrome验证可见默认筛选和切换、实际详情，语法及diff检查通过；未运行测试套件。
- Task fingerprint: 0082f3e4745aaa0d60955aa2ce7562651f2d02aa90c1af6aeecd85deeca2bb9f

## Verification

- Passed: 当前JS语法及diff检查通过；真实服务筛选和Chrome观察覆盖当前内容，截图记录默认排除且顶部筛选可见。
