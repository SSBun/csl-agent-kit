# 统一任务系统状态转换与暂停语义

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-13 12:02) |
| Artifacts | [Artifacts](../artifacts/align-task-state-transitions/) |
| Kind | Task |

## Plan

1. 对照图示与运行时、CLI、任务技能、全局注入提示，定位语义及入口不一致。
2. 补充共享状态规范，统一暂停意图、原任务状态维护及回读要求；命令别名复用 pause，不改变七状态转换图。
3. 验证全部允许/拒绝转换、暂停摘要和门禁保留、名称入口及实际 Hook 输出；不运行单元测试或项目测试套件。
4. 完成当前内容自检、独立只读审查和最终验证，记录实际加载范围与未验证项。

## Execution Log

### 001 — 目标确认与实现现状

用户确认以已展示七状态图为准，包括当前允许的 In Progress 到 Pending，不新增 Suspended、不迁移历史任务。现有核心已支持21条异状态转换；本轮主要缺口为注入提示缺少明确状态语义、普通执行启动步骤可能误用于暂停请求，以及缺少 suspend/stash 的安全命令入口。

### 002 — 变更边界

计划通过共享状态规范与任务族入口统一语义；暂停只维护原任务，不为暂停先 resume/reopen。Completed、Blocked、已 Paused 分别按当前状态处理，不无条件重开。CLI 别名必须提供与 pause 相同的八项恢复摘要。暂停后回读实际状态和摘要再报告成功。运行时图示转换不变；全局提示只保留稳定路由和状态含义，详细步骤由技能拥有。已有其他会话与前序任务的 dirty 修改保留。

### 003 — 共享规范与入口统一

已补充共享七状态规范、21条转换及专属入口条件；task、task-plan、task-queue引用同一来源。共享对齐协议与task启动入口增加仅维护已有任务的停止分支，不为暂停先resume/reopen，不创建替代任务，不接受旧目标；明确已完成、受阻、已取消及已暂停记录的处理。暂停回读要求包含状态、八项摘要与索引一致性。全局合约补充稳定状态语义，并区分停止执行与保存暂停。

CLI的suspend/stash复用原pause入口及完整摘要要求；suspended/stashed状态参数给出明确错误引导。没有更改七状态和21条转换，也没有禁止图中的In Progress到Pending。

### 004 — 初步验证与加载范围

共享规范与运行时静态集合对照为21对21，无额外或遗漏转换。临时CLI观察确认别名、按名称暂停、摘要回读、失败无写入、Paused/Blocked/Cancelled/Completed边界、完成态reopen及Required与验证失效规则。三个宿主的真实Hook脚本输出均包含新状态语义且无diagnostics；这证明脚本输出，不证明每个宿主或旧会话的实际模型输入已加载。

JS语法、相关四个技能质量与差异检查通过，有既有篇幅/预算警告。没有运行单元测试、项目套件、真实Agent自然语言回放或多机验证，没有重启服务、重载宿主或停止其他任务。详细观察与覆盖限制见[验证记录](../artifacts/align-task-state-transitions/evidence/verification.md)。

## Task Summary

**任务运行时**：[共享任务组件](../../../skills/meta/csl-tasks/shared/)保留状态转换集合，增加安全暂停别名与不支持状态的引导，并新增共享状态语义和生命周期停止边界。

**任务技能**：[task](../../../skills/meta/task/)、[task-plan](../../../skills/meta/task-plan/)与[task-queue](../../../skills/meta/task-queue/)统一引用状态规范，明确暂停原任务、不自动恢复/重开、既有状态处理和写入后的回读要求。

**全局注入提示**：[Agent Hooks](../../../skills/meta/agent-hooks/)的内置合约增加状态语义与仅停止请求路由，区分等待或停止执行与已保存的Paused。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 状态转换集合和原写入机制不变；两个别名复用pause，完整表格集中在共享规范，注入只保留稳定含义与路由。 | 不同入口仍需短提醒，避免Agent仅加载一个入口时遗漏状态语义；详细过程集中引用。 |
| 稳定性 | A | 静态21条转换一致，临时CLI覆盖关键成功与拒绝路径、无写入失败和审查义务；真实Hook输出、语法与质量检查通过。 | 未跑测试套件或真实Agent行为回放；提示遵循及所有旧宿主实际加载不能由脚本输出证明。 |
| 完整性 | A | 七状态、暂停意图、原任务停止分支、回读、名称兼容与保留门禁均有实现/指引及相应核对。 | 本次不含禁止In Progress到Pending、历史迁移、所有旧会话强制刷新或其他电脑部署。 |

## Target
- [x] T1: 任务运行时、CLI和Agent指引一致遵循已展示图中的七个状态、允许转换及适用门禁。
- [x] T2: 主动暂停使用Paused并保存恢复信息；恢复、阻断、取消和完成遵循图示含义，不将Pending或停止执行当作暂停。
- [x] T3: 保留按名称定位、既有任务记录及审查验证义务；完成相应检查并明确实际加载和验证范围。

## Result

- T1: 共享规范与当前运行时21条异状态转换逐项一致；三个任务族引用同一状态规范，原图示转换不变。见验证记录。
- T2: 新增停止请求分支、暂停意图与回读要求；suspend/stash复用pause并验证八项摘要；临时CLI核对暂停/恢复/阻断/取消/完成边界及失败无写入。
- T3: 按名称暂停回读及Required保留/旧验证清除已核对；三个宿主真实Hook脚本返回新语义，无diagnostics。未验证所有旧会话实际模型输入、真实Agent回放或多机加载，未迁移历史。
- Review gate: Passed — fresh只读Reviewer 0deb226d-7b45-4ff1-9ad5-998c809f4cda 无确认finding或Target阻断风险；完整反馈已保存为Review Reports round-01，当前快照与任务指纹已复核。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 跨任务族和宿主合约统一生命周期停止边界，并新增CLI别名；涉及目标对齐与状态语义，需独立只读审查。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/align-task-state-transitions/evidence/62d500c04a5347b056aba4243d75f94776be08aa8ffa080b16df96157b8ce90b.json#62d500c04a5347b056aba4243d75f94776be08aa8ffa080b16df96157b8ce90b
- Evidence: .csl-agent-kit/tasks/artifacts/align-task-state-transitions/evidence/verification.md 和当前逐Target Result；明确未跑测试套件或真实Agent回放。
- Task fingerprint: d223aec77a5317ff0ccc61d69a08a150be07c29d9589335bb4341d0e91f2f1ad

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/align-task-state-transitions/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/align-task-state-transitions/evidence/62d500c04a5347b056aba4243d75f94776be08aa8ffa080b16df96157b8ce90b.json#62d500c04a5347b056aba4243d75f94776be08aa8ffa080b16df96157b8ce90b | no blocking findings | 637c9435082c074d2fbdfcba8342cec50b268a4ab2a03e7028e75753198a868a |

## Verification

- Passed: 最终13文件快照及round-01报告校验通过，审查无确认finding或Target阻断风险；核心/CLI语法与diff check通过，自评及已记录静态21转换、CLI和Hook输出证据仍适用。未跑测试套件或真实Agent回放，不宣称全部旧宿主已加载。
