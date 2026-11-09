# 第 02 轮独立审查

主 Agent 元数据：任务 integrate-persistent-topics；run 97195aea-07c2-4d64-8f2b-088aaf27c009；快照 evidence/scope-02.json；19文件摘要已复算，无漂移。结论：TR-1/2/3 resolved，新发现 TR-4。

以下为 Reviewer 原始反馈：

## Review

**Review mode**：independent subagent。仅提供只读反馈，未编辑、改变任务状态或执行测试。

### Reviewed scope / snapshot

按 T1–T4 审阅第02轮任务专属差异、Topic core/CLI、Task 门禁、相关流程契约与测试：

- 快照：["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/scope-02.json"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/scope-02.json)，19文件，baseRef `02a16f27c06e968262568ceb4b17321de63e3359`。
- 归属依据：["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/task-owned-02.patch"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/task-owned-02.patch)。
- 未将无关脏内容纳入审查；未声称审阅 baseRef 的已提交范围。

**Correct**：Topic 与 Kind/Queue 分离，独立任务不要求绑定；成员变化不改变规范摘要；采用新版本保留 Required 审查义务。前轮三项核心修复均有源码与新增回归支持。

### Previous findings

源码位置均指 ["/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/topic-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/topic-core.js)，另有注明除外。

| ID | 处置 | 当前证据 |
|---|---|---|
| TR-1 | **resolved** | 318–360、433–442、508–523行：首次关系写入前持久化 pending；fresh 在检查绑定前检查 pending；失败或回滚失败保留阻断；repair 核对确切旧/新反向引用后清除。新增失败、回滚失败和并发追加测试及执行日志支持原问题修复。另发现索引恢复遗漏，列为 TR-4。 |
| TR-2 | **resolved** | ["​​/Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js"](file:///Users/caishilin/Desktop/personal/skills/skills/meta/csl-tasks/shared/lib/task-core.js) 571–581、709–715、826–834行：底层改为检查成功推进；Failed 验证和取消失效旧证据，不要求 freshness。对应回归已记录通过。 |
| TR-3 | **resolved** | 262–275行：完整候选在 commit 前 parse；parseTopic 还执行 canonical round-trip。未闭合围栏、注释及 HTML 的回归同时检查 Topic、索引和 revision 未改变。 |

### Findings

#### TR-4 · P2 · 关联失败后的 repair 可清除 pending，却遗留错误的 Task 索引

- **Location**：上述 topic-core 源码 386–391、420–424、508–523行；task-core 917–926行。
- **Issue**：关联操作将 In Review 任务退回 In Progress，同时写 Task 索引；但 pending 恢复只核对、修复 Topic backlink，不恢复或检查 Task 索引。
- **Evidence**：从 In Review 执行 detach，复用现有故障测试的条件——Topic 写失败、Task 回滚失败：
  1. Task 已变成 In Progress 且解除绑定；
  2. 索引写入成功，随后回滚为原 In Review；
  3. repair 删除旧 backlink 后，`finishPending` 清除 journal；
  4. Task 与索引仍不一致，`checkTaskIndex` 必然抛出 `task index entry does not match the canonical task`。

  这是源码路径证明，未运行复现。当前故障测试从 Pending 开始，状态不变，因此未覆盖该分支。
- **Impact**：T2 的恢复路径结束后仍残留不一致导航，并使现有 Task 校验失败。终态绕过问题已修复，但恢复结果并不完整。
- **Suggested next step**：在受限恢复中同步该任务的确切索引条目，并在清除 pending 前验证；或明确保留 pending，要求执行既有索引同步后再完成恢复。补充从 In Review 开始的故障回归，断言 Task 索引一致。

### Unverified risks

- **快照身份，T1–T4，条件性阻断**：前后共享 core 差异统计一致，未观察到漂移；工具无法独立复算19文件 SHA。主 Agent 仍须执行约定的收尾复算；不匹配则本轮结论不能绑定当前产物。
- **新会话行为，T4，非单独阻断**：未做宿主新会话回放，文档与静态检查不能证明真实会话一定遵守对齐、授权和非自动执行边界。
- **质量警告，非阻断**：七包均有 context-budget 警告；影响上下文负担，现有证据未证明功能失败。

### Checks performed / author evidence

**实际检查**：先读需求与产物，再读作者证据；静态追踪提交、回滚、pending、repair、freshness、取消、Failed 验证及候选解析；对照新增测试；前后检查限定差异统计。未执行 shell、测试或故障注入。

**继承证据，未重跑**：

- ["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/unit-tests-03.log"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/unit-tests-03.log)：59/59，包括本轮五项相关回归。
- ["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/unit-tests-04.log"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/unit-tests-04.log)：81/82。
- ["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/pre-existing-maintenance-failure.log"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/pre-existing-maintenance-failure.log)：基线同样存在 task-maintenance 文案断言失败；不据此要求无关清理，也不将其认定为本任务阻断。
- ["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/checks-02.log"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/integrate-persistent-topics/evidence/checks-02.log)：七包质量无失败，Context 校验有效。

**Coverage limits**：测试执行仅依据日志；未独立验证安装宿主、跨仓故障恢复或运行新回归。旧 CLI 日志本轮未重新检查，不作为新修复证明。

**Merge verdict：BLOCK**。仅表示按本任务 review 契约，TR-4 应返回主 Agent 核实和处理；不构成状态变更或完成授权。