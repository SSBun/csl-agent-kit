# 为 /fast 添加速度档位选择菜单

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-29 17:20) |
| Artifacts | [Artifacts](../artifacts/fast-command-options-menu) |
| Kind | Task |

## Target
- [x] T1: 在 Pi 中执行不带参数的 /fast 时显示 ultrafast、fast、off 三个选项，选择后应用对应档位。
- [x] T2: 取消菜单不改变当前档位；保留已有带参数命令、配置持久化和倍率展示。

## Plan

1. 使用 Pi 原生选择器替换无参数时的自动 toggle；取消或无 UI 时不修改配置。
2. 菜单结果复用现有命令处理，更新 README，并做严格类型检查和分支差异核对；不运行测试或收费请求。

## Decisions

- 本次在上一个已完成任务留下的未提交插件与 README 上追加修改；原有 Ultrafast 实现不是本任务新增成果。
- 复用现有 ctx.hasUI / ctx.ui.select 模式，不新增 UI 组件或依赖；菜单 fast 映射到原 on 行为。
- Context 无需更新：没有改变组件责任、状态归属或跨组件关系；操作说明直接保存在 README。Context 校验通过，保留既有三个未索引章节警告。

## Task Summary

**Pi 速度扩展**（[pi/extensions](../../../pi/extensions)）：将无参数 `/fast` 从直接 toggle 改为原生三选项菜单，显示当前档位；取消或无 UI 时不修改设置，选中后复用原有档位处理。

**使用说明**（[README.md](../../../README.md)）：补充菜单选项、取消行为及无 UI 边界，保留带参数命令用法。

## Verification Notes

- 严格 TypeScript ESNext/Bundler noEmit 检查、git diff --check 均通过；未运行单元测试或项目测试套件。
- 对照本任务修改前源码与最终命令分支：只有无参数入口和命令描述改变；菜单顺序是 ultrafast、fast、off；fast 映射 on，其余直接使用原动作；取消和无 UI 均在 saveConfig 与内存赋值之前返回。
- 原带参数 on/ultrafast/off/toggle/status 分支、配置读写、请求注入和倍率展示未修改。此次仅增加原生选择器入口，没有新增自动付费行为或改变收费参数。
- 未进行实际 TUI 交互或模型调用；验证边界是类型检查、原生 UI 契约与源码分支核对。

## Result

- T1: 源码核对无参数路径调用ctx.ui.select，选项依次ultrafast/fast/off；fast映射原on，其余进入既有对应档位分支；严格类型检查通过。
- T2: 取消/无UI在保存及赋值前返回；带参数处理、持久化、请求与倍率实现均未修改，README同步；未运行测试或实际TUI。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 本次仅将无参数命令入口替换为原生选择器，所有选择复用已存在的动作；无需新增独立审查。
- Snapshot: snapshot:tasks/artifacts/fast-command-options-menu/evidence/f4dd0544f1a49a83c878ab03377ffda0ed1efbdaed0326e691f7ea786d02cfc4.json#f4dd0544f1a49a83c878ab03377ffda0ed1efbdaed0326e691f7ea786d02cfc4
- Evidence: Verification Notes及T1/T2源码分支核对、Pi select契约、类型检查与diff检查。
- Result clarity: 用户确认三项顺序、选择生效、取消不变且旧命令保留，无未决需求。
- Bounded impact: 新增入口只调用已有on/ultrafast/off分支；源码已核对存储、请求、倍率函数未修改。
- Low risk: 显式菜单选择替代无参数自动toggle，不新增服务档位或计费规则；取消/无UI不写配置，沿用原生选择器。
- Sufficient verification: 严格tsc noEmit通过，原生select返回契约与取消早返回及三个映射逐项核对，git diff --check通过；无运行时测试声明。
- Task fingerprint: 8f27e707da7d889b4ef7d980e6b2a479183a4c28db662c6994e28e613056beee

## Verification

- Passed: 收尾前再次运行严格ESNext/Bundler类型检查及git diff --check通过，当前两文件由managed snapshot绑定；未运行测试、TUI或模型请求。
