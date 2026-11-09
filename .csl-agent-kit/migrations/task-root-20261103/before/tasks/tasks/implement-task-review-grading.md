# 实现 Task Review 三级判定与低风险免审

Status: Completed (2026-09-11 17:43)
Kind: Task

## Scope

- 实现已确认的三级判定，覆盖 Task、Queue、默认注入契约及显式 adversarial-review 的衔接；不改变 Task Target 对齐语义。
- 不改写未触及历史任务，不新增依赖、不发布、不提交；保留其他会话的本地改动。
- 本任务本身涉及跨消费者状态约束，按 R2 执行独立审查；测试仅补充，不运行。

## Target
- [x] T1: Task Review 按 R0 无交付物变更、R1 可充分验证的简单低风险变更、R2 复杂或高风险或存在重要不确定性的变更分级；符合条件的小范围逻辑修改允许进入 R1。
- [x] T2: R1 免审同时要求结果明确、影响可界定、后果低风险及证据充分；任务记录等级、具体依据、内容身份及验证证据，相关变化失效并重新判级。
- [x] T3: R2 保留独立审查、修复循环和停滞保护，Reviewer 失败不能触发降级；adversarial-review 仍仅显式请求触发，最终验证不因免审省略。
- [x] T4: 工作流指引、CLI 状态与完成校验、相关记录消费者和行为样例保持一致；清楚区分记录一致性校验与 Agent 语义风险判断。

## Plan

1. 梳理 Review gate 的生产者、消费者及失效路径，固定三级判定与历史兼容边界。
2. 增加可校验的当前分级记录与 CLI 入口，统一工作流规则及行为样例。
3. 补充针对分级、证据缺失、失效、禁止降级和 Queue 的回归用例；运行语法、Skill Quality 与真实任务 CLI 校验，不运行测试套件。
4. 完成逐 Target 自检，冻结交付物并派发 fresh 只读 task-review；主 Agent 核实反馈、修复和复审，最后核对内容身份与完成门禁。

## Decisions

- 共用一个分级协议，不按行数评分，不直接复用 Task Target 等级。
- 分级放在独立的 Review Assessment 当前记录，原 Review finding ledger 不承载等级；CLI 要求等级、具体依据、内容身份、证据，R1 额外要求四项成立依据。
- core 校验结构、状态和任务规范／Result 指纹；外部交付物内容身份由宿主与主 Agent 现场核对，不能宣称 core 自动发现全部文件变化或证明语义风险。
- 正式启动的 Required 审查义务不能因分级重写而被免除；内容变化保留该义务并刷新当前判定。历史记录保持可读，但活动任务在新的完成门禁前补充分级。
- 当前仓库的 npm run check 内含测试套件，因此本次改用逐文件 node --check、Skill Quality 及实际任务命令。

## Evidence

- 对照已确认设计与实际代码：分级协议独立于 Task Target；R1 明确包含小范围逻辑修改，四项依据缺一不可；R2 保留原 finding ledger 与停滞 guard。判级是 Agent 的语义责任，CLI 不按行数或字符串猜测风险。
- 自检失败模式 1：小 diff 被误判为低风险。协议明确一行鉴权变更为 R2，并添加对应 fixture；R1 要求四项具体成立依据。
- 自检失败模式 2：失效或缺失依据仍可免审。core 在终态 gate／complete 检查 assessment 状态与任务指纹；sync、Result、reopen、Queue 关系变化使旧 assessment 失效并移除 Skipped。外部文件身份仍需宿主现场核对。
- 自检失败模式 3：Reviewer 失败或显式审查被免审绕过。R2 已有义务不可降级；任何 Required／Passed／Approved 义务不可 Skipped；R2 的 Approved 必须先有 Passed。
- 自检失败模式 4：工作流消费者保留旧的一刀切规则。已核对 Task、Queue、task-review、显式 adversarial-review、默认注入 Contract、Context 和对应契约用例；搜索旧强制文案未发现当前消费者残留。纯规划行为保持不变。
- 自检失败模式 5：旧记录迁移、误动其他工作或误报测试。旧记录读取和全 workspace validation 通过；未修改其他会话交付物，未运行测试，新增测试只做语法检查。
- 允许检查：4 个 JavaScript／MJS 文件的 node --check、CLI --help、真实 workspace validate、Context validate、git diff --check 均退出 0。5 个改动 Skill package 的 Quality 均无 failure，仅有 context-budget warning；保留完整规则，不为消除警告删减安全与失效边界。
- 当前复审内容身份、检查输出和 diff 保存于 [review-snapshot-pass-2.json](../artifacts/implement-task-review-grading/evidence/review-snapshot-pass-2.json) 及同目录 scoped-pass-2.patch；首轮 review-snapshot.json／scoped.patch 保留不覆盖。快照不含其他会话的任务与交付物。
- 首轮独立审查 run 46f8ebe2-f32a-4722-a213-53325d34c3d0 已完成。主 Agent 重算 14 项文件 SHA256、mode 和 scoped.patch，均匹配首轮快照，无漂移；核实 TR-1／TR-2 均成立并返回 In Progress 修复。
- TR-1 修复：linkChild 在任何写入前拒绝改变 Completed child 的关系，要求显式 reopen；完整相同的 reciprocal link 直接返回，保留双方状态、证据及索引。新增首次关联失败无部分写入、重开后 Queue 不跳过子任务，以及已审查／已完成父任务重复关联的回归用例，未运行。
- TR-2 修复：为成功 fresh pass 新增 passed --resolve-ledger --snapshot 原子收尾；仅允许 In Review／Required、当前任务指纹、完全相同的 snapshot、非 stalled ledger，清理 ledger 与写入 Passed 同步完成，保持 assessment 并清除 Verification。普通 sync 仍保守失效；新增成功收尾及缺失／错误／失效身份、错误 gate、stalled finding 拒绝用例，未运行。两项均等待新的独立 Reviewer 确认。
- 验证局限：未运行单元或项目测试，未以伪装 smoke 的临时测试替代授权；源码检查和真实任务调用不等于所有回归用例已通过。程序不自动证明外部 snapshot、语义风险或独立 Reviewer 隔离。

## Result

- T1: 已逐项对照共享分级协议、Task／Queue 与 fixture：R0、R1、R2 路由一致，R1 明确允许满足全部依据的小范围逻辑修改；5 个 Skill Quality 无 failure，详见 Evidence。
- T2: 核对 current／fingerprint 与失效入口，TR-1 已修复：Completed child 新关系在写入前拒绝，相同 reciprocal link 完全无副作用；相关回归用例已补但未运行，内容身份由宿主现场核对。
- T3: R2／既有义务禁止 Skipped、R2 Approved 需先 Passed、最终验证不省略；TR-2 已新增受 current fingerprint／同一 snapshot／非 stalled ledger 约束的原子 Passed 收尾，避免纯 ledger 清理触发无意义复审，等待 fresh Reviewer 确认。
- T4: Task／Queue／共享协议／CLI／Context 与契约测试同步两项修复；首轮 14 文件和 scoped.patch 前后哈希一致，复审使用 pass-2 快照；语法与结构检查记录见 snapshot，测试未运行。
- Review gate: Passed — fresh 只读 Reviewer 第二轮 child 3048ce7f-316c-4fe6-8c07-ef120056fb2e（workflow e272b28c-dc7a-4c9a-b959-3c8e87c4da26）报告 Findings none、TR-1/TR-2 resolved；主 Agent 重算 14 项 SHA256/mode、scoped diff、staged diff 与 HEAD，全部匹配 pass-2，无阻塞证据缺口；测试未运行，5 项 budget warning 已披露。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 跨 Task／Queue／CLI 的 Review 分级与失效语义变更；首轮发现的 Completed child 关系和 ledger 收尾路径已修复，保留 R2 独立复审义务。
- Snapshot: tasks/artifacts/implement-task-review-grading/evidence/review-snapshot-pass-2.json；snapshotId=2e0bcce1e95a8527cbded54cf79f4b0feb4706fbb5b48e402beead12fe8a6701，14 项内容 SHA256 与 scoped-pass-2.patch。
- Evidence: 本任务 Result／Evidence、TR-1／TR-2 当前 ledger 与 pass-2 快照；13 项允许检查均退出 0，5 个 Skill context-budget warning，无测试执行。
- Task fingerprint: 08bd146d01fb92e0042d24db233b2609f02c4d320a603a68ade53196b2b1fb5e

## Verification

- Passed: 独立复审 Passed 后重新执行 13 项允许检查均退出 0；14 项 SHA256/mode、scoped/staged diff、HEAD 再核对无漂移；真实 --resolve-ledger 原子收尾保持 Current 并成功清理 ledger。详见 tasks/artifacts/implement-task-review-grading/evidence/final-verification.json；未运行测试，5 项 budget warning 非阻塞。
