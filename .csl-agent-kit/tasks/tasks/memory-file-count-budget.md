# 限制记忆文件数量并推动压缩整合

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-05 19:43) |
| Artifacts | [Artifacts](../artifacts/memory-file-count-budget/) |
| Kind | Task |

## Target
- [x] T1: 每个项目独立拥有最多 20 个有效记忆 chips 的容量。
- [x] T2: 每个项目记忆 chip 的正文不超过 1000 词。
- [x] T3: 记忆系统通过清理、抽象和合并满足容量与长度限制，使记忆紧凑且便于检索。
- [x] T4: 每个项目仅生成一个 index.md 记忆索引，直接链接全部有效 chips，不再生成卡片或主题索引文件。

## Scope

本次调整项目级记忆；用户级记忆配额不在本次范围内。有效 chips 为统计对象，生成索引、历史版本及恢复备份不计入容量。

## Execution Log

### 001 — 用户明确容量与长度限制

用户将最初的 30 个文件提议修订为每个项目独立最多 100 个 chips，并要求每个记忆文件不超过 1000 词。当前尚未修改实现，等待完整目标核对。

### 002 — 项目容量下调至 20

用户将每个项目容量从 100 个 chips 下调至 20 个；每个 chip 正文最多 1000 词的限制保持不变。

### 003 — 完整目标已确认并开始实施

用户确认 20 chips、每 chip 最多 1000 词，随后确认项目单索引并明确移除主题索引。项目索引直接列出全部有效 chips，取消额外卡片和主题文件；用户级记忆布局与配额保持原样。

现有项目库有 59 个有效 chips。保留既有正文，以后台有证据的合并逐步收敛；新写入执行限制，无法无损整理时报告未达标，不截断或按数量直接删除。字数采用 Intl.Segmenter 的中文 word 分段，统计 isWordLike 段，支持中英文混排。

### 004 — 实现审查与运行态切换

独立只读Reviewer完成代码及调用路径审查，未发现确认缺陷；报告保存在reviews/round-01.md。审查前后12项快照均verified，Reviewer明确未独立计算hash；实际语义整理与运行态不在该轮完成声明中。

空闲时通过现有restart命令将后台切换到protocol4；项目upgrade成功，单索引已发布且旧.indexes不存在，59条有效正文保留。后台首次处理时将用户根格式升级为v4，用户3条记忆及原generation保持不变。投递项目维护事件afd475c79fb1cd1b04cd4aa9125ffcc86a36f806f18e9b3054ebf2610d7ca83b，当前正在首次尝试；尚未证明59条与3条超长记忆已收敛。旧Pi前台模块仍需用户完整重启。

### 005 — 实际整理受来源核对能力阻塞，补齐只读入口

首次维护事件耗尽两次尝试，末次输出明确无法执行Skill要求的legacy-sources核对，拒绝猜测迁移后的来源路径；仅有一项SOP记忆修正提交，数量仍59，3条超长。原exhausted记录保留，未重置attempts。

为解除可复现的能力缺口，后台新增只读memory_legacy_sources工具，复用migration.sourceInventory验证逻辑并返回绝对resolvedPath/hash；同步Skill和文档。语法检查通过，Skill Quality零失败（上下文警告3250 tokens），实际CLI来源清单校验通过。空闲重启后台后投递新能力版本的维护事件05845b4540440024948d01056ec42aed7d45d3c9d4bdc6c7de8db33b7ed4c81c，仍沿用每事件两次上限。

### 006 — 完整索引整理与最终阻塞状态

第二事件提交7项修改，数量59→55，3条超长正文全部压缩达标。观察到模型把起始候选当作整理范围，故在维护契约中明确：超容量时扫描完整项目索引，候选仅为起点，继续至达标或具体阻塞。该版本语法检查与Skill Quality通过（3271-token上下文警告）。原事件未重置，重载后新事件c1bae1a28c725d1e4ee345ac6620762f4baaa951366050fdaf0640f02010c8de执行完整范围维护。

第三事件提交20项修改，最终因五分钟截止时间耗尽两次尝试，数量55→41，未达20。最终复核：后台protocol4、项目format4、published、无pending、单索引、无缺失引用、无.indexes、全部正文≤1000词；用户3条记忆及原generation不变。三事件分别保留1/7/20项审计effects，原文在历史中，证据见runtime-result.json。未重新投递同一输入以绕过次数上限。

T1/T3未完成，任务保持阻塞；恢复前需满足既有自动恢复契约的有效新输入或明确维护窗口，并先检查现有部分提交。不得把已exhausted事件重新计数，或为达标任意删除知识。恢复后还需检查全部合并结果、刷新自检与快照并进行fresh独立审查。round-01仅覆盖早期快照，新增来源工具与维护范围说明未包含在该轮中。旧Pi前台须完整退出并重启，/reload不足以更新已加载模块。

### 007 — 用户明确请求直接整理本工作区存量

用户要求按新设计重新组织本工作区记忆，继续同一未完成结果。采用正式CLI条件写入直接整理，不重投已耗尽后台事件、不修改后台期限或次数。读取全部41条正文，按11组相容主题归并为19条；保留来源、独有条件和检索入口，先保存回读，再通过入链检查逻辑删除。原始内容和分组计划分别保存为reorganization-before.json与reorganization-plan.json。历史语言约定与当前实际注入规则冲突，按/Users/caishilin/AGENTS.md补明当前适用边界。

### 008 — 存量整理与逐项核验完成

通过正式CLI提交11次合并更新、22次逻辑删除，41条归并为19条，最大正文975词。逐项对照全部41条原始条目：来源全部保留；37条原正文完整包含在目标中，4条仅补正历史语言约定对当前规则的适用边界。未参与合并的8条hash不变。所有目标先保存并完整回读后删除旧项，原文保留审计；组内关系重映射且当前无缺失引用、无pending，用户generation与3条内容未变。证据见reorganization-verification.json和reorganization-effects.json。

## Task Summary

**Memory 运行时**：[bin/memory](../../../bin/memory)增加项目20 chips与1000词写入约束，提供预算状态、旧来源只读核对工具和维护完成检查，项目只生成index.md；v4升级隔离旧写入者并清理旧派生索引。

**Memory 读取接入**：[Pi 接入](../../../pi/lib)与[Agent Hooks](../../../skills/meta/agent-hooks)按作用域选择项目单索引或用户卡片库，项目索引不套用用户薄总览长度限制。

**Memory 契约与验证**：[agent-memory](../../../skills/meta/agent-memory)、[文档](../../../docs/memory.md)和[回归用例](../../../tests)同步容量、词数、索引及升级约定；回归用例已更新但未运行。

**项目记忆**：[Memory库](../../memory)将41条归并为19个相容主题，保留来源与正文条件，修正历史语言约定的当前适用边界；22条冗余记录转为可审计墓碑，索引由writer重建。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用现有writer、索引编译、维护批次和恢复锁；只增加项目分支及v4隔离。 | 保留用户多文件布局及旧导入恢复路径，双布局是明确范围要求。 |
| 稳定性 | A | 原41条逐项覆盖、来源集合完整保留，37条正文保真包含，4条语言边界显式修正；正式writer写锁/CAS、先存后删与回读完成，无pending或缺失引用，用户generation未变。 | 未运行测试套件；历史知识的所有外部来源未重新开展全仓审计，保留原条件及权威入口。旧Pi前台加载状态不在当前存量整理证明范围。 |
| 完整性 | A | 当前19条、最大975词、完整单索引且无旧.indexes；全部原条目有保留目标与来源，原文审计可追溯。 | 当前运行态满足容量；长期自动维护语义质量不由本次整理保证。 |

## Plan

1. 按相容主题整理现有41条记忆，保留独有知识、来源和关系，通过正式writer写入并回读。
2. 核对≤20条、正文≤1000词、完整单索引、引用有效、用户记忆未变及原文可恢复。
3. 刷新整个任务的证据和独立审查，最终验证后完成。

## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 保留既有R2义务；本次跨条目重组及先前运行时补充需独立核对知识保真、来源、引用和容量。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-file-count-budget/evidence/144bf9b796dc7e82c3e9d1db95871724b1bcea0194a27520d1d954758b8e3e36.json#144bf9b796dc7e82c3e9d1db95871724b1bcea0194a27520d1d954758b8e3e36
- Evidence: Result T1–T4与reorganization-verification.json；当前19条、最大975词、41条来源覆盖、用户库未变。
- Task fingerprint: 24d944e65ab4be15542f1985c673f19ea35fd380f7c2e3a366352574267d209f
## Result

- T1: 真实库已由41归并为19条，budget.overCapacity=false；写入上限20的既有CLI证据保留。 见evidence/reorganization-verification.json。
- T2: 当前19条正文最大975词，oversized为空；既有1000/1001词边界证据保留。 见evidence/reorganization-verification.json。
- T3: 11次合并、22次逻辑删除；全部41条原始内容有明确去向，sources全部保留，37条正文保真包含，4条语言边界显式修正；8条未合并内容hash不变，先保存回读后删除，无缺失引用。 见evidence/reorganization-verification.json。
- T4: 项目layout=single、count=19、published、无pending、无.indexes；用户3条记忆和原generation不变。 见evidence/reorganization-verification.json。
- Review gate: Passed — fresh只读Reviewer a578b3d2-c60f-4a66-a895-4a78d2e69459检查当前62文件快照，round-02无确认缺陷或Target阻断风险；退出及报告登记后check-evidence均verified。
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/memory-file-count-budget/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-file-count-budget/evidence/278cc1fd2046ab8dc592512adaa16768627e7d892eff9e59d857a641b9d90e5a.json#278cc1fd2046ab8dc592512adaa16768627e7d892eff9e59d857a641b9d90e5a | no blocking findings | a74f38b3377e6f1775da1d27cfc588e2b0866fa44641fc49d59929cd267d1a47 |
| 02 | [Round 02](../artifacts/memory-file-count-budget/reviews/round-02.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-file-count-budget/evidence/144bf9b796dc7e82c3e9d1db95871724b1bcea0194a27520d1d954758b8e3e36.json#144bf9b796dc7e82c3e9d1db95871724b1bcea0194a27520d1d954758b8e3e36 | no blocking findings | e78999de9df1fab55728bcc1a049de3ca9da2e44f338d8d3af9c224951619017 |

## Verification

- Passed: 独立审查后现场重读：19条、最长975词、单索引、无pending或缺失引用、无.indexes；用户3条及原generation保持。62文件快照和2份报告校验通过，当前Self Assessment仍适用。未运行测试套件；不声称旧Pi前台已加载新版或穷尽审计历史外部来源。
