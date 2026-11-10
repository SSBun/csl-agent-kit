# 明确主题记忆片的无序列表正文格式

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-09 11:55) |
| Artifacts | [Artifacts](../artifacts/memory-chip-list-format/) |
| Kind | Plan |

## Target
- [x] T1: 用户级与当前项目的所有有效主题记忆片正文均为 Markdown 无序列表，每项包含有效的 YYYY-MM-DD 更新日期，保留知识及条件
- [x] T2: 写作规范与后台提示采用统一格式，新写入校验日期和列表结构，旧正文、墓碑与历史审计保持可读且不改写
- [x] T3: 经条件写入转换记忆并核对元数据、来源、关系及审计，说明日期回填依据与验证限制

## Decisions

用户已确认无序列表含义并增加每条更新日期要求，现执行用户级与当前项目有效记忆的转换及后续写入约束；不扩张到其他项目。标准条目为 `- [YYYY-MM-DD] 知识及必要条件`，UTC 日历日；旧条目优先使用可核实的条目日期，否则继承转换前 chip 的 updated 日期作为兼容回填，不声称这是精确逐项历史日期。

保留现有 YAML 元数据、稳定 id、来源、revision/hash、关系和派生索引；正文仅由 `- ` 列表项组成，一项表达一个可独立使用的知识点及必要条件。知识类型仍可为事实、偏好、经验或引用，列表形式不将记忆提升为强制指令。历史审计、迁移备份和墓碑不属于待改写的有效记忆。

## Plan

1. 已统一技能、后台提示与普通写入和提案校验，保留旧正文读取、保真导入、墓碑和历史恢复边界。
2. 已通过 revision/hash 条件写入转换用户6片、当前项目19片，并完成正文字符、元数据、关联和审计核对。
3. 基于最终内容完成自检、审查分级及交付；不运行未获本次授权的测试套件。

## Execution Log

### 001 — 当前约束与缺口

读取 agent-memory 技能、Memory Agent 提示及 store.js 的 validateContent/parseEntry。当前已鼓励短句、关键词、并列项，但没有要求统一无序列表。写入层只验证正文为文本及长度，读取层复用内容校验；若直接加入强制列表校验，会影响旧正文和墓碑读取，需要区分新写入约束与历史读取。未修改任何记忆正文或产品源码。

### 002 — 确认日期语义并落实写入边界

用户确认无序列表并要求每项有标准更新日期后，继续执行同一记录。实现只在普通 put、提案创建及批准时校验扁平列表和真实日历日期；parseEntry、保真导入、墓碑和历史恢复不增加新正文约束。规范约定实质更新才改变逐项日期，格式重排不刷新。同步已有测试夹具并增加相关用例，未执行测试。

### 003 — 完成有效库转换与恢复核对

转换用户6片、项目19片，共162项，使用转换前各片 updated 日期回填并注明审计理由。一次保存后核对发现旧缺省 retrieval 被既有 writer 规范化为空集合；未重复提交已完成片，而是从审计确认提交结果，再完成剩余片。最终每片 revision 恰增1，正文去除标题、列表标记、旧模板标签和空白后的字符序列保持一致，来源及关联语义保持。两级索引已发布且无 pending，项目19/20片，无超长正文；转换事务及哈希见[转换证据](../artifacts/memory-chip-list-format/evidence/conversion.json)。

### 004 — 服务与静态验证

后台空闲后通过官方 service restart 重启，新 PID 29287，状态 running、protocol 4、active=[]。4个变更 JavaScript 文件语法检查通过，git diff --check 通过；agent-memory 质量门禁0失败，保留初始上下文约3458 tokens的预算警告。没有运行单元测试、项目套件或真实模型写作评测，不能声称日期语义获得模型行为验证。

## Task Summary

**Memory 运行时**（[目录](../../../bin/memory/)）新增带日期扁平列表的写入校验，更新后台写作提示，保留旧数据读取与历史恢复。

**Memory 规范**（[技能](../../../skills/meta/agent-memory/)、[文档](../../../docs/)）统一逐项日期、实质更新和兼容回填语义。

**有效记忆库**（[项目库](../../memory/)、[用户库](/Users/caishilin/.csl-agent-kit/memory/)）将25个主题文件转换为162项带日期列表，保留索引和审计链。

**Memory 测试材料**（[目录](../../../tests/)）更新普通写入夹具并补充格式拒绝、旧正文恢复与历史提案批准用例。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 复用现有条件写入、审计和索引；仅新增一个正文校验函数与三个调用点，不增加存储模型或依赖。 | 未发现必要范围以外的抽象。 |
| 稳定性 | A | 25次实际写入及审计成功，规范化正文与元数据比较通过；静态检查确认读取和恢复路径不新增正文校验；服务正常运行。 | 未运行新增用例及测试套件；未观察后续真实模型维护。 |
| 完整性 | S | 当前授权两级全部25片、162项均符合格式，规范、提示、写入校验同步，回填依据记录于审计。 | 历史逐项更新时间不可重建；兼容回填已明确标注，不扩展至其他项目。 |

## Result

- T1: 实际读取用户6片和项目19片，共162条有效日期扁平列表；转换前后去除结构标记的知识字符序列一致。转换证据含每片前后hash和事务。
- T2: 技能、后台系统提示及写入工具统一格式；普通put/提案创建/批准增加校验，静态比对确认parseEntry、墓碑、保真导入及恢复路径不增加新正文校验。4个JS语法检查及技能质量门禁通过；新增测试未运行。
- T3: 25片条件提交均审计committed、revision恰增1，来源及关联语义相等；逐项日期继承转换前updated并在reason注明。最终重读全部hash、两级generation与pending无漂移；服务PID29287运行。详见转换证据。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 局部正文输入约束及全量核对的机械格式转换，沿用现有存储、条件提交和可恢复审计，没有改变权限、数据模型或读取解析。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-chip-list-format/evidence/bfb037498ff99dd8be45a3d38ad458f57d7216e82f162d1145b6fa41eb1641f6.json#bfb037498ff99dd8be45a3d38ad458f57d7216e82f162d1145b6fa41eb1641f6
- Evidence: T1-T3及 evidence/conversion.json；用户库为非工作区内容，以证据所列afterHash逐片实读核对。
- Result clarity: 正文固定为带有效日期的无序列表；日期回填和保留语义已确认，无未决格式解释。
- Bounded impact: 一个校验函数覆盖三个新写入口；读取、迁移保真和恢复不调用新校验。转换仅当前两级25片，不包含其他项目或历史重写。
- Low risk: 每片通过原有CAS提交且保留完整before/after审计，可按事务恢复；事实正文比较一致、来源和关联保持，项目数量及字数配额无越限。
- Sufficient verification: 实际25次条件写入及审计核对、全正文规范化比较、元数据比较、最终hash/generation复核、4文件语法与skill-quality及diff检查；未运行测试套件或真实模型评测，语义日期依赖写作规范。
- Task fingerprint: 6feaead577c8c8c415dbf338312d93d76f7b6de5fd7da3c8166b2a31e04299e8

## Verification

- Passed: 收尾前再次实读25片hash及格式与两级index generation，均与转换证据一致、无pending；托管快照冻结46个工作区文件，保留已披露的测试和日期回填限制。
