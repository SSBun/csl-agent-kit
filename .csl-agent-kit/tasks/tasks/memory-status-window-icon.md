# 记忆状态栏使用新图标并打开独立窗口

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-06 15:30) |
| Artifacts | [Artifacts](../artifacts/memory-status-window-icon/) |
| Kind | Task |

## Target
- [x] T1: 记忆状态栏图标改为🗂️，保留运行中、待处理与失败计数。
- [x] T2: 点击记忆图标以独立浏览器窗口打开Memory Dashboard，不要求独立浏览器配置。

## Scope

当前macOS环境，优先使用已安装Chrome，未安装时使用Safari；保持现有浏览器配置、状态计数和服务授权。终端超链接先打开中转页，再经本机授权接口创建窗口；不安装系统URL handler，不保证浏览器自动关闭中转页。其他平台显示明确不支持信息和普通页面入口。

## Plan

1. 更新图标和本机窗口启动链接，保持计数与无链接退化。
2. 通过固定本机Dashboard地址启动独立窗口，验证授权、参数和来源边界。
3. 独立审查并完成最终验证；提示用户重新加载Pi扩展。

## Execution Log

### 001 — 用户选择与执行范围

用户选择独立窗口而非独立profile，并确认图标🗂️。查证Pi普通模式OSC8由终端处理，无法靠普通URL指定新窗口；实现本机中转页和受现有bearer及Host/Origin校验保护的固定目标POST，不改变系统链接关联。

### 002 — 原生窗口创建与验证

最初Chrome启动参数在短观察窗口内未显示新增窗口，随后观察到延迟启动；改为macOS自动化接口创建明确新窗口并设置URL，成功由接口返回，失败或超时不声称打开。URL独立argv传递、脚本应用名固定，拒绝非本机Dashboard地址及外部命令/URL参数。客户端移除地址栏授权片段，保留普通页面入口及明确的失败重试提示。

空闲重启后台加载路由。最终端到端调用新增1个Chrome窗口并关闭该次验证窗口；401无授权、400外部URL输入、403外部Origin均实际观测。直接原生创建另有新增窗口观察；此前打开的Dashboard窗口保留。证据为evidence/endpoint-observation.json及native-window-observation.json。JS/TS语法及范围diff检查通过，未运行测试套件。Safari回退未实际启动；本轮未操作正在运行的Pi前台重载。

## Task Summary

**Pi状态栏**：[Memory接入](../../../pi/lib)统一替换图标为🗂️，将OSC8目标改为授权的窗口启动页，保留计数、颜色及无链接状态。

**本机Dashboard窗口入口**：[Memory服务与Web资源](../../../bin/memory)新增启动页及空POST接口，服务只打开自身地址，macOS自动化创建Chrome或Safari窗口；复用既有授权与来源校验。

**使用说明**：[Memory文档](../../../docs/memory.md)记录中转页、macOS浏览器与权限边界、普通页面入口和重载要求。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用OSC8、本机服务授权和现有样式；一个原生窗口helper，无新依赖、profile或系统handler。 | OSC8需短暂中转页，浏览器可能不允许自动关闭，明确保留手动关闭。 |
| 稳定性 | A | 本机真实新窗口计数增加1；401/400/403边界实际核验，execFile与argv避免拼接URL脚本，固定URL不接受用户命令。 | Safari回退及其他平台未实测；自动化权限可能阻止打开，提供明确错误和普通页面入口；未运行测试套件。 |
| 完整性 | A | 图标各状态均替换，计数和颜色保留；接口已加载并成功创建独立窗口，沿用浏览器配置。 | 当前Pi前台需用户/reload后看到新图标和链接，不声称已替用户重载。 |

## Result

- T1: memory-bridge全部正常/停机/异常状态的图标改为🗂️；原counts聚合、颜色及OSC8能力条件不变；TS语法检查通过。当前前台需/reload。
- T2: 原生macOS自动化实际新增独立Chrome窗口；最终授权POST端到端新增1窗口，拒绝无授权401、外部URL400、外部Origin403。证据见endpoint-observation.json；未创建profile，Safari未实测，中转页手动关闭。
- Review gate: Passed — fresh只读Reviewer 6df2ce16-677c-401f-a3d0-84506ba03c9b检查9文件快照，round-01无确认缺陷或Target阻断风险；退出及报告登记后快照verified。Safari与权限拒绝仅静态检查，Pi前台需reload。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 新增从授权本机Web请求启动原生应用的路径，需要独立审查权限、参数边界与失败行为。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-status-window-icon/evidence/f0da71b68d8ca9eca6980b7398c6642e4c9629f38457ccfbb935cd46ecc7c383.json#f0da71b68d8ca9eca6980b7398c6642e4c9629f38457ccfbb935cd46ecc7c383
- Evidence: Result T1/T2及endpoint-observation/native-window-observation，语法检查通过；无测试套件执行。
- Task fingerprint: 418b38de47c29b97ccdd8895a69d06e0a09fd55cd41f8183015c58ed8bfde233

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/memory-status-window-icon/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/memory-status-window-icon/evidence/f0da71b68d8ca9eca6980b7398c6642e4c9629f38457ccfbb935cd46ecc7c383.json#f0da71b68d8ca9eca6980b7398c6642e4c9629f38457ccfbb935cd46ecc7c383 | no blocking findings | f7285057a347a38981de0a0f4c22efab07b4bd91a6d4fed036730a5aa7d8112b |

## Verification

- Passed: 最终9文件快照与托管审查报告verified；后台running/protocol4，中转页及脚本现场GET均200。既有真实窗口新增1及401/400/403检查仍适用于未变内容，不重复打开窗口。Self Assessment保持适用。未运行测试套件，Safari与权限拒绝未实测，当前Pi前台仍需reload。
