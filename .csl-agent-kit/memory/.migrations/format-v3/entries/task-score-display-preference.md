---
schema: csl-memory/v1
id: task-score-display-preference
revision: 2
type: preference
title: 任务评分留在记录，回复默认不展示
summary: 项目任务评分默认只保留在任务记录，用户明确要求才展示；重要验证、风险和未完成事项仍说明。正式契约见Task技能。
sources:
  - session:01a19f74-985b-71ed-b277-8ea38b727416/task:task-score-record-only/event:4f3ec2ed35adeedf9b62ed41dcee15da6c4c89fe6d6c7390e26c5556911764b7
  - session:01a19f74-985b-71ed-b277-8ea38b727416/task:task-score-record-only/event:e8c951a87562a78fbf6633adcc2443480a22747db0476cfa3d93d95c8985ac58
  - skills/meta/task/SKILL.md#self-assessment
updated: 2026-11-03T03:50:36.750Z
deleted: false
---

## 项目展示偏好与权威引用
用户提出任务系统不必每次回复附带自评等级，并在后续事件中确认调整。核对 `skills/meta/task/SKILL.md#self-assessment`（第211行）可见：三维等级、证据和局限保留在任务记录；用户回复（含完成交付）默认不展示等级或评分表，用户明确要求时除外；重要验证结果、风险、局限和未完成事项仍需说明。正式细则以该技能为准，不以记忆替代契约。

## 纠正与适用范围
取代此前‘仅确认不必逐次展示、尚无规则修改证据’的描述。仅适用于本项目任务系统，不推广为全局偏好，不取消自评或质量门禁。助手报告已同步 Task、Queue 和注入契约；本次直接核对的是 Task 条款，不将该报告视为模型行为已验证。
