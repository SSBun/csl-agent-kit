# 记忆记录列表顶部增加用户及项目筛选面板

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-04 16:43) |
| Artifacts | [Artifacts](../artifacts/dashboard-memory-scope-filter/) |
| Kind | Task |

## Scope

仅调整Dashboard前端筛选与呈现，不修改记忆或后台查询。当前源码已使用commits-only/v1的提交列表，复用现有scope/workspace筛选语义，不恢复旧jobs历史模型。项目候选来自已发现的Agent工作区及已加载提交，可手动输入其他项目绝对路径，不宣称候选是完整注册库。

## Plan

1. 将作用域与项目筛选移至记录列表上方，保留高级会话及任务条件。
2. 用户/全部范围不带项目路径；切换和重置同步分页，加载失败不残留旧范围结果。
3. 验证真实数据的全部、用户、指定项目、分页、详情、重置和错误恢复，以及窄屏布局。

## Execution Log

### 001 — 现状与实现

用户确认后读取当前源码，发现另有已完成的commits-only历史改造：主列表直接读取已提交事务，后端已按scope/project roots先筛选再全局排序分页。本任务保留该现状，仅在metrics与records之间新增可见form。范围为全部/用户/项目，项目使用原生datalist辅助输入，候选合并Agent工作区和当前提交路径。原折叠范围区保留为高级筛选，其字段通过form属性归属顶部表单。用户或全部范围忽略保留的项目输入；重置清理全部条件；范围/项目change即时提交。

### 002 — 结果一致性保护

切换或刷新时清空主列表、显示加载并禁用分页，失败时显示当前范围无法加载而非旧记录。异步刷新增加generation异常检查，旧请求的失败不会覆盖新筛选。摘要提示是否叠加高级条件，避免隐藏的会话/任务条件造成误解。既有committed-only、最新优先、单条文件变更摘要及完整对比不变。

### 003 — 真实浏览器验证

Chrome实际页面观察顶部面板可见且在records之前，只有记录区默认展开，7个项目候选。全部497条，指定skills项目128条；页面行ID顺序与当前scope接口结果一致，项目第二页21—40/128。切用户后1—3/3，旧项目输入虽保留但disabled且有效workspace为空、offset=0。项目与用户详情元数据scope正确，项目详情workspace正确。高级不存在session返回0条并提示叠加筛选；重置后scope=all、workspace/session/task均清空并恢复20行。无效项目清空旧行、显示错误、禁用分页，随后切用户可恢复。390px窄屏无横向溢出；已目检[桌面](../artifacts/dashboard-memory-scope-filter/evidence/desktop.png)及[窄屏](../artifacts/dashboard-memory-scope-filter/evidence/mobile.png)截图。JS语法及git diff --check通过，未运行单元或项目测试套件，未执行真实写入。

本任务未重启后台，不需要更换访问地址。task_focus返回Canonical task not found已在对齐时披露，未复制或迁移任务。

## Task Summary

**Memory Dashboard**：组件 [web](../../../bin/memory/web/) 增加列表顶部的用户/项目范围筛选，提供已发现项目候选与路径输入，保留高级条件并支持重置；同步分页、详情及加载失败反馈，避免旧范围结果残留。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 复用已有scope/workspace API与原生form/datalist，无新依赖或后台修改。 | 项目候选为已发现范围，可手动补充路径。 |
| 稳定性 | A | 真实页面验证全部/用户/项目及分页、详情、错误恢复和重置；只读前端改动。 | 未运行测试套件，未跨浏览器验证。 |
| 完整性 | A | 顶部面板位置、实际范围筛选及窄屏均已观察，现有提交记录与详情保留。 | task_focus绑定异常已披露；不宣称候选涵盖所有未知项目。 |

## Target
- [x] T1: 记忆记录列表顶部提供可见筛选面板，可选择仅用户记忆变更或指定项目的记忆变更。
- [x] T2: 列表及分页与所选筛选范围一致，保留现有仅变更筛选、最新优先和详情查看。

## Result

- T1: 真实Chrome确认metrics下/records上筛选面板可见，全部/用户/项目可选，已发现项目7个候选并可输入路径；390px窄屏无溢出。
- T2: 全部497条、指定项目128条、用户3条；页面行顺序与接口一致。项目分页21—40/128，切用户重置1—3/3且不带旧项目路径。详情scope对应正确，重置清空所有条件，无效项目不残留旧行并可切用户恢复。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 复用既有只读scope/workspace查询，仅调整筛选入口和展示状态，无后台或写入逻辑变更。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/dashboard-memory-scope-filter/evidence/dbbf242101e91177aade96de8f38c647f9744a1a8557d08f52694bd2ccc37208.json#dbbf242101e91177aade96de8f38c647f9744a1a8557d08f52694bd2ccc37208
- Evidence: Execution Log 003真实浏览器结果及桌面/窄屏截图，当前JS语法与diff检查通过。
- Result clarity: 用户确认顶部可选用户或具体项目记忆变更，实际范围以事务scope而非来源会话区分。
- Bounded impact: 三个前端资源，沿用现有表单字段和只读API；无服务重启、迁移或额外接口。
- Low risk: 纯查询筛选和文本呈现，不更改记忆/权限；加载错误时清空旧范围结果，generation保护保留。
- Sufficient verification: 实际Chrome及现有API对照全部/用户/指定项目、跨页、详情、重置、无效路径恢复及窄屏；未运行测试套件。候选不承诺完整注册库。
- Task fingerprint: 89c976b585fc8c238e108a91770782388eef7ff1b7f7d80050a6c7b6ce54e20b

## Verification

- Passed: 最终JS语法及diff检查通过，源码/截图快照一致；真实页面验证范围与分页及详情正确。本次未重启服务；task_focus异常已披露，规范任务记录正常维护。
