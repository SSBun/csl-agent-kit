# 特殊记忆卡片固定优先排列

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-10 14:24) |
| Artifacts | [Artifacts](../artifacts/memory-special-files-first/) |
| Kind | Task |

## Target
- [x] T1: Memory Dashboard 各项目记忆分组中，context、lessons、temp 特殊文件按此顺序排在普通记忆之前。

## Plan

1. 在记忆卡片展示入口按已有 special 标记固定特殊卡片顺序，保留其他卡片相对顺序。
2. 在实际 Dashboard 核对 Filio 及各项目分组顺序，并执行语法和差异检查。

## Execution Log

### 001 — 确认展示排序入口

用户已确认 context、lessons、temp 优先顺序。接口已有 special 身份标记，当前服务按更新时间排列。仅在 Dashboard 的卡片渲染入口对副本作稳定排序，不修改存储文件、服务端列表顺序或用户级同名文件的身份。

### 002 — 页面核对完成

ego-browser 空间 29 读取实际服务并展开全部分组，对比接口原顺序与页面卡片顺序：13 个项目及用户分组全部匹配预期，普通卡片相对顺序全部保留；Filio 前三项为项目基础信息、通用经验、近期上下文。缺少 context/lessons 的项目仅提升已有 temp。node --check 与限定文件的 git diff --check 通过。验证空间已关闭，无需服务重启。未运行单元测试或项目测试套件。

## Task Summary

**Memory Dashboard**：[/Users/caishilin/Desktop/personal/skills/bin/memory/web](/Users/caishilin/Desktop/personal/skills/bin/memory/web) 的记忆分组卡片按既有身份标记，将 context、lessons、temp 依次置前，普通卡片保留原相对顺序。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 使用原有 special 标记及原生稳定排序，仅增加渲染入口的两行排序。 | 无新增依赖或存储改动。 |
| 稳定性 | A | 实际页面全部 14 个分组顺序核对通过，普通顺序保持；语法及 diff 检查通过。 | 未运行单元测试或项目测试套件；只核对当前服务数据。 |
| 完整性 | S | Filio 及各项目均按已确认顺序展示，缺项只展示已有特殊文件。 | 无已知必要交付缺项。 |

## Result

- T1: 实际浏览器核对 13 个项目及用户分组，特殊卡片依次 context、lessons、temp 置前，所有普通卡片相对顺序保持；Filio 前三项已确认。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 仅改变卡片展示顺序，原始数据不变，实际所有分组均验证。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-special-files-first/evidence/b759206ac71e6c41ca8f4ac35f5670a683cd7093a8361766453892d3e1517ab2.json#b759206ac71e6c41ca8f4ac35f5670a683cd7093a8361766453892d3e1517ab2
- Evidence: Execution Log 002：实际 DOM 与接口数据比较，语法及差异检查通过。
- Result clarity: 用户确认三种特殊文件顺序，实际各分组一致。
- Bounded impact: 仅渲染时排序数组副本，不影响 API、存储和普通卡片相对顺序。
- Low risk: 只读界面顺序变化，可通过刷新恢复，无数据写入风险。
- Sufficient verification: 实际浏览器全部 14 个分组比较通过，缺项及用户分组行为确认；node --check 和 git diff --check 通过，未运行测试套件。
- Task fingerprint: 0d1081f26e44fa71cccd1fcdcee93deb6ee3a02a69ad917eb62ba9431d3e2c64

## Verification

- Passed: 当前文件快照绑定完成；全部实际分组排序通过，验证浏览器空间已关闭。
