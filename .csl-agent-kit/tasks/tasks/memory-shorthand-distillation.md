# 将 Memory 提炼改为核心信息速记

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-04 15:22) |
| Artifacts | [Artifacts](../artifacts/memory-shorthand-distillation/) |
| Kind | Task |

## Target
- [x] T1: Memory 提炼与维护按速记标准仅保留有未来决策价值的核心信息，去除过程标识、流水和修饰
- [x] T2: 精简保留必要条件、例外与技术精确信息，来源继续独立可追溯，不丢失有效知识

## Scope

优化提炼提示、技能规范和说明文字；覆盖新会话提炼及既有周期复查。保留原存储格式、来源、条件写入与删除保护。不会强制批量改写历史记忆或清理原始事件。用户已确认此前完整速记标准并明确要求实施，本任务按同一结果继续。

## Plan

1. 统一系统提示、写入工具描述、技能和文档中的准入、速记与溯源边界。
2. 核对改动、语法、CLI帮助和技能质量；利用现有空闲保护重启激活后台提示。
3. 记录实际生效状态及已有队列阻塞，完成当前内容核验。

## Execution Log

### 001 — 提炼入口与原有约束

后台 createMemorySession 将系统提示与完整 agent-memory Skill 拼接，写入工具已有 sources、reason/source 与审计。无需新增字段、清洗器或存储逻辑。现有“连贯结论”“来源靠近正文”及“正文目标4000”容易引入过程叙述，改为同主题速记、来源元数据独立和无最低长度。所有原有并发、关系、恢复与预算硬限制保持。

### 002 — 速记政策落地与初步核验

已修改 bin/memory/agent.js 的系统提示和工具描述、skills/meta/agent-memory/SKILL.md、docs/memory.md、bin/memory/cli.js 的帮助文字。明确先准入再压缩；正文不含过程ID、确认和验证流水；保留决策必要的否定、范围、条件、时效、技术名及数值；会话和周期维护逐步精简触及条目，不全库重写。人工对照示例确认过程被移出正文而失败但已写入的例外保留。此为政策核对，不是实际模型生成证明。

node --check 两个JS文件及 memory --help 通过。skill-quality 无failure，存在初始上下文超1000 token建议值的warning；保留必需读写、来源与恢复契约。未运行单元/项目测试或额外模型实验；npm run check 内含测试，未执行。

### 003 — 激活前发现既有阻塞

初查 daemon 正在运行且无active批次，但本项目存在旧失败事件，读取了迁移前 tasks/tasks/proactive-memory-maintenance.md，阻挡同项目后续增量。此前发生，与本任务提示修改无关；不擅自修改队列、来源或retry。其他工作区与周期维护能否运行由原调度器决定。空闲保护重启仅用于加载新提炼政策，不宣称修复此阻塞。

### 004 — 后台激活与最终范围核验

空闲保护restart成功，新daemon PID 57135，started=2026-11-04T07:19:39.148Z，协议3，running=true；ps确认执行本工作区bin/memory/daemon.js。旧内存会话已停止，新会话由当前源码与Skill构建。未执行新模型实验，也没有声称观察到本项目新条目产出。项目旧失败仍在，服务全局152 completed/1 failed/45 queued，无调度错误，重启未修复旧阻塞。

最终技能质量无失败，初始上下文估算3286 tokens，超过1000建议值；保留必要完整性与恢复协议，不为消除警告删除约束。四个文件相对编辑前副本的git diff --no-index --check均无空白诊断（no-index存在差异时返回1，不表示校验失败）；仅提示与文档变化，未改写入/删除实现。任务专属差异存于[changes.patch](../artifacts/memory-shorthand-distillation/evidence/changes.patch)。

## Task Summary

**Memory 后台与 CLI**：[bin/memory](../../../bin/memory/)更新系统提示、写入工具说明及帮助文字，明确先筛选再精简，正文与溯源分离；后台已在空闲窗口重启。

**Memory 技能**：[skills/meta/agent-memory](../../../skills/meta/agent-memory/)增加速记准入、逐项复核和旧条目渐进提炼要求，保留必要精确信息与来源。

**Memory 文档**：[docs/memory.md](../../../docs/memory.md)同步速记契约与预算语义，明确语义提炼由模型负责，存储校验不替代语义判断。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 复用既有提示、Skill、sources与审计；4个文件只改文字，无清洗器、字段、依赖和全库迁移 | 技能上下文3286 tokens，超过建议值；已有完整协议仍需随提示加载 |
| 稳定性 | A | 语法、CLI帮助、Skill质量、任务专属差异核对通过；保留CAS、关系、删除保护与来源；空闲重启后服务正常 | 未运行测试或模型实验，不能保证所有模型输出质量；项目旧队列失败未修复 |
| 完整性 | A | T1/T2规则覆盖正文、摘要、检索词、来源分离和两种维护入口；人工核对确认/过程流水应忽略、技术键及失败写入例外保留、无实质增量不写入；服务已重启 | 未批量精简旧库；本项目尚受旧失败阻塞，未观察到新政策生成实际条目 |

## Result

- T1: 已核对系统提示、memory_apply工具描述、Skill和CLI/文档均要求先准入再速记，去掉过程标识与流水；会话和周期复查复用同一Skill。空闲重启后PID57135运行本工作区daemon。
- T2: 差异仅为提示和说明文字，保留范围、条件、例外、技术名称/数值及来源元数据；CAS、关系、删除和恢复实现无变化。人工核对示例保留失败但已写入例外；未改真实记忆。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 限定的提炼政策与帮助文字变更，无存储或权限逻辑改动
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-shorthand-distillation/evidence/6a87ebd1f9bbbe7c3690dc020cbc958e1d8d0aa2978efaa1b5ab04e0d9b64b10.json#6a87ebd1f9bbbe7c3690dc020cbc958e1d8d0aa2978efaa1b5ab04e0d9b64b10
- Evidence: Execution Log 002/004与changes.patch；两次JS语法检查、CLI帮助、Skill质量和空闲重启状态观察
- Result clarity: 用户已确认速记、去过程ID、保留必要条件与独立溯源；四份文字一致，未引入新字段或强制截断
- Bounded impact: 修改仅限系统提示、工具描述、Skill及说明文字；既有会话和周期入口均加载Skill；存储格式与写入实现未改
- Low risk: 无真实库批量改写、自动清洗或放宽删除保护，原有CAS审计恢复保持；政策可逆，来源和限定显式保留
- Sufficient verification: 语法、帮助输出、Skill质量无失败、差异及规则逐项自检通过；新daemon路径与PID核对。未执行测试/模型实验；原队列阻塞和模型服从性限制明确记录
- Task fingerprint: 99f6ac33556d48ca6bae1ef6d8ca466693b96ca7063f25cf41cf5b9e3b8e9dc6

## Verification

- Passed: 最终两个JS语法再次通过，快照覆盖4个修改文件及专属差异；服务running且路径正确，已知队列阻塞未冒充修复；技能仅context-budget警告，未声称实测模型提炼效果
