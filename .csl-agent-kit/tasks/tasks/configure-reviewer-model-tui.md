# 提供审查模型与思考强度的 TUI 配置面板

Status: Blocked (2026-09-17 15:12)
Kind: Task

## Scope

仅实现 Pi 中的 CSL Agent Kit 通用设置入口及首批审查设置；不修改父 Agent、其他角色或第三方安装文件。用户配置保存在 CSL 用户数据目录，审查沿用宿主 subagent 启动机制。

## Plan

1. 实现通用设置面板及独立可清空的审查模型、思考强度持久化。
2. 提供启动前的只读审查配置解析入口，通过工具指引接入 CSL 审查流程，解析结果显式覆盖 carrier 默认值。
3. 补充使用说明与回归用例；执行非测试验证，记录未运行测试及交互验证边界。
4. 完成主 Agent 自检和独立只读审查，处理发现后验证并交付。

## Target
- [x] T1: CSL Agent Kit 提供通用配置 TUI 面板，审查模型与思考强度作为首批配置项，后续其他配置项可纳入同一面板。
- [x] T2: 审查模型或思考强度未配置时，对应项继承父 Agent 的实际配置；全部为空时两项均继承父 Agent。
- [x] T3: 配置作用于 CSL Agent Kit 发起的 reviewer 审查，清空设置可恢复继承行为。

## Result

- T1: 实现 /csl-settings 通用设置入口与显式保存/取消；静态核对独立字段清空、原子写入和保留未知字段路径。严格 tsc、测试源码 node --check、npm pack --dry-run 均通过。未运行 TUI 交互或单元测试，不能声称动态交互验证通过。
- T2: 使用新增只读解析代码查询当前真实配置和宿主注入的 PI_PROVIDER/PI_MODEL/PI_REASONING_LEVEL：model=openai-codex/gpt-6-astra、thinking=medium、两项来源均为 parent、launch.model=openai-codex/gpt-6-astra:medium；没有写入用户配置。部分设置和 off 分支已静态检查，相关新增用例未运行。
- T3: csl_review_config 的工具指引要求 CSL task-review/adversarial-review 在 Reviewer 子调用上使用 launch.model，并排除 Editor、其他流程和既有恢复实例；README 同步说明显式接入而非全局拦截。已核对安装版 pi-subagents models 文档的逐次 model:thinking 优先级；尚无新扩展已加载后的端到端审查证据。
- Review gate: Required — R2：请求 fresh 只读 task-review，检查当前快照及验证缺口。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Stale
- Reason: 新增跨配置持久化、TUI 与审查调度参数的行为；动态交互与端到端验证仍有限，需要独立检查遗漏。
- Snapshot: sha256:7240e2ff566d47ad05e09d5f42da2fd9e3d0ea7b77ff7e159a970ae01425bc4c (tasks/artifacts/configure-reviewer-model-tui/evidence/snapshot-01.json)
- Evidence: 任务 Result T1–T3；tsc 严格类型检查、node --check、npm pack --dry-run、git diff --check、Context validate 均通过；真实只读解析得到 astra:medium，未运行测试或 TUI 交互。
- Task fingerprint: 834e2521b4dc67f89bc2c21777b181a0fd182aaef344d5ae49ea0d593b95c230
## Review

- Schema: task-review-ledger/v1
- Pass: 1
- Next finding: 3
- `TR-1` | no-progress=0 | Pi TUI 与 CSL Reviewer 实际启动链路 | 在加载新扩展后验证保存、取消、清空、双空继承、单项覆盖、off，并确认新 Reviewer 启动契约和非 Reviewer 不受影响。
- `TR-2` | no-progress=0 | 审查快照绑定 | 后续 fresh pass 核对真实文件身份；主 Agent 已重算全部范围 SHA-256，全部与原清单一致，证据见 post-review-01.json，尚未经下一轮 Reviewer 核对。

## Review Reports

| Round | Report | Snapshot | Outcome |
| --- | --- | --- | --- |
| 01 | [第 01 轮](../artifacts/configure-reviewer-model-tui/reviews/round-01.md) | sha256:7240e2ff566d47ad05e09d5f42da2fd9e3d0ea7b77ff7e159a970ae01425bc4c | findings: TR-1、TR-2（验证缺口，无已证实代码缺陷） |

## Block

- Reason: 静态检查通过，但新扩展尚未在当前 Pi 会话加载，缺少真实 TUI 与配置调度证据；独立审查要求补齐 TR-1，并在下一轮核对 TR-2。主 Agent 审查后快照复核见 [文件身份检查](../artifacts/configure-reviewer-model-tui/evidence/post-review-01.json)。
- Unblock when: 用户加载新扩展并允许完成真实 TUI/审查启动验证，取得可记录的功能证据后恢复任务；随后 fresh 只读复审核对两项验证缺口。
