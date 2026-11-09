# 恢复记忆图标直接链接并使用Safari

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-06 16:39) |
| Artifacts | [Artifacts](../artifacts/memory-safari-direct-link/) |
| Kind | Task |

## Target
- [x] T1: macOS默认网页浏览器为Safari。
- [x] T2: 记忆图标直接打开Dashboard链接，使用Safari正常的新标签页行为，不再经过独立窗口中转。

## Scope

将本机默认网页浏览器改为Safari，恢复图标的普通Dashboard超链接。保留🗂️、状态计数、Dashboard与现有授权检查；删除上次添加且已无消费者的独立窗口启动代码。当前Pi会话需要用户执行/reload以替换已缓存的旧链接。

## Execution Log

### 001 — 恢复直接链接

图标现在直接使用service.dashboard返回的地址；删除独立窗口POST分支、静态中转资源映射及三个专用启动文件，更新文档。搜索bin/pi/tests/docs未发现剩余启动器引用；JS语法、TS转译语法诊断及范围diff检查通过。未运行单元或项目测试。

### 002 — Safari默认关联与实际标签页观察

无障碍界面无法可靠操作默认浏览器下拉框，改用macOS LaunchServices接口。设置调用HTTP返回0、HTTPS返回-54；随后独立进程读回HTTP和HTTPS均为com.apple.Safari，因此没有盲目重复设置。通过系统open打开真实Dashboard地址后，Safari窗口保持1个、标签页由6增至7，证明正常外部链接在当前配置下打开新标签。未记录授权URL或浏览器其他页面内容。

后台有其他工作区活动，未中断服务；直接链接本身无需后台新增能力。当前Pi扩展缓存须通过/reload刷新，尚未声称运行中状态栏已经加载新代码。

### 003 — 验证边界

[观察记录](../artifacts/memory-safari-direct-link/evidence/observations.json)保存默认关联、实际标签数量变化及删除文件的存在性核对。三个删除文件原为未跟踪文件，核心snapshot不能直接记录其缺失；现存源码与观察记录纳入快照，父级在完成前另行确认删除状态。系统默认设置同样属于外部状态，需独立读回。

## Task Summary

**Pi记忆入口**：[Pi桥接](../../../pi/lib)恢复直接Dashboard超链接，保留图标与状态计数。

**Memory窗口启动逻辑**：[Memory运行时](../../../bin/memory)移除独立窗口路由、中转页及浏览器自动化启动器。

**Memory说明**：[文档](../../../docs/memory.md)改为系统默认浏览器与正常标签页行为。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 恢复现有直接链接，删除无消费者的专用启动链路，没有新增依赖或兼容层。 | 未发现多余实现。 |
| 稳定性 | A | HTTP/HTTPS读回及真实Safari标签数量观察；JS/TS语法和残留引用检查通过，原授权检查不变。 | 未运行测试套件，未重载当前Pi扩展。 |
| 完整性 | A | 默认浏览器实际变更且新标签行为已观察；链接恢复与专用代码清理完成。 | 用户需/reload使当前会话缓存的图标链接生效；未代替用户执行宿主命令。 |

## Result

- T1: LaunchServices独立读回HTTP与HTTPS均为com.apple.Safari；实际系统open链接由Safari接收。见evidence/observations.json。
- T2: 桥接直接使用dashboard.url，专用中转文件/映射/POST分支已删除且无剩余引用；真实Dashboard外部打开后Safari窗口1→1、标签6→7。当前Pi需/reload加载新链接，未声称已操作运行中状态栏。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 恢复单一标准超链接并删除专用启动分支，系统默认设置已读回且实际标签行为已观察，影响清晰可恢复。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/memory-safari-direct-link/evidence/3cd6789f204d6e584c16a5e414349a9ac1c93b268ace643256cc43d45ec7f173.json#3cd6789f204d6e584c16a5e414349a9ac1c93b268ace643256cc43d45ec7f173
- Evidence: 观察记录、JS/TS语法、范围diff与残留引用核对；三个未跟踪删除文件由父级单独验证缺失。
- Result clarity: 用户明确要求Safari默认及正常新标签直接链接，无未决选择。
- Bounded impact: 只删除独立窗口专用链路，复用既有Dashboard和系统浏览器；授权与记忆数据逻辑未改。
- Low risk: 可逆本机设置及入口简化，未新增命令执行、权限或写入能力。
- Sufficient verification: 默认HTTP/HTTPS读回和真实新标签观察、语法与消费者检查均完成；未运行测试套件，当前Pi待/reload。
- Task fingerprint: 88392bba8a2e9dcc857ec911ff6da31c33408f960e4a7e24368f8409f2a2e805

## Verification

- Passed: 现存文件和观察记录已建立5文件快照；父级再次核对三个启动文件缺失，Safari关联刚独立读回；Self Assessment与上述观察一致。
