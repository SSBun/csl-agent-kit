# 分析 Task 工作流的优化空间

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-22 19:46) |
| Kind | Task |

## Target
- [x] T1: 说明当前 Task 工作流如何运作，并基于现有规则与实际记录识别值得优化的环节。
- [x] T2: 给出有依据的优化建议及优先级，只做分析，不修改工作流实现。

## Scope

分析当前 Task 协议、执行与复核生命周期、宿主集成和实际任务记录；仅更新本次任务记录，不修改工作流实现或其他历史记录。

## Plan

1. 梳理协议、生命周期及各类门槛，识别重复职责和交互成本。
2. 抽查近期与代表性任务记录，核对状态、证据和实际使用摩擦。
3. 核对共享 core 与宿主集成的保障边界，综合形成有依据的优化优先级与取舍。

## Decisions

- 当前流程为 Context/Core → 激活记录 → Target 对齐 → Context/Lessons 与来源准备 → 执行 → 逐 Target 自检 → R0/R1/R2 分级 → 必要审查 → 最终验证 → 完成。保留独立于确认模式的 R2 审查及证据失效规则。
- 排除本任务，共 397 个索引唯一链接与 397 份任务文件对应；217 份有 Kind 的记录用现有 core 解析成功，其中 Completed 198、In Progress 8、Blocked 7、Pending 3、In Review 1。其余 180 份历史记录未纳入现代状态统计，不把历史格式或未终结状态直接认定为缺陷。
- 优先减少 R0/R1 收尾重复：保留逐 Target 证据、四项 R1 依据和最终漂移核对，让现有 CLI 合并合法写入并复用证据。样本 [状态栏方括号](pi-task-mode-status-brackets.md) 在自检、Result、Assessment 与 Verification 重复同一范围和检查；这是优化建议，尚未实现或度量收益。
- 优先机械化外部证据检查：当前 core 的 check/validate 主要检查结构、索引与图关系，Snapshot 是 owner 提供的文本，报告文件及对应关系由 owner 核对；建议工具生成明确范围的 manifest、检查 hash/链接/轮次对应，不把这些检查称为语义验收或 Reviewer 独立性证明。
- 优先改善恢复线索：[Topic 生命周期](simplify-topic-lifecycle.md) 仍等待测试授权，而 [分组提交](commit-local-feature-groups.md) 已记录提交 f1c0c31，且正确声明不替代功能验收。建议用现有 Plan/Block 保存当前产物、下一动作及必要输入，并在导航展示解除条件，不自动关闭历史任务。
- 将必要验证能力检查前移：[规则去重](deduplicate-user-agents-contract.md) 在修改后因 Reviewer 运行依赖缺失而 Blocked；[语法记录](grammar-records-preview.md) 因真实宿主 reload/重开验证缺失而 Blocked。建议对显然需要这些能力的工作提前核对可用性和测试授权，但实际 R 分级仍依据最终结果。
- 常驻 Contract 已复述详细 Review ledger 与失效流程；建议去除与 Task/共享协议重复的细节，保留稳定触发、顺序、停止边界与强制加载入口。不能为了 token 预算删除核心保障；遵循率和耗时收益尚未测量。
- confirm/SOLO 与 Queue 图变化确认有明确历史设计决定，本次不将其当作 bug 或更改配置。分析本身可验收时应以 Task/R0 收尾；为未来实现准备的 task-plan 才保持 Pending，避免新增状态或模式。
- 本次只做本地源码、协议及记录分析；未运行测试、模型回放或真实宿主交互。当前宿主未提供 task_focus，未设置宿主会话焦点；任务归属由本条 canonical record 保留。

## Task Summary

未修改代码或工作流组件；仅更新本次分析任务及其索引项。

## Result

- T1: 已核对 Task/Plan/Queue 对齐与审查协议、core 和 Pi 导航实现；397 份既有记录与索引一一对应，217 份有 Kind 记录通过现有解析；抽查收尾、阻塞和提交记录，流程与事实见 Decisions。
- T2: 基于源码与具体任务样本形成分级建议：R0/R1 收尾与证据复用、机械证据校验、恢复线索、验证能力预检、Contract 去重；保留确认与 R2 保障，区分确定观察、设计取舍及未测量收益；无工作流实现变更。
- Review gate: Skipped — R0 无交付物文件变更，无显式独立审查义务；并行只读分析已由主 Agent 核对，不作为独立验收证明。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R0
- State: Current
- Reason: 交付物为只读分析结论，仅更新 owning task 和索引，无代码或工作流变更。
- Snapshot: analysis-v1:本任务 Decisions 与 T1/T2 Result；仓库源码 HEAD 0c35764；已检查既有记录样本。
- Evidence: 主 Agent 对照源码、协议和代表记录复核分工、统计及建议；所有建议标明观察范围和局限，未将静态检查说成运行验证。
- Task fingerprint: c2b54d0d8aab6444c7d0c6c9fd45ba32a46ea33774e3e989a554f66bf0ec1923

## Verification

- Passed: 最终 task check、workspace validate、Context validate 与 git diff --check 通过；Lessons validate 仅历史兼容警告；复核既有397条映射、217份解析统计及引用样本；工作流源码未改。未运行测试、模型回放或宿主交互，节省幅度未测量。
