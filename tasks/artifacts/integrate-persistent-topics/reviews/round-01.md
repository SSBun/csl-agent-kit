# 第 01 轮独立审查

主 Agent 元数据：任务 integrate-persistent-topics；run 9eab9cd0-02ad-4bbb-be42-885f5df1f22a；模式 independent subagent；快照 evidence/scope-01.json；结论 findings。主 Agent 在接收后复算 19 个文件摘要，无内容漂移。

以下为 Reviewer 原始反馈：

## Review mode
independent subagent。只读反馈；未编辑文件、修改任务状态或运行测试。

## Reviewed scope / snapshot
依据接受的 T1–T4，审阅 [" /Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/scope-01.json"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/scope-01.json) 所列 19 文件的任务差异及相关源码。归属以 [" /Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/task-owned-01.patch"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/task-owned-01.patch) 为准，未将其他工作区修改归入本任务。

方向符合要求：Topic 独立于 Kind/Queue，支持长期维护；无关联任务不要求 Topic；成员变化不进入规格摘要；版本采用保留 Required 审查义务。

## Findings

### TR-1 · P1 · 解除关联部分失败后，终态门禁无法识别未完成事务
- **位置**：["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/topic-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/topic-core.js)，86–105、307–310、334–379 行。
- **证据**：`association` 首先写 Task，再更新索引和 Topic。解除关联会直接删除 Task 的 Topic 区块。如果后续写入失败且 Task 回滚也失败，`commit` 仅抛出错误，没有持久化未完成关系。此时 `fresh` 因 Task 无绑定直接返回 `applicable: false`。
- **影响**：旧 Topic 仍保留成员，但 Task 后续可以按独立任务重新评估、验证和完成，违反 T2/T3 对“单侧失败标记不完整并阻止终态”的承诺。这不要求实现分布式原子性，但需要可恢复的失败状态。
- **建议**：在首次关系写入前保存包含确切旧/新引用的待完成记录；全部写入成功后清除。freshness 和受限 repair 应读取该记录，失败时不能静默退化为独立任务。

### TR-2 · P1 · freshness 守卫同时阻止记录失败和取消过期任务
- **位置**：["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js)，570–577、703–718、820–828 行。
- **证据**：`writeLocked` 只要写入后的任务仍含 `Skipped/Passed/Approved` 审查记录，就执行 `topics.fresh`，不区分本次操作。已有 `Skipped` 的 In Progress 任务遇到 Topic 更新后：
  1. `recordVerification(..., false, ...)` 虽明确不在入口检查 freshness，最终仍被底层守卫拒绝；
  2. `cancelTask` 保留既有审查记录，也被相同守卫拒绝。
- **影响**：T3 的过期诊断无法直接记录 Failed；T4 的归档前取消活动成员也可能被过期规格阻挡。用户必须先执行无关的证据失效操作才能继续。
- **建议**：仅对新增成功证据、进入审查及完成等依赖当前规格的推进检查 freshness；允许记录失败和取消，必要时同时失效旧成功证据。

### TR-3 · P1 · 规格结构校验发生在提交之后，错误输入会损坏现有 Topic
- **位置**：["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/topic-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/topic-core.js)，184–191、260–271、286–290 行；解析行为见 [" /Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js)，148–174、254–267 行。
- **证据**：例如规格输入 `{"scope":"范围\n\n```text","spec":"FR-1：要求"}` 会通过 `validateSpec`。未闭合代码围栏使后续固定章节不可见；但 `saveTopic` 已提交 revision、Topic 和索引，随后 `readTopic` 才因缺失章节失败，该异常不在 `commit` 回滚范围内。
- **影响**：一次失败的 `update-spec` 会把原本有效的 Topic 留成不可读状态；后续 show、update-spec、repair 和关联任务 freshness 都失败，影响 T1/T3。
- **建议**：提交前对完整候选正文执行与读取一致的结构解析及 round-trip 校验；拒绝输入时保持原 Topic、revision 和索引不变。

以上为源码路径证明，未声称运行复现；均需主 Agent 核实并修复。

## Unverified risks
- **T2/T3，阻断失败恢复验收**：作者日志没有第二/后续写入失败、回滚失败及并发追加的实际证据；新增测试也未覆盖这些故障注入。正常关联日志不能证明这些承诺。
- **T1–T4，快照核验缺口**：前后读取的清单和工作树统计未显示变化，但工具不能复算 19 文件 SHA；统计一致不证明内容一致。当前快照身份仍需主 Agent 收尾只读复算后确认。
- **T4，非单独阻断**：未做新会话行为回放，不能把文档路由检查等同于宿主实际遵守授权边界。

## Checks performed
- 阅读需求、任务专属差异、Topic core/CLI、Task 相关调用链、共享协议、Skill 契约及测试定义。
- 静态追踪关联写入/回滚、规格解析、freshness、失败验证和取消路径。
- 前后检查工作区差异统计并重读快照清单；未执行 shell、CLI 或测试。

## Author evidence examined
以下均为继承证据，未重跑：

- [" /Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/checks-01.log"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/checks-01.log)：七包质量检查无失败，有 context-budget 警告。
- [" /Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/cli-lifecycle.log"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/cli-lifecycle.log)：任务完成后 Topic 保持 Active。
- [" /Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/cli-revision.log"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/cli-revision.log)：过期验证拒绝、显式采用及活动成员归档拒绝。
- [" /Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/cli-cross-workspace.log"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/cli-cross-workspace.log)：跨仓标志要求及 origin 身份变化检测。

## Coverage limits
本轮为静态审查；未验证实际故障注入、网络、安装宿主行为或测试执行结果。未审阅无关脏工作区修改，也未独立验证所列 baseRef 的已提交范围。