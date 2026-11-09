# 展示Memory Agent决策说明与记忆变更

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-06 16:26) |
| Artifacts | [Artifacts](../artifacts/memory-agent-decision-visibility/) |
| Kind | Task |

## Target
- [x] T1: 在Memory处理详情中能查看输入对话、Agent公开的分析摘要及候选记忆的处理理由。
- [x] T2: 能查看新增、更新、合并或删除的具体记忆内容与前后差异，并区分候选内容与实际已提交结果。
- [x] T3: 说明和变更来自真实处理输出与审计；缺失、缓存过期和失败状态明确显示，不编造分析或暴露隐藏思维链。

## Scope

沿用当前批次/工作区详情与两分钟内存过程缓存。输入默认末条，可切换历史；公开回复和提交请求来自真实trace，实际内容以committed审计为准。不增加永久过程日志、不保存隐藏思维链、不改变记忆写入或重试策略。新提示引导未来批次提供简短公开结论和主要依据，不承诺旧批次补写摘要或每次模型必定输出。

## Execution Log

### 001 — 用户确认过程可见性目标

用户确认输入对话、公开分析摘要、候选理由与实际变更串联展示。现有live记录已经区分公开text、工具调用与记忆写入，审计保留before/after及reason；复用这些真实数据，不新增推理采集或永久日志。

### 002 — 展示接入与浏览器验证

批次入口按event ID匹配工作区实时缓存；不同批次不混用。公开说明、候选请求、实际提交分区；候选从memory_apply参数解析并标注不代表成功，失败工具提示可能已有部分提交。effects经审计接口核对committed后展示正文、理由、旧内容和完整对比。缓存过期保留可读取审计，缺失审计可重读，截断候选有明确覆盖提示。异步响应核对详情代际和卡片身份，切换详情不回填旧请求。

隔离Chrome使用真实前端资产与合成只读API数据，观察末条默认、历史切换不被轮询重置、公开说明、候选/实际区分、部分提交后工具失败、跨批次隔离、缓存过期、缺失审计、实时输入和截断提示，全部符合预期；截图及browser-observation.json保留证据。未触发新模型调用、未写真实记忆，未运行单元或项目测试。JS语法和范围diff检查通过。后台有其他工作区活动，尚未为新公开说明提示重启服务；前端静态资源可直接刷新加载，现有公开trace仍可展示。

### 003 — 空闲后加载与服务核对

完成002之后，后台已空闲，重启后新进程PID 3033、协议4。实际服务提供的脚本hash与源码一致，页面包含新分区；activation.json保留观察，002中的待重载事项已解决。未触发新的模型批次，公开摘要的实际质量仍需后续真实批次观察。

## Plan

1. 保留当前只读展示和来源边界，完成独立审查。
2. 核对最终快照、审查报告与页面可用性后完成。

## Task Summary

**Memory Dashboard**：[Web界面](../../../bin/memory/web)将公开说明、候选提交与实际审计分区展示；复用历史选择器，默认末条，保留辅助信息折叠、批次匹配与异步响应隔离。

**Memory Agent**：[后台运行时](../../../bin/memory)增加面向用户的简短结论、依据及决定说明提示，继续排除隐藏推理，不改变缓存、审计、写入或重试协议。

**Memory使用说明**：[文档](../../../docs/memory.md)说明真实输出与审计的区别、历史摘要缺失及缓存失效边界。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用现有trace、审计接口及安全渲染器，未增加持久日志、数据库或新工具。 | 卡片异步读取需维护局部去重和代际状态，用于防止重复请求与错误回填。 |
| 稳定性 | A | 隔离真实浏览器验证主要路径及跨批次、过期、缺失、部分失败和截断边界；只读接口不改写记忆。 | 使用合成API数据，未重跑真实模型批次或测试套件；长期输出质量不由本次UI观察证明。 |
| 完整性 | A | 输入、公开说明、候选理由、提交正文及before/after入口已接通，默认历史末条和折叠保留。 | 旧批次无摘要不补写；未触发真实模型批次，不把提示已加载视为模型必然产生高质量说明。 |

## Result

- T1: 真实前端资产的隔离Chrome观察确认输入默认末条、历史切换保持、公开说明及memory_apply候选理由可读；browser-observation.json全部相关观察为true。未运行真实模型批次，摘要缺失不补写。
- T2: 隔离Chrome确认候选请求不等于提交，committed审计正文与before内容可见，完整前后对比沿用原入口；部分提交后工具错误同时显示，缺失审计不冒充成功。具体观察及截图在本任务evidence目录。
- T3: 核对live.observe仅记录公开text和工具事件；隔离Chrome确认不同批次隔离、过期保留审计、截断提示及读取错误。JS语法与范围diff检查通过；后台空闲重启后实际服务脚本hash与源码一致，见activation.json。未运行单元/项目测试或真实模型批次。
- Review gate: Passed — 独立只读Reviewer e2b6b8ff-7cf1-4dbe-b760-ae6735340b0f无已确认问题或Target阻断；round-01已保存。父级check-evidence确认15文件快照一致；真实模型说明质量仍属已披露观察限制。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 公开输出、候选请求与审计内容多源异步接入，需独立检查跨批次隔离、缺失状态及提交真实性边界。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-agent-decision-visibility/evidence/ace5c4d9210bb52820363499983ec294045b5598485ff047a86be748f6a976e7.json#ace5c4d9210bb52820363499983ec294045b5598485ff047a86be748f6a976e7
- Evidence: Result T1–T3；隔离浏览器观察与截图、实际服务激活记录，已说明无真实模型批次或测试套件。
- Task fingerprint: 869867fc660cbb8b55ee1634de88485173b0540a12eab4385187c673be00c65e

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/memory-agent-decision-visibility/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-agent-decision-visibility/evidence/ace5c4d9210bb52820363499983ec294045b5598485ff047a86be748f6a976e7.json#ace5c4d9210bb52820363499983ec294045b5598485ff047a86be748f6a976e7 | no blocking findings | 70e7c8d5b6a65c5746335558d25e2900db8ccb97b97441a41ec180dd03c12be6 |

## Verification

- Passed: 独立审查后check-evidence确认15文件快照及round-01报告一致；实际后台运行协议4，服务脚本200且hash与源码相同。Result T1–T3和Self Assessment仍适用；未运行单元/项目测试或真实模型批次。
