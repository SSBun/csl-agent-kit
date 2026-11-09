# 排查 Task Target 确认关卡很少触发的原因

Status: Pending (2026-09-14 11:39)
Kind: Plan

## Scope

- 本次仅排查工作流，区分正常免等待、Target 展示遗漏与应等待但继续；不修改协议、Skill、宿主代码或其他任务。
- 不运行测试、自检测试或模型评测；不把历史任务结果当作当前真实会话触发率证明。

## Target

- [ ] T1: 查明当前 Task Target guard 的触发与继续条件，并说明确认关卡很少触发的工作流原因及证据

## Decisions

- 直接原因已定位到提交 `36e1719`（2026-09-08 15:03:42 +08:00，`feat(tasks): refine L2 confirmation coverage`）：首次非平凡 L2 从展示后必须等待，改为全部条款有直接用户依据或有效已接受依据时 `show_continue`。当前协议第 136–146、192–198 行明确要求该分支在同一轮继续。因此等待减少本身不证明门禁失效。来源：["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md)。
- 必须区分可见性和等待：新的非平凡等价 Target 仍须完整展示；L2 的用户明确要求核对、Plan 分发图实质变化、恢复时对齐依据缺失及未定解释仍须等待；L3 澄清、L4 授权变化和独立 S1 也未取消。已接受且不变的 Target 与有效 delegated child 不重复展示确认。
- 执行依赖模型遵守提示，而非当前接入层的硬拦截：Contract hook 注入稳定规则，三个 consumer 再要求模型读取共享协议。Pi 的 `before_agent_start` 拼接 system prompt；`tool_call` 运行 best-effort scripts／SOP 提示并返回 undefined，没有检查 Task Target confirmation。核心 `resumeTask` 直接进入 In Progress，`completeTask` 检查 Result／Review／Verification 而非用户对齐证据。这是现有职责边界，不把它直接认定为新回归。来源：["/Users/caishilin/Desktop/personal/skills/pi/extensions/csl-context-hooks.ts"](file:///Users/caishilin/Desktop/personal/skills/pi/extensions/csl-context-hooks.ts) 第 278–304、326–385 行；["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js) 第 637–639、797–826 行。
- 仍有验证缺口：模型必须自己区分直接用户依据和自己推导的验收解释；若过宽归类为 `direct_user`，可能错误直行，但此次没有具体失败会话，不能断言发生频率。评测只对给定候选 Target 分类，不覆盖自由生成 Target；说明明确承认 `unsettled_interpretation` 尚无独立人工标注覆盖，静态断言和 provisional labels 不能证明真实模型可靠性。来源：["/Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/README.md"](file:///Users/caishilin/Desktop/personal/skills/evals/task-target-alignment/README.md) 第 37–43 行。默认结果目录可见历史模型报告与 v4 输入文件，未发现当前 v4 模型报告；未扫描其他位置或私人会话日志。
- 当前会话已注入 Contract，且本次已读取协议并展示 Target，故不能将本次问题归因于 Contract 未加载；其他会话的漏展示或错误直行仍需原始可见消息与工具时序验证。
- 建议尚未实施：若期望每个新非平凡任务都留一个人工纠偏机会，恢复首次 L2 必停、仅复用真正已接受且未变的 Target，是最小策略调整；这会增加明确请求的确认次数，属于用户需要选择的交互取舍。若保留现有低打扰策略，应先补充真实误放行案例与端到端可见性／等待检查，而不是仅增加规则篇幅。

## Plan

1. 交付已核对的协议差异、接入职责和证据边界，不以很少等待推断整个 guard 没有触发。
2. 后续若用户要求修复，先确定是恢复首次必停，还是保留自动继续并收紧错误放行；不把当前排查授权当作修改授权。
3. 若要定位具体漏触发，核对实际会话中的原始请求、Target 展示、用户回复与首次实质工具调用，分别判定漏展示和漏等待；任何测试或模型运行另取当前授权。

## 检查边界

- 已直接核对当前协议、三个 task-family 入口、Contract 注入、Pi tool-call handler、核心状态门和相关评测说明，并对照 Git 原始协议差异。
- 自检覆盖四类误判：不把免等待等同漏展示；不把源码或任务勾选当用户授权；不把提示门说成硬拦截；不把历史报告或静态断言当当前触发率。
- 仅更新所属计划记录与其索引项；不修改已有无关工作区变更。该记录按只读调查流程保持 Pending，不声称工作流修复、测试通过或真实误放行率已测得。
