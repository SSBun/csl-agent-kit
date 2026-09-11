# 生成完整标准 Task 记录样例

Status: Completed (2026-09-11 17:31)
Kind: Task

## Scope

- 生成一个中文展示用 Markdown 样例，覆盖 Task、Plan、Queue 的标准记录内容与条件分支；示例不加入真实业务任务索引，不伪造执行或审查证据。
- 不修改 Task 标准、核心实现、现有任务记录或并行进行的审查分级改动。

## Target
- [x] T1: 按包含 Review Assessment 与 R0/R1/R2 的新标准，生成可供用户检查的完整 Markdown Task 记录样例，覆盖全部标准字段、可选章节与状态分支，并区分不能同时生效的内容。

## Decisions

- 用户明确选择选项 2：按本次审查分级更新后的新标准生成，纳入 Review Assessment；交付前核对工作流说明、协议及核心解析一致。
- 全字段是可用内容全集，不意味着每条真实任务都必须保留全部章节；主样例与互斥分支分开，示例中的业务、证据和状态均显式标注为虚构。

## Plan

1. 对照 Task 家族、共享协议及核心解析与完成逻辑，形成字段和条件分支清单。
2. 编写一份可解析的充分展开样例，并在同一文件附上互斥状态、Queue 关系与非持久化内容的说明。
3. 用当前核心只读解析样例、检查覆盖与状态一致性；不运行测试套件，不把示例业务写入真实任务索引。
4. 主 Agent 自检后执行 fresh 只读 task-review，处理确认问题并核验最终内容后交付。

## Deliverable

- [完整标准 Task 记录样例](../artifacts/generate-full-standard-task-record-example/specs/standard-task-record.md)

## Result

- T1: 已生成 Deliverable 指向的 299 行中文单文件：完整主记录＋全部标准字段、R1 四依据、R0/R1/R2 与六状态、Plan/Queue/索引/非持久化边界附录；按九份当前权威来源逐项比对。当前核心在隔离示例工作区解析主记录为 Blocked/Task、T1/T3 有 Result、T2 未勾、R2/Stale、Required、TR-1=2、Failed；隔离 validate 零错误、check 一致，未污染真实任务目录或索引。10 个绝对来源/任务链接均存在，无行尾空格；owning check 与 workspace validate 均通过。自检排除了字段遗漏、互斥状态并存、虚构证据误用、假父子图污染、并行来源漂移五类风险。产物 SHA256 eb4bae020d175765a3b31ac3ecbcc7fbc22f261d0e2229a82f931a5186938890；附录六所列九来源按顺序 path/sha256 JSON 的聚合 SHA256 fb820074f631357ddb888d30884fe21470208cc58f81ad4f2079064f215abdc4。局限：基于未提交的新标准工作树，未运行测试、模型评测或虚构业务检查；结构检查不证明业务实现。
- Review gate: Passed — 原生 fresh 只读 reviewer run ce7d14cd-70e0-4cf0-85dc-ef76ffe458f7 已 complete/exit 0，全文及当前契约单轮审查 Findings none，无阻断 T1 的风险；主 Agent 已复算产物 SHA256 eb4bae020d175765a3b31ac3ecbcc7fbc22f261d0e2229a82f931a5186938890 与九来源聚合 fb820074f631357ddb888d30884fe21470208cc58f81ad4f2079064f215abdc4，均未漂移。宿主另有非显式 inferred acceptance rejected：将只读审查误套 Implement criterion 与 commands-run 要求；status 显示无写入，guide 明定 inferred gate 不使 run 失败，未把该提示当作业务发现或执行通过。仅依据实际只读审查及主 Agent 快照复核记录普通 Passed，不记录 Approved。审查会话：["/Users/caishilin/.pi/agent/sessions/--Users-caishilin-Desktop-personal-skills--/2026-09-11T07-33-13-595Z_01a08f62-84fb-7919-8385-9a231c4c13d0/95df7da1-d250-46aa-8941-cf3eabe1aae7/run-0/session.jsonl"](file:///Users/caishilin/.pi/agent/sessions/--Users-caishilin-Desktop-personal-skills--/2026-09-11T07-33-13-595Z_01a08f62-84fb-7919-8385-9a231c4c13d0/95df7da1-d250-46aa-8941-cf3eabe1aae7/run-0/session.jsonl)。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 样例覆盖三类工作流、六状态及新分级和失效规则的交互，错误可能误导后续任务门禁；不能仅凭单一文档和解析通过认定简单低风险。
- Snapshot: 单一新建交付物 standard-task-record.md SHA256 eb4bae020d175765a3b31ac3ecbcc7fbc22f261d0e2229a82f931a5186938890；九个来源内容聚合 fb820074f631357ddb888d30884fe21470208cc58f81ad4f2079064f215abdc4，按产物附录六顺序，排除无关工作树改动。
- Evidence: 当前 Result T1 记录了字段覆盖自检、隔离 core 解析/check/validate、十链接、状态一致性、无假任务索引及来源漂移检查；未运行测试或虚构业务检查。
- Task fingerprint: 0ec7d28f3830e21de5af37c3e7d810338d9d37113b01683b2e75f222fd87a1ce

## Verification

- Passed: 在最终 Passed 门禁之后重新核验：产物 SHA256 eb4bae020d175765a3b31ac3ecbcc7fbc22f261d0e2229a82f931a5186938890、九来源聚合 fb820074f631357ddb888d30884fe21470208cc58f81ad4f2079064f215abdc4 与审查快照一致；隔离只读解析得到预期 Blocked/R2-Stale/Required/未解决 ledger/Failed 的虚构主记录，validate 无误且索引匹配。十个本地链接存在、无行尾空格、未生成真实假业务记录；owning check、workspace validate、Context validate 和 scoped diff --check 均通过，focus 已实际核对。未运行测试、自测、模型评测或虚构业务检查；文档中的示例状态不代表本次生成任务状态。
