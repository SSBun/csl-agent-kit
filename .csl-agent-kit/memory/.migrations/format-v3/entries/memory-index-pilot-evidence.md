---
schema: csl-memory/v1
id: memory-index-pilot-evidence
revision: 2
type: reference
title: Memory索引对照证据与检索质量优先级
summary: 用户强调简洁读取不能遗漏记忆。先导中分页节省token，但不证明质量等价、普遍优势或search-first优劣；报告保留适用边界。
sources:
  - tasks/artifacts/compare-memory-index-strategies/reports/pilot-report.md
  - session:01a19b59-bfc3-7059-9e02-1764335d17d0/task:compare-memory-index-strategies/event:6386edd8b13b8100d07363a1a4c2456219593f7a6ae8563c80b2ca7fefeb1d25
  - session:01a19b59-bfc3-7059-9e02-1764335d17d0/task:compare-memory-index-strategies/event:24b1d40070ab7968030b9c4f5aed8b73c9345738927173d658feed3de98482ce
updated: 2026-11-03T06:54:05.311Z
deleted: false
---

## 设计决策时查阅
权威实验报告：`tasks/artifacts/compare-memory-index-strategies/reports/pilot-report.md`；原始记录、冻结配置及分析在同目录的 `../evidence/`。本条是历史实验摘要，不是产品结构要求。

## 用户明确的设计优先级
用户在事件24b1d400中强调：最重要的是让Agent简洁地读取记忆而不遗漏已记住的数据；若无法有效利用，记忆量再大也无用。适用于本项目Memory检索设计，不推广为全局偏好。不能仅以少读或节省token认定方案成功。用户未指定必须全量加载或某种索引结构。
助手提出优先衡量必要知识召回、关键遗漏和条件保留，并增加后页、无精确关键词、跨文件与新旧冲突题；这些具体指标与下一轮方案仍属建议，不是用户已批准的实施要求。

## 有条件的观察
报告记录36次请求，模型 `openai-codex/gpt-6-astra`、thinking=medium；6类题各一个模板，在50/200/1000个合成记忆文件规模各跑一次，两组各18次。分页为4000字符页面，完整索引保留相同信息；工具、提示、语料一致，新会话，仅提供入口、不注入索引。
两组实际都先read索引。分页总token 295,904，完整索引1,138,743（分页约少74%）；端到端中位耗时分别13.58秒与11.08秒。两组各18/18满足固定答案与来源检查，但不能证明质量等价。50文件时完整索引token略少，不能外推为分页在任何规模都更省。token包含多轮重复上下文与缓存读取，不是唯一正文量。

## 不可外推与复核
题集偏容易、仅六个模板，未覆盖困难语义召回、真实业务资料或生产启动注入；未测试明确search-first策略。结果不足以证明必须分页或应取消分页。模型、提示、语料难度、读取策略或注入方式变化时应重新比较。
统计以 `evidence/analysis.json` 为准：冻结的 `pilot-summary.json` 用上中位值，后续分析修正为偶数样本中间两值均值，报告已披露。费用为SDK目录估价而非账单。报告建议增加难题和search-first对照，这不是用户已批准的后续执行或产品改造决定。
