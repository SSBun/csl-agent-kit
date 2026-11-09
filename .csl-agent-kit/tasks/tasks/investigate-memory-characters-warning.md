# 调查 Memory 索引 store.characters 警告

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-03 11:32) |
| Kind | Task |

## Target
- [x] T1: 说明截图警告的代码原因、影响、处理建议及证据限制，不修改实现

## Scope

只调查截图警告，不修改实现、不重启用户进程、不运行单元测试。

## Execution Log

### 001 — 调用接口与磁盘实现核对

警告来自 pi/lib/memory-bridge.ts:78；before_agent_start 在第72行调用 store.characters(index)。模块在第9行经 createRequire 顶层加载。当前 bin/memory/store.js:14 定义 characters，第458行导出该函数。新 Node 进程直接 require 并读取两级首页成功：用户156字符、项目3493字符，均低于4000预算。当前 Pi 设置包含本仓库包路径。

已确认报错时的 store.characters 不是可调用函数，属于运行时接口不一致，不是超预算错误。旧进程 CommonJS 缓存为首要假设，加载其他副本亦需在报错进程内排查；未取得原进程导出对象，不能宣称缓存根因已经证实。

异常被捕获，该次 before_agent_start 不返回追加 Memory 索引的 systemPrompt，主任务继续。此异常路径不写记忆，也不能据此判定后台服务异常或数据丢失。建议保存会话后完全退出并重新启动 Pi，再观察；如仍报错，应采集实际解析路径、typeof store.characters、导出键及缓存条目，而非删除记忆或放宽预算。未执行重启，未运行测试。

## Task Summary

未修改代码或组件，仅完成警告调查和任务记录。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 直接核对警告调用、模块导出和只读运行结果，无实现改动。 | 无已知多余变更。 |
| 稳定性 | A | 明确区分接口错误、预算错误及缓存假设；确认异常捕获不写记忆。 | 未观察报错进程内模块对象，未验证重启效果；不将推测作为确定根因。 |
| 完整性 | S | 已说明原因层级、影响、建议和证据边界，符合只调查范围。 | 本任务不包含修复或原会话恢复验证。 |

## Result

- T1: 核对 memory-bridge.ts:9,65-79 与 store.js:14,458；新进程 characters=function，用户/项目首页156/3493字符，预算4000。异常仅跳过本轮 Memory 索引注入；缓存或加载副本差异待原进程确认，建议完整重启后复查，不修改实现。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R0
- State: Current
- Reason: 只读调查，无交付实现变更
- Snapshot: no-file:warning-analysis; memory-bridge.ts:9,65-79; store.js:14,458; fresh-node-export-and-index-observation
- Evidence: 执行日志001与T1；新进程只读调用成功，缓存原因明确标记为假设
- Task fingerprint: 2b861f0772acdb4f51765fbec40fa5201c25251787bb85970b110722f8b0e8ae

## Verification

- Passed: 再次直接require确认characters为function，两级首页156/3493且预算4000；核对结论未将缓存猜测写为确定事实，自评不变，未运行测试。
