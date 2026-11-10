# Memory 基础文件与 BCP14 案例约束

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-09 20:09) |
| Artifacts | [Artifacts](../artifacts/memory-context-lessons-bcp14/) |
| Kind | Task |

## Scope

在新 Memory 的项目作用域保留 context（项目基础信息）和 lessons（通用经验），仍允许必要专题。所有作用域的案例写作遵循 BCP 14；事实、条件与例外不因关键词规范化而改变。沿用当前文件格式、容量和 hash 写入接口，不恢复旧 Task 存储，不自动升级用户级旧库或其他项目。

## Plan

1. 已统一基础文件、案例强度和维护边界的说明及后台提示。
2. 已将项目定位与验证经验两个专题分别归入 context 和 lessons，保留全部20条case及原日期；其余6个专题不变。
3. 已核对RFC原文、契约一致性、当前文件格式与质量门禁；完成最终内容身份检查后交付。

## Execution Log

### 001 — 目标确认与现状

用户已确认两个基础文件和 BCP 14 案例约束的目标。项目现有 8 个当前格式专题；用户级库仍为旧格式，只读。当前存储接口已支持 context、lessons 文件身份，无需新增类型字段或存储协议。工作区有其他任务的既有修改，本任务只追加相关差异。

### 002 — 基础文件与写作契约落地

agent-memory、后台系统提示、常驻Contract和使用文档已一致定义两个项目基础文件、容量、保留身份及BCP 14语义。关键词不提高权限，事实不强加关键词，保留条件、例外和原有强度；保存前检查目标文件全部case。旧格式库不自动升级，未触及专题不批量改写。

通过现有CLI的hash条件写入，将project-identity归入context、verification-and-change-safety归入lessons；先写入并完整回读目标，再检查当前正文引用并按原hash删除被完整替代的源文件。20条case全部保留，日期不变，45处表达规范化逐项可逆比较通过；其余6个专题hash保持不变。没有创建记忆历史或恢复副本。当前共8个文件、90条case，索引published；context为497词、lessons为839词。

### 003 — 验证与加载

已对照RFC 2119与8174原文核对强制、建议、可选和大写范围；正文事实与约束分开检查。JavaScript语法与定向diff空白检查通过，旧“不设固定分类/no preset topics”冲突表述无命中。Skill Quality：agent-memory与agent-hooks无failure，初载预算warning分别1269和2090估算token；保留必要契约，不为预算删除边界。未运行单元测试或项目测试，也未发起额外模型批次验证语义遵循。

Memory服务在activeCount=0时重启，PID从95867变为80735；重启后running=true、protocol=5、activeCount=0。当前Pi未关闭。服务已重载代码；实际后续模型维护是否遵守全部约定仍需运行观察，不以服务在线冒充行为验证。

## Task Summary

**Memory维护**（[bin/memory](../../../bin/memory/)）：更新后台提示，保留两个基础文件并按BCP 14表达case约束；存储格式、写入算法和服务协议未改动。

**Memory技能与契约**（[agent-memory](../../../skills/meta/agent-memory/)、[agent-hooks](../../../skills/meta/agent-hooks/)）：统一基础文件职责、容量、保留与遗忘边界，以及强度、大小写、事实和权限保护。

**使用文档**（[docs](../../../docs/)）：说明基础文件布局和案例关键词语义，明确结构检查不等于语义核验。

**项目当前记忆**（[memory](../../memory/)）：两个已有专题归入context与lessons并规范约束表述，重建当前索引；保留原case和日期及其他专题。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 复用现有Markdown格式和CLI条件写入；只调整提示、规则和两个既有知识文件身份，无新字段、依赖或存储逻辑。 | 无已知多余机制。 |
| 稳定性 | A | 目标先写入并回读，原hash删除；20条case和日期保留，其他6片hash不变；结构、容量、索引、语法及定向diff检查通过。 | 未运行项目测试或额外模型批次；规则遵循依赖Agent语义判断，非存储强制校验。 |
| 完整性 | S | 两个基础文件已实际存在，技能、后台提示、Contract和文档一致；两级全部case适用写作约定，当前触及文件已规范化。 | 旧格式用户库保持只读；未触及专题按后续保存时检查规则处理，不宣称已全库重写。 |

## Target
- [x] T1: 新 Memory 系统保留 context 和 lessons 两个项目基础文件，分别承载项目基础信息和通用经验
- [x] T2: Memory 案例中的要求与约束使用 RFC 2119 / RFC 8174 的强度语义，明确必须、建议和可选

## Result

- T1: context.md和lessons.md已通过现有CLI条件写入建立，分别含10条原有case且保留日期；原专题完整替代后删除，其余6片hash不变。当前8片90条case、索引published，两基础文件497/839词。技能、后台提示、Contract和文档一致定义职责、容量及保留边界。
- T2: 对照RFC2119/8174原文核对MUST/MUST NOT、SHOULD/SHOULD NOT及MAY语义、大写范围、建议例外及权限边界；20条触及case逐项检查，45处规范表达保留原意及日期。技能质量无失败（预算warning1269/2090），node --check和定向git diff --check通过；后台空闲重启后PID80735在线、protocol5。未运行项目测试或额外模型批次；未触及专题按后续保存时检查，不宣称全库改写。
- Review gate: Skipped — 当前R1的明确结果、限定影响、保真替代及充分直接验证四项依据已记录；无显式或既有独立审查义务。未执行独立审查，不将自检称为独立审批。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 明确的Memory组织和写作提示调整；不改存储、调度、权限或解析逻辑。两个已有知识文件按验证后的完整替代归位，限定词规范化和当前数据已直接核对。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-context-lessons-bcp14/evidence/96240cb12366b751b9af31e66059be086f25fc3032d5eb4de494749f0d8a5b10.json#96240cb12366b751b9af31e66059be086f25fc3032d5eb4de494749f0d8a5b10
- Evidence: 见Result T1/T2与Execution Log 002/003；13文件当前身份已登记。原两个源为未跟踪文件，快照不能登记其删除；CLI回读和当前缺失检查单独确认。
- Result clarity: 用户确认两个项目基础文件及BCP14要求，保留其他专题和事实句；完成条件已逐项直接观察。
- Bounded impact: 仅四个提示/说明载体、两个知识文件归位及索引；直接消费者是已重启Memory Agent和前台技能读取。原格式及接口不变，其他6片hash未变。
- Low risk: 不增加授权、不改变约束强度或遗忘边界；替代文件先完整写入回读，原文件按hash移除，20条case日期及独有内容保留，未做历史清理或跨scope升级。
- Sufficient verification: RFC原文对照、20条case逐项检查、45处表达可逆比对、全部8片格式容量和索引一致性、两个Skill门禁、JS语法和定向diff检查通过；额外模型行为验证及项目测试未运行。
- Task fingerprint: 2e85806c26ded96de96d2f832e4e92a580cb9311a85a92d50c331873c69a2ef8

## Verification

- Passed: 最终check-evidence核对13文件快照一致；重新检查index=published、8文件、context/lessons各10条case、两个被替代源均不存在且容量合规。T1/T2检查与自评仍适用，无内容漂移；未执行单元测试或项目测试，未验证额外模型批次。
