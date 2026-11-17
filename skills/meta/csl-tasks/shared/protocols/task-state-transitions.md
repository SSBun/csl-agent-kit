# 任务状态转换

本协议统一 task、task-plan、task-queue 的生命周期含义。共享核心 `../lib/task-core.js` 执行状态写入和机械门禁，Agent 核对用户意图、现场条件和实际证据。确认模式不改变这套状态含义。状态记录不是执行授权，状态转换也不能替代 Task Target 对齐、审查或验证。

## 七个状态

| 状态 | 图标 | 含义 |
| --- | --- | --- |
| Pending | ⏳ | 等待开始或执行，也可表示规划就绪等待实现；不是暂停。 |
| In Progress | 🔄 | 正在处理该任务。 |
| In Review | 🔍 | 正在进行已要求的审查。 |
| Paused | ⏸️ | 主动搁置，已保存恢复摘要，等待以后继续。 |
| Blocked | 🚫 | 存在具体障碍，需满足可观察的解阻条件。 |
| Cancelled | ⏹️ | 已停止该任务，记录保留，可明确恢复。 |
| Completed | ✅ | 已满足目标、证据、审查及最终验证条件。 |

不创建 Suspended 状态。在任务管理语境中，pause、suspend、stash、暂存、搁置、先放一放、先做别的均可表达主动暂停意图；按上下文定位原任务并执行 Paused 流程。暂停进程、Git stash、等待用户回复和 Task Target 确认是不同操作，不能仅凭同一词汇就改任务状态。

## 允许的异状态转换

| 来源 | 目标 | 入口与必要条件 |
| --- | --- | --- |
| 创建 | Pending | create，必须有合法 Target。 |
| Pending | In Progress | resume，原目标与执行范围仍受对齐约束。 |
| Pending | Blocked、Cancelled | status blocked 先有 Block；或 cancel。 |
| Pending | Paused | pause，保存完整恢复摘要。 |
| In Progress | Pending | status pending，当前仍允许；不得用于满足暂停请求。 |
| In Progress | In Review | 已有 Required，Topic 等适用条件有效。 |
| In Progress | Blocked、Cancelled | 先记录 Block；或 cancel。 |
| In Progress | Paused | pause，保存完整恢复摘要。 |
| In Progress | Completed | complete 或 finalize；仅满足 R0/R1 免独立审查条件且无既有义务时可从该状态完成。 |
| In Review | In Progress | 返回修改；离开审查使终态审查与验证证据失效。 |
| In Review | Blocked、Cancelled | 先记录 Block；或 cancel；保留未解决审查问题。 |
| In Review | Paused | pause，保存完整恢复摘要，保留 Required 义务。 |
| In Review | Completed | 审查 Passed/Approved，且满足其他全部完成门禁。 |
| Blocked | In Progress | resume，Agent 先核对实际解阻条件；停滞 finding 未解阻时核心仍拒绝。 |
| Blocked | Cancelled | cancel，不借机消除需复查的问题事实。 |
| Paused | In Progress | resume，只重新激活；核对摘要、现场和缺失依赖后才能执行。 |
| Paused | Cancelled | cancel。 |
| Cancelled | In Progress | 用户明确恢复后 resume。 |
| Completed | In Progress | 仅 reopen，同一结果需要纠正、补齐或重验；已完成子任务先恢复父任务。 |

上述表展开为21条异状态转换，另有创建入口。同状态重复写入不算新转换；pause 要求本次摘要，不能重复调用以伪造新的停止点。除专用入口外，普通 status 不能直接进入 Paused 或 Completed。

完成必须有全部 Target 与逐项 Result、当前评估、允许的审查终态、最终验证通过，无活动 Block/Review ledger；Queue 还必须有子任务且全部完成，Topic 条件有效。R2 不得跳过独立审查，暂停或恢复不能清除该义务。Required、Skipped、Passed、Approved 是审查字段，不是任务状态。

## 仅维护已有任务状态

用户只要求暂停或取消已有任务时，先只读定位、读取并 focus 原记录，保持其当前状态；不要运行用于开始执行的 resume/reopen，不创建替代任务，也不生成新的实施目标。按共享目标对齐协议的生命周期停止边界执行，仅保存已发生事实、当前停止点及恢复所需信息；不继续原任务的实现或验证工作来“补齐进度”。原先未解决的目标确认、授权或安全边界继续保留，停止操作不构成对旧目标的接受。

明确取消时，按表中 cancel 转换处理；取消前将影响以后恢复的阻断事实与未解决问题保存在原任务日志中，不能把取消当作已解阻。以下分支仅针对主动暂停请求：

- Pending、In Progress、In Review：主动暂停按[暂停与恢复](../../../task/references/pause-resume.md)保存摘要并调用 pause。
- Paused：读取已有状态和摘要，报告已经暂停及保存时间；不为重新暂停而自动 resume，不假装旧摘要是新的现场核对结果。
- Blocked：保留 Blocked 和原解阻条件，必要时记录用户要求暂不继续；不能通过 pause/cancel 再 resume 绕过实际障碍。
- Cancelled：报告当前已停止；仅暂停请求不授权恢复后再暂停。
- Completed：报告已经完成、没有正在执行的工作可暂停。不能仅为暂停而 reopen；用户指出同一结果确有未完成项后，才按重开及目标对齐规则处理。

暂停成功必须在实际写入后回读 Paused、完整摘要和索引一致性；对照本次停止点，不能只看命令已尝试或只看聊天。失败时核对实际落盘范围，报告未保存项，不得宣称已完整暂停。

暂停和恢复使旧验证及评估失效，保留 Required 审查义务和未解决 finding。换电脑恢复以取得原记录、代码、部分成果及依赖为前提，不能把保存记录误报为文件已同步。Queue 停在首个未完成子任务，Paused/Blocked/Cancelled 不得自动跳过；暂停父任务不隐含停止活动子 Agent。

## 实施与加载边界

CLI 的 suspend、stash 是 pause 的命令别名，仍需同样的恢复摘要；写入状态一律为 Paused。它们不执行系统进程挂起或 Git stash。状态参数 suspended/stashed 不受支持，错误提示引导专用 pause 入口。

注入提示和技能源已更新不代表每个旧会话或宿主已加载。交付时区分源码检查、实际 Hook 输出、当前会话加载和真实 Agent 行为；只报告有观察证据的范围。不得为刷新状态擅自重启服务、停止其他活动任务、迁移记录或修改用户确认模式。
