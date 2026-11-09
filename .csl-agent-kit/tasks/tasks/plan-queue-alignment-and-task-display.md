# 实现 Queue 对齐与任务展示优化

Status: Completed (2026-08-29 22:59)
Kind: Plan

## Scope

- 包含：实施主／子 session 的确认所有权、Queue／subagent delegation 边界、主 Plan 变更判定、父子任务标题约束、当前 4.1.0 Queue 同名修正，以及协议／规则／eval／core／Context 验证。
- 排除：把 alignment／confirmation 状态持久化到 task core、按标题在 overlay 中隐藏不同任务，以及付费模型复测。

## Target
- [x] T1: 主 session 的非平凡 L2 task 仅在初次执行前确认一次；由已确认主任务 Plan 分发的 child session／task 不再显式询问，只有 material child distribution graph 变化才返回主 session 重新对齐，L3／L4／S1 保持独立。
- [x] T2: Queue parent／children 的任务标题在创建、链接和 workspace validation 中保持可区分，当前 4.1.0 Queue 不再在 This Session 与 Workspace 中呈现为同名重复。
- [x] T3: 共享协议、consumers、稳定规则、project-local eval、task core、静态断言和 Context 保持一致，并通过计划中的确定性验证；不执行付费模型复测。

## Decisions

- 只有直接承接用户请求的主 session 是 `interaction owner`。主 session 的新非平凡 L2 task 在初次实质执行前展示并确认一次；同一已确认 Target 不重复确认。
- 由主 session 当前 Plan 明确分发的 child session／task 不再进入用户可见的 L0–L4 gate。delegation 必须携带主 task ID、owning child task ID 或明确 Plan node、精确 outcome／scope；覆盖完整时直接执行，缺少来源时 fail closed。
- child 不直接向用户显示 L2／L3／L4 或 Safety Confirmation。child 若发现 assignment 超出 Plan、需要用户决定或到达 S1 外部副作用边界，停止并把 `plan change required`、commitment dimensions 和证据返回主 session，由主 session 决定 L2、L3、L4 或 S1。
- 用户选择 A：只有改变 child 分发图的 Plan 变化才重新确认，包括新增、删除、重排 child，或改变 child 的 outcome、done conditions、scope；文件、函数、算法、命令和验证方式等同一节点内的实现调整不触发确认。
- 不增加新的 L-level，也不让 child 复用 `L2_VISIBLE_CHECKPOINT`。共享协议先判定 session authority：主 session 执行 L0–L4；delegated child 只执行 `continue_delegated` 或 `return_to_main`。
- 不把 delegation／confirmation 写入 canonical task schema。Queue 使用已有 Parent／Children 图和主 Plan；subagent prompt 使用 session-local delegation packet，主 session 对其准确性负责。
- S1 不能继承。child 可以准备发布、删除或付费调用，但真正的外部动作必须返回主 session，由主 session取得独立 Safety Confirmation。
- 截图中的重复不是 overlay 重复渲染同一 ID，而是 Queue parent `release-csl-agent-kit-4-1-0` 与 child `publish-csl-agent-kit-4-1-0` 使用了相同标题。overlay 已按 focused task ID 排除同一记录，因此不修改其过滤逻辑。
- Queue parent 标题必须描述集成 outcome；每个 child 标题必须描述自身阶段。task core 对同一 Queue 内 parent／child／sibling 的标准化精确同名 fail closed，但允许无父子关系的独立任务同名，不做模糊相似度判断。
- 实施时将现有 Queue parent 标题改为“完成 CSL Agent Kit 4.1.0 发布流程”，保留发布 child 的原标题；只修正这一条已确认的现代 Queue collision，不批量重写历史记录。

## Plan

1. 在共享 Task Target Alignment Protocol 中增加 `Interaction Owner and Delegated Execution`：主 session 独占用户可见 L0–L4／S1，定义 delegation packet、covered／stale／expanded 分流、child `return_to_main` 以及 material Plan graph change 后的主 session 再确认；保留 implementation-only 免确认和 task core 不持久化 alignment 的边界。
2. 同步 `task` 与 `task-queue` consumer：Queue parent 只确认一次；parent 创建、链接并在 Plan 中命名 children 后，child 执行完整 lifecycle 但继承 alignment；subagent dispatch 必须携带 delegation packet；graph／assignment 变化先返回并重新对齐主 session。`task-plan` 仅保持 handoff 语义，不复制 delegation 细节。
3. 精简同步两份稳定 Agent rules，只保留“主 session 初次 L2 一次、delegated child 继承、Plan graph 变化返回主 session、Safety 独立”的触发与停止边界；详细 packet 和转移仍只放共享协议／consumer。
4. 将 project-local alignment eval 升级为可表达 `main`／`delegated` authority 的新 schema：主 session 继续输出 L0–L4；child 输出 `continue_delegated` 或 `return_to_main`。增加 exact Plan、scope expansion、ambiguity、material graph change、implementation-only change 和 S1 handback contrast cases，并分别统计 child confirmation leak 与 stale-plan continue。
5. 在 task core 的 `linkChild` 与 workspace validation 中拒绝同一 Queue 内标准化后的 parent／child／sibling 精确同名；在 `task-queue` 加入 stage-specific title 规则，并增加 core contract tests。不要在 overlay 按标题去重，因为不同 ID 仍是不同任务。
6. 将当前 completed Queue parent 重命名为“完成 CSL Agent Kit 4.1.0 发布流程”，同步其 index 并检查 parent／children graph；不改 child title 或历史结果。
7. 同步静态 contract assertions 与 `CTX-task-workflows`；`CTX-pi-task-overlay` 只有在职责结论变化时才更新，本方案预计无需修改 overlay source 或 Pack。
8. 实施验证应覆盖：一个四-child Queue 只出现一次主 L2、零 child checkpoint；material Plan graph change 返回主 session 并再次 gate；implementation-only 调整不中断；child S1 返回主 session；同名 Queue link／手工同名 graph 被拒绝；现有 overlay 仍按 task ID 正确分组。随后运行 focused task tests、eval validate／self-test、受影响 Skill Quality、Context validate 和 `git diff --check`；付费模型评测需另行授权。

## Result

- T1: 共享协议、task／task-queue consumers 与稳定规则已限定 main session 为 interaction owner；Plan 覆盖的 child 使用 continue_delegated，缺失覆盖、material graph change、用户决策或 S1 使用 return_to_main。72-case v3 self-test 检出 child confirmation leak 与 stale-plan continue。
- T2: task core 的 link 与 workspace validation 已拒绝同一 Queue 内标准化 parent／child／sibling 同名；focused release parent 已改名为“完成 CSL Agent Kit 4.1.0 发布流程”，全 workspace 现代 Queue collision 扫描为 0。
- T3: 协议、rules、project eval v3、core、静态断言与 CTX-task-workflows／CTX-project-evals 已同步；未修改 overlay source，也未运行付费模型复测。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: npm run check 全部通过；72-case validate/self-test、oracle-free prepare、project eval layout、task core workspace validate、Pi tests、受影响 Skill Quality 和 Context validate 均通过，git diff --check 无错误。
