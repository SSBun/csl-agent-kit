# Review round 03

- Schema: task-review-report/v1
- Task: implement-recall-first-memory-index
- Round: 03
- Snapshot: snapshot:tasks/artifacts/implement-recall-first-memory-index/evidence/398222230aa672689d45bcbaa5237a73deccea23328f56b2631774ef2ce259ba.json#398222230aa672689d45bcbaa5237a73deccea23328f56b2631774ef2ce259ba
- Task fingerprint: d1f542589dc2a935e3623ae5ea124985e8dde608bfda3b0bf7f284155340f2cc
- Outcome: findings
- Mode: independent subagent
- Run: 575c3dda-3b74-4009-ac15-b9da24dadfc0

## Reviewer feedback

## Review

**Review mode**：independent subagent；fresh、只读实现审查。

**Scope / snapshot**：覆盖所给16个冻结文件及T1—T4，快照标识为`398222230aa672689d45bcbaa5237a73deccea23328f56b2631774ef2ce259ba`。前后读取manifest一致；未独立重算文件hash。

### Correct
- 完整卡片编译不依赖主题或语义增强；反向替代关系随generation更新。
- 预算保真与历史引用恢复例外已分离，批准入口重新校验新增引用。
- 迁移保留正文、身份与审计，旧writer隔离及失败降级有对应实现。

### Findings

#### TR-3 — P1 / Concern：升级后仅执行 `/reload` 仍可能保留不兼容的Memory模块

- **Location**：["/Users/caishilin/Desktop/personal/skills/pi/lib/memory-bridge.ts"](file:///Users/caishilin/Desktop/personal/skills/pi/lib/memory-bridge.ts)，第8—16、26、38、72、87行。
- **Issue**：bridge只清除`store.js`的原生CommonJS缓存，却继续使用缓存中的`migration.js`和`service.js`。本次store/service升级至v3，使这一既有缓存策略产生实际版本不兼容。
- **Evidence**：
  - 所给基线的migration固定`VERSION=2`；旧service拒绝非protocol 2服务。
  - 升级前已加载bridge的Pi进程执行`/reload`后，新的store可以加载，但旧migration对象仍保留。其升级检查拒绝v3格式；`activated()`也会因`marker.version !== migration.VERSION`失败，影响总览注入及增量入队。
  - 已检查当前安装SDK：其`clearExtensionCache()`清除扩展缓存，不清除上述`createRequire`原生缓存。该结论来自源码调用链，未运行复现。
- **Impact**：当前“旧前台执行 `/reload`”不能可靠恢复T2/T4入口。后台维护恢复成功不能证明这个前台升级路径正常。
- **Next step**：最小方案是明确要求升级前已加载模块的用户**退出并重新启动Pi进程**，修正仅重载扩展即可恢复的指引；若必须支持`/reload`，需一致刷新相关Memory依赖，而不只刷新store。在授权范围内核对“旧模块已加载→升级v3→恢复入口”的行为。

### Previous findings

- **TR-1：resolved。** 当前store第379—385、529—530行保留新增引用校验和当前两级根；只有历史恢复第563行开启独立例外。测试源码及作者隔离API观察与实现一致。
- **TR-2：resolved（针对原运行态证据缺口）。** 作者提供一次授权retry后`completed/attempts=2`、committed事务及source/afterHash匹配，后续积压正常完成并复用会话，足以补齐原缺口。首次模型错误根因仍未知；此结论不表示未知根因已修复，也不覆盖TR-3前台问题。

### Unverified risks

- **最终字节与运行态**：未重算冻结文件hash、未直接查询实时服务。owner仍须完成最终身份及最新运行态核对；缺少该步骤阻断T4最终验证，不代表已发现漂移。
- **非新增阻断限制**：未执行测试套件、完整新Pi会话、全部崩溃/并发排列或语义召回评测；诊断失败分支也未动态触发。不得据静态实现声称这些行为或召回提升已经验证。

### Checks performed

- 阅读审查协议、架构要求及全部冻结源码、文档和两份测试源码。
- 检查编译、CAS、关系、批准/恢复、迁移、旧writer隔离、队列和各消费者入口。
- 对照旧store、migration及Pi基线，补查SDK重载缓存机制。
- 前后读取manifest；未编辑、运行测试、调用模型、控制服务或读取真实记忆正文。

### Author evidence examined

实际产物检查后阅读前两轮报告、ledger、Log007、Result、Self Assessment，以及["/Users/caishilin/Desktop/personal/skills/tasks/artifacts/implement-recall-first-memory-index/evidence/runtime-observations.md"](file:///Users/caishilin/Desktop/personal/skills/tasks/artifacts/implement-recall-first-memory-index/evidence/runtime-observations.md)。

语法、tsc、Skill质量门、隔离操作及真实维护恢复均为作者证据，不是本Reviewer重跑结果；接受的预算警告仍保留。

### Coverage limits

本轮为源码与证据审查，不是运行验证。目标文件未跟踪，`watchdog_diff`不能提供其历史差异，归因使用所给基线；未审查无关dirty内容。未加载真实记忆正文，因此未完成记忆候选正文及关系核验，也未以记忆作为判断依据。

TR-3需要owner核实并处理；本反馈不授予完成许可。