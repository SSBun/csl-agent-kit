# Dashboard 精简信息并增加当前记忆库

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-04 17:18) |
| Artifacts | [Artifacts](../artifacts/dashboard-current-memory-library/) |
| Kind | Task |

## Scope

用户已确认移除截图标记的四个区块并增加当前记忆浏览。只调整Dashboard呈现及增加已授权只读列表接口；保留后端索引/Agent/提案数据和CLI能力，不编辑或删除实际记忆。当前有效条目沿用store语义，即exists且非deleted，不宣称知识语义永远正确。

## Plan

1. 增加当前记忆库列表，按用户/项目作用域聚合、过滤墓碑、排序后分页。
2. 默认展示记忆库，保留变更记录切换入口，共用顶部范围筛选。
3. 点击条目通过已有read接口读取最新完整正文与来源，只读单栏呈现；差异查看仍保留原模式。
4. 去除四个多余面板及其请求/回调，在空闲时加载接口并验证真实页面。

## Execution Log

### 001 — 界面精简与只读列表

新增library.js和认证之后的GET /api/memories，只返回当前未删除条目的标题、摘要、类型、版本、时间及作用域/工作区；正文不在列表批量返回。范围校验及缺失已知工作区处理沿用现有commits规则；先筛选/全局排序再分页。客户端增加记忆库/变更记录两个入口，默认当前库；通过现有/api/read读取正文，读取期间删除或不存在则明确报错。内容使用textContent，完整Markdown纯文本加来源元数据，不提供编辑/删除动作。

移除高级筛选、原始索引、Agents、提案四个区块及其前端字段/请求/回调，保留service和jobs；没有删除后端对应能力或数据。agent列表返回仍仅用于填充项目候选。更新文档说明当前库与历史事务的区别。

### 002 — 数据与边界核验

真实当前数据只读核对：已知根目录合计223条active、3条deleted，library总数223。项目55条按7条分页遍历，ID集合与原始active集合完全相同。user全部为user，project全部为project，列表无body。非法scope、负offset、超限limit分别返回INVALID_SCOPE/INVALID_PAGE。初查服务active=1未中断，等待空闲后通过ifIdle重启加载接口，端口55815及授权令牌保持一致。

### 003 — 真实页面验证

实际Chrome默认记忆库1—20/223，四区块不存在，服务和队列保留；列表标题与真实API逐项一致。查看时完整body与最新read响应相同、标题相同、sources保留、左右对比和变更摘要隐藏、actions为空。Esc返回触发按钮。user为1—1/1，指定项目1—20/55并可到21—40/55；切变更记录后20行及原摘要/双栏恢复。390px正文视图无页面或浮窗横向溢出。直接尝试打开实际墓碑返回明确错误且不打开正文浮窗。resource记录没有index/proposals请求；未授权访问新接口返回401。已目检[桌面](../artifacts/dashboard-current-memory-library/evidence/desktop.png)和[窄屏](../artifacts/dashboard-current-memory-library/evidence/mobile.png)。三份JS语法及git diff --check通过，未运行单元或项目测试套件，未执行实际写入/恢复/重试。

task_focus返回Canonical task not found已披露，未复制/迁移或冒充绑定成功。

## Task Summary

**Memory 后台与 Dashboard**：组件 [memory](../../../bin/memory/) 增加只读当前记忆列表接口及默认记忆库入口，支持作用域筛选、分页和完整正文查看；移除四个多余面板及对应前端逻辑，保留变更记录、状态和待处理队列。

**Memory 文档**：组件 [docs](../../../docs/) 更新当前记忆库、变更历史及保留管理能力的说明。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 复用store.entries/read、既有授权与分页模式，删除不再使用的前端请求和回调，无新增依赖。 | 不增加富文本渲染或编辑器，Markdown以完整纯文本呈现。 |
| 稳定性 | A | 实际API和Chrome验证作用域、墓碑过滤、分页、完整正文、模式切换、焦点和401；空闲重启保留端点。 | 未运行测试套件或跨浏览器检查；只读列表是读取时快照。 |
| 完整性 | A | 四区块已移除，记忆库与完整正文实际可用，原历史和必要状态入口保留。 | task_focus绑定异常已披露；未注册项目需手动指定路径。 |

## Target
- [x] T1: 移除截图标出的高级筛选、记忆索引、工作区Agents及历史/手工提案页面区块。
- [x] T2: 提供记忆库入口，可按用户或项目浏览当前有效记忆并查看完整正文。
- [x] T3: 保留记忆变更记录、顶部作用域筛选、服务状态及待处理队列，不删除实际记忆或审计数据。

## Result

- T1: 真实DOM中高级筛选/索引/Agents/提案面板已不存在，浏览器不再请求index或proposals；后端数据及CLI能力未删除。
- T2: 真实库总数223与已知roots的active集合一致、排除3条deleted；user1条、指定项目55条分页正确，正文/标题与最新read一致，来源保留；实际墓碑拒绝作为当前正文打开，未授权接口401。
- T3: 实际Chrome验证切回变更记录后摘要和双栏恢复，顶部scope、服务状态和jobs仍可用；空闲重启端口55815及token保持，未执行记忆写入或数据删除。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 只读当前条目列表和明确的前端信息精简，复用已有存储读接口、scope路径规则及授权，不改变维护或写入策略。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/dashboard-current-memory-library/evidence/9fe98a273921401c1e05285b89c4329fbfa2ec44aaa51bd2fbd896b982ea7079.json#9fe98a273921401c1e05285b89c4329fbfa2ec44aaa51bd2fbd896b982ea7079
- Evidence: Execution Log 002/003数据和实际浏览器观察，桌面/窄屏截图，最终三份JS语法及diff检查。
- Result clarity: 用户确认移除截图标记面板并浏览当前记忆；当前明确为未删除条目，历史另有入口。
- Bounded impact: 只读列表模块加已认证GET路由，正文复用现有read；前端移除旧面板和回调，原写入路径不变。
- Low risk: 不写入数据、不改变授权或文件路径规则，内容textContent呈现；删除或不存在条目不当有效正文展示，错误不冒充空库。
- Sufficient verification: 真实当前条目集合/墓碑、分页、scope、正文全量一致、401、视图切换、Esc及390px布局均已观察；未运行测试套件，未跨浏览器验证。
- Task fingerprint: f4872c32e741a18e863a1b63be764dfe4126c50929be0e5ac77992d0cd64624a

## Verification

- Passed: 最终语法及git diff检查通过，截图和源码快照绑定当前内容；真实服务已加载接口，空闲重启端口及凭据稳定。task_focus异常已披露。
