# Review round 01

- Schema: task-review-report/v1
- Task: implement-recall-first-memory-index
- Round: 01
- Snapshot: snapshot:tasks/artifacts/implement-recall-first-memory-index/evidence/119b313aeeefda0d290af387ac4b35b559dfb1941d329f6d4273cae227f3a2a7.json#119b313aeeefda0d290af387ac4b35b559dfb1941d329f6d4273cae227f3a2a7
- Task fingerprint: e44a9c7ec085e6281ebdd078e039a1e8232edef9cbfe88ac593e5085b308da25
- Outcome: findings
- Mode: independent subagent
- Run: 896a5e9f-770c-4c13-9dc7-7f4108e4c5a9

## Reviewer feedback

## Review

**Review mode**：independent subagent，只读实现审查。

**Scope / snapshot**：T1—T4；所给manifest中的16个冻结文件及必要基线。快照标识：`119b313aeeefda0d290af387ac4b35b559dfb1941d329f6d4273cae227f3a2a7`。已前后读取manifest，未独立重算文件hash，不声称已验证全部字节一致。

### Correct

- 编译器覆盖全部有效chip，不因缺少主题或语义增强而省略卡片；generation包含条目集合身份，反向supersedes随新代重建。
- 发布顺序、pending恢复、格式转换备份及永久旧writer隔离均有对应实现；消费者明确要求代际复查和覆盖不足降级。

### Findings

#### TR-1

- **Severity**：P1 / Concern，需修复；影响T1、T3及T4写入入口一致性。
- **Location**：["/Users/caishilin/Desktop/personal/skills/bin/memory/store.js"](file:///Users/caishilin/Desktop/personal/skills/bin/memory/store.js)，377—383、492—503、519—526行。
- **Issue**：批准手工提案会绕过新增关系的目标存在性校验。
- **Evidence**：`propose()`只校验mutation结构及CAS；`decide()`批准时固定传入`preserveLegacy: true`，而新增引用校验被放在`!preserveLegacy`条件内。编译器遇到缺失目标仅生成诊断，不拒绝提交。因此，新提案携带指向不存在chip的`requires`，经批准仍可写入；直接`mutate()`同样内容则返回`REFERENCE_NOT_FOUND`。这是新增retrieval功能与既有保真例外组合后出现的入口差异，非旧预算行为本身。该结论来自调用链检查，未执行复现。
- **Impact**：违反“新引用必须指向有效chip”的契约；CLI/Web批准入口可提交无法满足的必要依赖，并使索引立即降级。人工批准不能替代机械引用校验。
- **Suggested next step**：将历史内容预算豁免与关系校验分离；提案批准仍校验新增目标，并传入当前两级reference roots。精确历史恢复保留单独的保真策略。补充“目标原本不存在”和“提案后目标被删除”的批准路径用例；执行验证须遵守授权边界。

### Unverified risks

- **快照及最终运行态**：未独立重算hash，也未读取真实记忆正文或实时服务。owner仍须完成最终快照和运行态核对；缺少该核对会阻断T4最终验证，不构成已确认漂移。
- **Pi完整会话、并发/崩溃排列、语义召回**：现有证据未覆盖完整新Pi会话、所有故障排列或召回提升。按已接受的验证边界，这些限制本身不新增T1—T4阻断项；不能据此声称端到端或召回性能已验证。

### Checks performed

- 阅读设计、目标、编译器、存储/迁移、服务及消费者相关实现。
- 对照旧store基线核查新增关系校验与批准入口。
- 阅读两份测试源码，未运行测试、模型实验、写入或服务控制命令。
- 检查manifest范围并在结束前重读；未审计无关dirty文件。

### Author evidence examined

已阅读Execution Log003/004、Result、Self Assessment及["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/implement-recall-first-memory-index/evidence/runtime-observations.md"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/implement-recall-first-memory-index/evidence/runtime-observations.md)。其中静态检查、CLI恢复、旧writer拒绝、Chrome及真实升级结果均为作者证据，不是本Reviewer重新执行的结果。

### Coverage limits

本轮是源码与证据审查，不是运行验证。首次读取任务记录时工具同时返回了作者证据段落，因此不宣称严格盲审。TR-1需由owner核实、修复并刷新相关证据；本反馈不授予完成许可。