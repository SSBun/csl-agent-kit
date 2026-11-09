# 扩展 agent-migration 支持目录迁移与 Memory 升级

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-03 18:06) |
| Artifacts | [Artifacts](../artifacts/extend-agent-migration-memory-support) |
| Kind | Task |

## Scope

用户确认扩展技能同时支持目录路径迁移和Memory系统迁移。本次只修改agent-migration技能规范、必要引用及触发示例；不实现新引擎，不配置启动Hook，不执行真实数据迁移、服务控制、模型调用或测试套件。

## Plan

1. 核对现有Memory升级接口及安全边界。
2. 增加双分支协调与Memory专属流程，保持目录迁移保护。
3. 运行技能质量门、自检，并独立复核可能影响数据迁移的指令。

## Execution Log

### 001 — 接口核实与分支实现

用户在完整Target后明确yes。对照现有cli.js、migration.js、store.js及CLI help，确认upgrade --dry-run/upgrade显式scope、current不重扫残留旧源、v2转换、独立内部备份、共享服务门禁、recover/reindex边界。未运行任何真实upgrade或服务控制。

主Skill增加目录/Memory/组合分流，目录九步安全流程保留；新增Memory参考文档以既有CLI协调导入/转换/恢复，区分版本与索引健康、保留源与备份、禁止隐式用户级升级和自动模型重试。组合路径避免先搬走导入源，但路径绑定不支持时仍停止。统一存储规范说明Memory内部恢复材料例外，触发示例覆盖显式Memory升级、恢复和只读组合检查，排除普通自动维护。

### 002 — 自检与验证

逐项核对T1双分支/组合边界、T2保真/授权/旧writer/恢复/完整Pi重启、T3链接/触发用例。node skills/meta/skill-quality/scripts/check.js skills/meta/agent-migration --no-color结果1 passed、0 warning、0 failed；git diff --check通过，CLI help与所写命令一致。静态门不证明实际迁移安全，未执行测试套件或新模型/迁移实验。因迁移流程影响真实数据操作，按R2进行fresh只读独立审查。

## Task Summary

**迁移技能**：[agent-migration](../../../skills/meta/agent-migration)增加目录与Memory迁移协调入口、Memory专属流程，更新存储说明及路由示例；没有修改运行时。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | A | 复用现有升级器，Memory细节分离到引用，目录流程保留，无新引擎或Hook。 | 协调层仍需执行者核对安装版本。 |
| 稳定性 | A | 对照实际CLI/实现，保留授权、备份、锁、恢复和不覆盖边界，质量门通过。 | 本次是规范修改，未执行真实迁移或故障场景。 |
| 完整性 | A | 双分支、组合依赖、引用和触发示例均覆盖用户确认范围。 | 不包含自动检测或运行时新增能力，独立复审另行完成。 |

## Target
- [x] T1: agent-migration 同时覆盖统一目录路径迁移和新版 Memory 系统迁移，明确识别、分流及组合执行边界。
- [x] T2: Memory 迁移复用现有升级机制并保留知识、审计和恢复能力；目录迁移继续受运行时兼容性与冲突保护约束。
- [x] T3: 同步必要引用及触发示例，完成技能质量检查；本次不执行真实数据迁移。

## Result

- T1: 主Skill明确目录、Memory和组合分流；组合先判断导入源和路径绑定依赖，不机械移动旧源或混用完成标记。
- T2: Memory参考流程对照当前CLI/实现，复用upgrade/recover，区分current与索引健康，保留旧源、审计、备份、scope/服务授权和Pi完整重启要求；原目录安全九步保留。
- T3: 存储规范与触发示例已同步；技能质量1 passed/0 warning/0 failed、diff检查通过，命令经help和源码核实。本次没有真实迁移、运行测试套件或配置自动检测。
- Review gate: Passed — fresh只读Reviewer覆盖四个冻结文件，Findings none，无Target阻断风险；owner再次核对快照verified。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 技能指令涉及数据迁移授权、旧源保真及恢复，错误可能导致实际数据损失，需独立复核。
- Snapshot: snapshot:tasks/artifacts/extend-agent-migration-memory-support/evidence/93e58bb5a72d21c3dccdf80dfa3207d508dda7f40da00dd3ed21de46bd52ecf4.json#93e58bb5a72d21c3dccdf80dfa3207d508dda7f40da00dd3ed21de46bd52ecf4
- Evidence: 逐Target Result及Log002，质量门0警告0失败、CLI help/源码对照、diff检查；只改规范，不作运行迁移承诺。
- Task fingerprint: b9f826c6454c2254b9ec4f8218a34b3fe4902f3bf49475338b0dfe84f2347d11

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/extend-agent-migration-memory-support/reviews/round-01.md) | snapshot:tasks/artifacts/extend-agent-migration-memory-support/evidence/93e58bb5a72d21c3dccdf80dfa3207d508dda7f40da00dd3ed21de46bd52ecf4.json#93e58bb5a72d21c3dccdf80dfa3207d508dda7f40da00dd3ed21de46bd52ecf4 | no blocking findings | 59c1ace6e472b4c973c2e273a5efa982b2480aa793d85d08b8b3c2e0a4f6b4aa |

## Verification

- Passed: 审查后单包质量门再次1 passed/0 warning/0 failed，git diff --check通过，四文件快照verified无漂移；T1-T3与自评保持成立。未执行真实迁移、测试套件、模型实验或配置自动检测。
