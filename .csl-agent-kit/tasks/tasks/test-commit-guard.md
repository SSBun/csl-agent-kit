# 设计并运行提交保护单元测试

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-06 14:08) |
| Artifacts | [Artifacts](../artifacts/test-commit-guard/) |
| Kind | Task |

## Target
- [x] T1: 为 commit-guard 设计并实现覆盖核心行为与失败边界的可重复单元测试
- [x] T2: 运行相关测试，报告实际结果及覆盖限制，处理测试发现的本范围问题

## Scope

仅覆盖现有 commit-guard 契约；不新增推送或密钥扫描，不操作用户仓库提交和真实 hook 设置。用户已明确授权本次运行相关单元测试。

## Plan

1. 沿用 node:test，建立命令解析、临时 Git 暂存内容和运行时接入三层测试。
2. 用测试侧模块隔离模拟 Git 错误、信号及超时，避免生产接口改动及真实等待。
3. 接入 npm 测试入口，运行新套件与相关既有 Hooks 测试；核对失败来源并修复本范围问题。
4. 核对隔离、覆盖和最终证据，按实际改动完成审查分级。

## Execution Log

### 001 — 测试结构

现有仓库使用 CommonJS 与 node:test。commit-guard 暴露 literalWords、checkCommand、inspectIndex 和 main；薄入口保留导出兼容。现有 agent-hooks 测试未覆盖该检查器。新增专用测试文件，临时仓库及 CSL 数据目录隔离，测试侧模拟外部进程失败；保留现有生产算法。

### 002 — 测试结果与既有失败

首轮新增套件76通过、7失败，失败均为拒绝说明文案的测试正则遗漏“独立执行”；修正断言后83项全部通过，无生产算法修改。覆盖率运行结果为行97.24%、分支91.21%、函数91.67%。相关总套件发现6项旧失败；单独原有文件复现同样6项，包含未隔离内置guard的旧夹具、Memory hook不可执行诊断、旧Context契约文案断言。保留日志并披露，不修改无关功能或以跳过掩盖失败。

## Task Summary

**提交保护测试**（[测试目录](../../../tests/)）：新增独立 node:test 套件，覆盖解析、暂存内容、失败阻断及内置 hook 接入；使用临时 Git 仓库、独立配置和测试侧进程模拟。

**npm 测试入口**（[package.json](../../../package.json)）：新增 test:commit-guard，并将专用测试纳入已有 test:agent-hooks；保留其余脚本和既有改动。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 仅新增一个测试文件和两个脚本入口改动，使用现有node:test与标准库，生产接口未改。 | 未引入通用测试框架或额外依赖。 |
| 稳定性 | A | 83项新测试通过，临时配置恢复与文件清理由fixture管理；三宿主及只读index验证通过，语法检查通过。证据见results.json及日志。 | 既有Hooks套件仍有6项独立可复现失败；覆盖为隔离运行时，不证明当前宿主会话已部署。 |
| 完整性 | S | 已完成授权测试设计、实现、运行与结果报告；核心行为和失败路径覆盖，npm入口已接入。 | 无推送、密钥或任意隐藏脚本防绕过测试，因为这些不属于现有能力。覆盖率不等于穷尽所有shell语法。 |

## Result

- T1: 新增 tests/commit-guard.test.js，83项 node:test 用例覆盖 literal argv、拒绝/放行边界、真实临时 Git index、注释前缀与残缺标记、二进制、子目录、冲突、错误/超时模拟、stdin/cwd、三个宿主及失效模块阻断；只使用隔离临时仓库和配置。npm 新增 test:commit-guard，并纳入 test:agent-hooks。生产代码未改。
- T2: 专用套件83/83通过；check-commit.js行97.24%、分支91.21%、函数91.67%。相关组合套件115项中109通过6失败；独立原有agent-hooks套件32项中26通过同样6失败，results.json确认失败名称一致。初次7个失败是新测试文案断言过窄，修正后通过。既有失败未扩范围修复；日志位于artifacts/test-commit-guard/evidence。语法与diff检查通过。
- Review gate: Skipped — R1测试专属改动，四项豁免依据及运行证据已记录，无独立审查义务。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 仅新增测试和npm运行入口，未修改提交保护或权限逻辑。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/test-commit-guard/evidence/7a7090015467a0f1438608e68d07e183d00c4fc030c030dfa0cb82747688e1c3.json#7a7090015467a0f1438608e68d07e183d00c4fc030c030dfa0cb82747688e1c3
- Evidence: T1/T2 Result与evidence/results.json；检查范围仅测试增量，不将既有红色总套件报告为通过。
- Result clarity: 现有保护契约映射到83项可执行测试，结果和现有失败边界明确。
- Bounded impact: 只影响测试运行；临时Git仓库和CSL配置隔离，现有生产代码及原测试文件未改。
- Low risk: 改动不改变提交放行策略，不执行实际提交或推送，测试侧模拟外部故障。
- Sufficient verification: 83项新测试全部通过；相关旧套件的6项失败已独立复现并记录，语法检查和专属差异核对通过。
- Task fingerprint: ed10dda1f7d07dc84ad7de6e78413d626a31a4cae296805d6f87f6e9059c078c

## Verification

- Passed: 最终12文件快照与运行日志一致，T1/T2及Self Assessment仍对应当前内容；新增套件83/83通过，既有6项失败明确保留。无生产代码改动，无真实提交或推送。
