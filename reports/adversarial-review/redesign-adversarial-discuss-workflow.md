# 对抗式审查：重构 adversarial-discuss 的角色与批量讨论流程

## 总体结论

- 结果：READY
- 核心结论：`adversarial-discuss` 已使用 Synthesizer–Challenger 内部批量讨论，只在关键用户选择上暂停询问，并保持与 review、brainstorming、grilling 的路由边界。
- 剩余风险：无与本次目标相关的实质风险。

## 审查主题

- Synthesizer / Challenger 角色边界
- 内部优先分析与 User Decision Gate
- 完整主题批处理与迟到议题约束
- 触发边界、行为契约、README 和工作区记录
- 验证、安装和打包结果

## 逐议题辩论结果

### R1 — 通用内部讨论短语导致误触发

- Reviewer position：`full-batch discussion`、`discuss internally first`、`先内部讨论`、`完整批次` 可单独满足主要正向概念，普通 brainstorming 也可能超过触发阈值。
- Violated criterion：普通 brainstorming、简单任务及未明确要求迭代式 Synthesizer–Challenger 循环的请求不得路由到 `adversarial-discuss`。
- Evidence：评分器对概念内任一 phrase 命中即视为该概念覆盖；现有负例没有覆盖这些短语脱离角色与循环语境的情况。
- Risk：普通单 Agent 请求可能误触发多 Agent 无上限循环，且当前 precision=1.0 会高估真实路由精度。
- Required outcome：新增语义只有在明确角色或迭代对抗循环意图下才能触发；独立的内部讨论或完整批次指令必须不触发，并由中英文用例证明。
- Suggested remedy：删除或收窄通用 phrases，并增加中英文近邻反例后重跑评测。
- Editor response：ACCEPT；删除四个可独立命中的通用 phrase，并新增两个不含“无需循环”等显式否定提示的中英文近邻用例。
- Editor audit：现有路由确实会让这些 phrase 单独满足主要正向概念；最小解法是删掉四个通用 phrase 并直接覆盖 Reviewer 给出的误触发形状；影响仅限 semantic config 与 trigger cases；没有修改 skill 工作流或引入新路由逻辑，复杂度与风险相称。
- Debate conclusion：ACCEPTED_AND_FIXED
- Final impact：两个新增普通请求得分分别为 0.02 与 0.0，明确角色/对抗循环的全部正例仍触发。
- Status：RESOLVED

## 最终结论

- 已确认：角色语义、内部优先路由、关键用户决策门、完整批处理与无上限状态循环满足目标。
- 已修改：删除四个通用正向 phrase，增加中英文近邻用例。
- 未解决：无。
- 用户需要决定：无。

## 验证

- Skill Creator quick validation — 通过。
- Yao lint、resource boundary 与 Skill IR validation — 通过。
- Trigger eval — 26/26，通过率、precision 与 recall 均为 1.0；新增近邻得分 0.02 与 0.0。
- `npm run check`、安装 dry-run、npm pack dry-run 与 `git diff --check` — 通过。
- 前向试用 — 决策分叉场景按整批 D1–D5 收敛后只询问一个关键选择；内部完整批处理场景因独立 Challenger 超时中止，未计为通过证据。
- Limitations：Yao 完整 validate 要求本仓库共享 skills 未采用的 `agents/interface.yaml`；依项目既有约定未新增孤立接口目录。

## 技术附录

### 审查元数据

- Gate: APPROVED
- Review state: APPROVED
- Stop reason: approved
- Reviewer: `discuss_workflow_reviewer`
- Current round: RE-REVIEW (2)
- Updated: 2026-07-21 00:20:59 +08:00

### 审查范围

- Task: [tasks/tasks/redesign-adversarial-discuss-workflow.md](../../tasks/tasks/redesign-adversarial-discuss-workflow.md) — 重构 adversarial-discuss 的角色与批量讨论流程
- Base revision: `5ca82f8`
- Artifacts: `skills/adversarial-discuss/SKILL.md`、三个 eval 文件、`README.md`、`tasks/context.md` 与 `tasks/lessons.md` 的本任务变更。
- Fingerprint: SHA-256 `7e8ab6f0f5428c6b12723974f98d8708908bc44a4e105dd045894411ab8ffbf1`。
- Non-goals: 不修改 adversarial-review；不增加脚本、配置或普通 brainstorming/grilling 路由。

### 轮次历史

| Round | State | New findings | Resolved | Unresolved |
|---|---|---|---|---|
| INITIAL (1) | CONTINUE | R1 | none | R1 |
| RE-REVIEW (2) | APPROVED | none | R1 | none |

### 未解决项

None.

### 批准边界

- Approval covers only the identified revision and scope.
- Reviewed-artifact changes invalidate approval and resume the same numbered history.
- Report and task-summary synchronization are administrative review records.
- External action authorization: 用户已授权实现；未授权 commit 或 publish。
