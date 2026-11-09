# 默认执行Memory与目录组合迁移

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-06 15:37) |
| Artifacts | [Artifacts](../artifacts/default-combined-agent-migration/) |
| Kind | Task |

## Target
- [x] T1: 用户明确调用agent-migration且未限定范围时，默认执行Memory系统与.csl-agent-kit目录两类迁移，不停留在盘点或要求重新选择迁移分支
- [x] T2: 显式只读或单分支请求继续优先；组合迁移保留范围、兼容性、冲突处理、备份恢复及分别验收要求
- [x] T3: 同步技能相关流程与触发案例，通过技能质量检查；本次不执行真实数据迁移
- [x] T4: 每次迁移前核对最新可用Memory规范、目标结构与实际安装运行时支持能力，不按过时的固定格式执行

## Scope

本任务只更新迁移技能及包内参考、案例。默认调用执行当前项目两类迁移；明确只读、单分支或其他scope时保留用户限定。不执行当前工作区或用户数据的真实迁移，不更新安装包或重启服务。

## Plan

1. 将裸调用和未限定范围的明确调用定义为组合执行，保留显式例外及任务流程门禁。
2. 增加Memory目标结构预检，对齐当前规范、安装运行时、实际数据和服务，按scope分别验收。
3. 更新参考中的过时结构描述和触发/行为案例，执行质量与结构一致性检查。
4. 独立审查授权及迁移安全边界后最终核对。

## Execution Log

### 001 — 结构预检发现

用户确认组合默认行为，并要求迁移前检查最新Memory系统结构。只读核对docs/memory.md、agent-memory以及bin/memory/{store,migration,cli}.js：当前store版本4，project为单index，user保留cards/topics；迁移参考仍描述v3和通用卡片验收，需要更新。升级备份保留历史v3命名不代表目标版本为v3。

### 002 — 技能行为与结构检查更新

更新默认调用为组合执行，限定范围优先，不重复询问迁移分支。Memory参考新增每次写入前的规范/安装版本/实际状态核对，移除固定v3目标和project必须卡片的错误验收，保留旧恢复材料。新增9项行为案例；质量门禁无警告通过，JSON结构、链接与空白校验通过。未运行真实迁移或模型行为评测。

## Task Summary

**agent-migration**（[技能目录](../../../skills/meta/agent-migration/)）：明确默认组合迁移，增加最新Memory结构与运行时能力预检，修正项目/用户布局验收，补充触发和行为案例。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 只改迁移技能及其参考/案例，复用现有升级器、Task与安全流程，无新运行时或迁移引擎。见task-owned.diff。 | 未触及实际数据或安装配置。 |
| 稳定性 | A | 核对当前Memory实现与规范，保留原备份、冲突、scope、恢复边界；静态质量/案例结构/链接检查通过。 | 未运行真实数据迁移或模型行为评测；规则文本不能保证所有Agent均遵循。 |
| 完整性 | S | T1–T4均落实于入口、前置检查、分支执行/验收和9项案例，quality通过。 | 最新上游版本须执行时从可核实目标资料确认；不能将旧安装帮助当作最新版本证明。 |

## Result

- T1: SKILL默认执行与范围明确：裸调用/未限定明确调用授权当前工作区Memory与目录两分支，必要Task对齐后连续执行就绪项，不只停在盘点或dry-run，不重复选择分支。见task-owned.diff及bare-invocation案例。
- T2: 显式只读、暂停、单分支和scope限定优先；保留原兼容性、冲突决策、写入冻结、备份no-replace、恢复及两类分别验收条款。9案例含preview、memory-only、directory-only、user、conflict和current边界。
- T3: 修改技能、Memory参考和触发案例，新增9项行为案例；skill-quality PASS，JSON案例结构、链接、空白检查通过。未运行单元/项目测试、模型行为评测、真实迁移、软件安装或服务重启。
- T4: 新增每次写入前目标结构预检，按当前规范/安装实现核实store-entry-index及scope布局、锁审计和服务，识别版本滞后与缺失证据并停止受影响项。对照当前store.js、migration.js、cli.js、docs/memory.md，移除旧v3固定目标和project必须cards验收，保留历史恢复目录命名解释。
- Review gate: Passed — 独立Reviewer b359bd64-7a48-419b-aee9-0f11574c2c14 Findings:none；round-01已保存并校验。主会话check-evidence确认15文件快照一致，补足审查的哈希工具限制；无目标阻断问题。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 默认迁移执行授权与数据结构预检涉及数据迁移和范围边界，需要独立核对限定与保护流程。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/default-combined-agent-migration/evidence/9526b3fe041c00e8470da3783c153b1ded9c8698f6846715caf9dc665f953c95.json#9526b3fe041c00e8470da3783c153b1ded9c8698f6846715caf9dc665f953c95
- Evidence: T1–T4 Result，evidence/checks.json、task-owned.diff；已核对当前Memory权威规范及实现。
- Task fingerprint: e5c3054b313f32faca3b633fd1163ff7ceacab6c5787b05d0fcec6b1022b4202

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/default-combined-agent-migration/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/default-combined-agent-migration/evidence/9526b3fe041c00e8470da3783c153b1ded9c8698f6846715caf9dc665f953c95.json#9526b3fe041c00e8470da3783c153b1ded9c8698f6846715caf9dc665f953c95 | no blocking findings | a8623edbd8dda5269f8a9b1a94daa3333b06b7938db4149baccfd32e19ca92b3 |

## Verification

- Passed: 最终快照verified及1份审查报告摘要一致；T1–T4、Self Assessment与当前内容一致。skill-quality PASS、9项案例结构和链接检查证据有效；未执行数据迁移、测试套件或模型行为评测。
