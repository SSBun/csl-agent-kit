# 在 Pi 底部状态栏显示 Task 模式

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-14 15:46) |
| Artifacts | [Artifacts](../artifacts/pi-task-mode-status/) |
| Kind | Task |

## Target
- [x] T1: Pi 底部状态栏显示当前会话实际生效的 Task 模式及来源。
- [x] T2: 模式切换、会话恢复或重载后显示正确状态，配置异常时不误报SOLO。
- [x] T3: 不改写用户模式配置，不影响已有状态栏信息和Task确认行为。

## Decisions

- 用户已确认展示模式及来源的方案；使用原生 setStatus 独立键，不替换 footer。
- 状态反映当前会话配置解析结果，不证明某一进行中的模型请求已重新注入规则；配置仍按现有每轮注入边界生效。
- 无后台轮询；命令／面板修改后立即刷新，session_start、session_tree、before_agent_start、agent_end 刷新，session_shutdown 清理本扩展键。其他进程更改在下一刷新事件显示。
- 非 TUI 不写状态；配置异常回退展示 CONFIRM · config error，不触碰真实模式设置。不运行测试套件。

## Plan

1. 在设置扩展中使用共享解析器渲染独立状态项，并接入现有生命周期和设置入口。
2. 补充状态、异常、清理和非TUI回归源码，更新使用说明。
3. 完成允许的检查、风险分类和最终验证。

## Task Summary

**Pi 通用设置扩展**（[Pi 集成](../../pi/)）：使用 setStatus 独立键显示当前会话解析模式和来源，接入命令／面板、会话与Agent边界刷新及退出清理；只读解析，非TUI不显示，配置错误不会保留SOLO。

**回归源码与说明**（[测试目录](../../tests/)、[README](../../README.md)）：增加生命周期、优先级来源、异常恢复、不影响其他键及非TUI场景断言，并说明刷新和自定义footer边界；测试未运行。

## 自检

- 已对照 Pi 官方 status-line 示例、setStatus API 和当前已安装 footer 实现：setStatus 仅更新指定键并请求渲染；默认footer合并各扩展状态并按终端宽度截断。未调用setFooter。
- 新增 updateTaskModeStatus 在TUI门后使用当前cwd和真实session ID解析配置；成功生成 Task: MODE · source，异常明确生成 CONFIRM · config error。函数不调用任何保存入口，shutdown仅删除本键。
- 命令和面板修改后使用finally刷新；session_start、session_tree、before_agent_start、agent_end均重新解析，没有timer或持久UI缓存。
- TypeScript strip-types语法检查、测试源码语法检查、模块直接import、Context validate和git diff --check均通过。Node仅提示项目原有MODULE_TYPELESS_PACKAGE_JSON。
- 未运行单元／项目测试，未在用户当前TUI实际重载或截屏。新增行为是原生状态API的只读显示，不改变配置存储、模式语义、Hook规则注入或现有审查流程。自定义footer可能不显示扩展状态，已在README说明。

## Result

- T1: 实现独立setStatus键，current cwd＋真实session ID解析后显示MODE/source；已核对SDK和默认footer实际实现，语法及模块加载检查通过。未实测当前TUI。
- T2: 命令／面板finally和session_start/tree、before_agent_start、agent_end刷新，异常显示CONFIRM config error，shutdown清本键；回归源码已补充，未执行测试。
- T3: 新增函数只有resolve和setStatus，没有保存模式或修改确认逻辑；未setFooter，宿主按独立键合并状态。Context验证和diff检查通过。
- Review gate: Skipped — R1四项依据成立；只读状态显示无显式或既有独立审查义务，保留最终验证。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 局部只读状态显示，复用已验证配置解析器和原生setStatus；无配置／授权策略变更。
- Snapshot: sha256:0d1ff3df3bbfd3c5c1e54270590fd57ac2c792f01fa2e3b5e4f1fa22c8a946af; tasks/artifacts/pi-task-mode-status/evidence/snapshot.json
- Evidence: 任务自检节、语法/import/Context/diff检查及SDK/默认footer源码核对；未跑测试或实测TUI。
- Result clarity: 文本确定为Task:MODE/source；异常明确CONFIRM config error，目标无待决项。
- Bounded impact: 新增单一只读函数和固定生命周期/设置入口调用；独立状态键，未替换footer，无timer。
- Low risk: 失败只影响显示，配置和确认执行策略未改变，退出仅清本键且非TUI不写状态。
- Sufficient verification: 源码逐分支核对、宿主setStatus与footer实现查证、语法/模块加载/Context/diff检查充分覆盖该简单显示接入；真实TUI与未执行回归已披露。
- Task fingerprint: 4bae3e2209cea547db0cb3119b73259be993d1ddc83fc2768ad0203c0419d4ac

## Verification

- Passed: 最终语法/Context/diff检查通过，4/4内容身份一致；默认footer独立状态API已核对。未运行测试和实际TUI，文档披露自定义footer与刷新边界。
