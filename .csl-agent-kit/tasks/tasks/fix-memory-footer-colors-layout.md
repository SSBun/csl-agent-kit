# 修复 Memory 数字颜色与底栏提前截断

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-05 15:18) |
| Artifacts | [Artifacts](../artifacts/fix-memory-footer-colors-layout/) |
| Kind | Task |

## Target
- [x] T1: Memory 三个数字分别以清晰的运行中、待处理、失败状态颜色显示，并保留图标Dashboard链接。
- [x] T2: 修复 Pi 底栏提前截断，使 Memory、Task、Git、MCP 在可用宽度内正常显示，窄窗口有合理布局。

## Plan

1. 核对实际加载的底栏实现并复现颜色与截断问题。
2. 使用现有Pi终端排版函数完成最小修复。
3. 用真实自定义底栏函数比较修改前后结果，记录宽窄窗口行为及验证限制。

## Execution Log

### 001 — 目标确认

用户在完整目标展示后回复yes，授权修复三数字颜色、保留Dashboard链接、修复底栏提前截断及窄窗口布局。

### 002 — 根因及修复

实际启用Fast模式时，pi/extensions/openai-codex-fast.ts的updateDisplay通过setFooter替换默认底栏。此前仅验证默认FooterComponent，遗漏此覆盖。其自制visibleWidth仅移除SGR后计算字符串长度，未移除OSC 8链接地址；超过错误计算的宽度后，truncateToWidth移除所有SGR颜色再slice，造成右侧空白、状态过早截断、数字变白。现场截图宽面板有颜色而窄面板无颜色，符合分支触发条件。

改为从@earendil-works/pi-tui导入visibleWidth、truncateToWidth、wrapTextWithAnsi，删除三个自制ANSI辅助函数。扩展状态行使用原生换行函数，真实空间不足时换行而不丢掉Git/MCP。Memory已有数字颜色不需要重复修改，链接及队列逻辑不变。

### 003 — 验证

使用宿主安装的pi-tui及dark主题，提取并执行修改前后源码中完整updateDisplay生成的footer.render；Memory使用实时服务counts和真实Dashboard链接（仅在内存中，不输出令牌），其他状态使用代表性Task、Git、MCP文案。运行中计数1、排队24、失败2。

| 宽度 | 修改前 | 修改后 |
| --- | --- | --- |
| 120 | 无SGR颜色，MCP丢失 | 1行76列，所有状态、颜色和链接保留 |
| 80 | 无SGR颜色，MCP丢失 | 1行76列，所有状态、颜色和链接保留 |
| 40 | 无SGR颜色，MCP丢失 | 2行分别37、38列，所有状态、颜色和链接保留 |

所有新输出均未超宽。node --experimental-strip-types --check pi/extensions/openai-codex-fast.ts与针对该文件git diff --check通过。未运行单元或项目测试套件。首次渲染检查因workspace依赖没有stripTerminalSequences导出失败，改用运行宿主的实际依赖后成功，产品代码只使用既有稳定导出。

已通过agent-desktop只读检查实际当前界面，确认宽窄面板差异；尚未重载后截图。用户需在受影响会话执行/reload加载修复。未自动重启或向其他会话发送命令。

## Task Summary

**Pi Fast自定义底栏**：[/Users/caishilin/Desktop/personal/skills/pi/extensions/openai-codex-fast.ts](/Users/caishilin/Desktop/personal/skills/pi/extensions/openai-codex-fast.ts) 改用Pi原生终端宽度、截断与换行工具，修复OSC 8隐藏链接造成的宽度误算及截断分支丢色，窄窗口保留完整状态信息。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 删除重复实现，单文件复用Pi现有三个工具函数。 | 无新增依赖。 |
| 稳定性 | A | 真实底栏函数三种宽度重放、原生颜色与真实链接保留，语法和差异检查通过。 | 未运行测试套件或实际重载后截图。 |
| 完整性 | A | 同时修复两症状，窄窗口自动换行保留所有状态。 | 已运行会话仍需/reload；极窄列宽遵循Pi工具既有行为。 |

## Result

- T1: 真实自定义底栏重放确认修复后颜色与OSC8链接保留，原先触发截断时颜色被删除；Memory数字沿用accent/warning/error及零值success。
- T2: 同一底栏120及80列显示完整76列状态，40列自动两行37/38列，无超宽且MCP保留；旧版三种宽度均缺失MCP。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 单文件替换自制终端格式辅助函数为Pi既有工具，纯显示调整。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/fix-memory-footer-colors-layout/evidence/13f6f5be5709a2c70d8f63dc2053ac86c48817ab0eff84602b368c5c9a344328.json#13f6f5be5709a2c70d8f63dc2053ac86c48817ab0eff84602b368c5c9a344328
- Evidence: Execution Log 002-003记录根因、真实底栏函数渲染及宽度比较。
- Result clarity: 用户确认颜色、保留链接、底栏完整显示与窄窗口布局目标。
- Bounded impact: Fast模式自定义底栏格式处理，删除错误宽度及剥色函数；Memory队列与模型请求逻辑不变。
- Low risk: 只读显示，原生工具已有API；不增加服务、权限或存储写入。
- Sufficient verification: 实际源码footer.render修改前后比较，实时Memory数据和链接，120/80/40列均保留颜色、链接和MCP且无超宽；语法及diff检查通过。
- Task fingerprint: 55efd1c8a0e31d04411f517768ad491b984b5edc460a381a3b78663de0f0809d

## Verification

- Passed: 单文件2增15删，绑定当前快照；已知根因被替换消除，三种宽度结果符合目标。未跑测试套件，未截图验证/reload后界面；受影响会话需/reload。
