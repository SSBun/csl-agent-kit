# 统一 CSL Agent Kit 存储规范并新增迁移技能

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-03 16:05) |
| Artifacts | [Artifacts](../artifacts/unify-kit-storage-specs/) |
| Kind | Task |

## Scope

本次为规范与技能先行：统一 Kit 所属持久数据目标布局，新增 agent-migration 并登记宿主技能清单。不改运行时路径解析，不迁移 MyTwitter 或当前仓库旧数据，不移动源码、随包资源或宿主入口。保留既有未提交改动及其他活动任务。文档明确未适配读写方时继续现有 CLI，不双写。

## Plan

1. 已更新统一存储规范及 Task、Topic、归档、SOP、Rules、Hooks 和产物消费者。
2. 已新增迁移技能与触发示例、Claude 注册；完成静态质量检查及路径一致性核对。
3. 冻结交付文件，执行 R2 独立只读审查，处理证实问题并最终复核。

## Execution Log

### 001 — 目标确认与工作区边界

用户确认先更新相关技能和规范、提供迁移技能，不执行旧项目迁移。工作区存在大量既有未提交修改及其他活动任务，已保留。现行任务核心仍使用 tasks/，本任务按旧运行时存储，避免人为创建第二份权威记录。

### 002 — 目标布局与迁移门禁

新增随 agent-migration 分发的统一存储契约，文档页只做导航；修改相关路径消费者及项目规则。新规范明确运行时未切换、禁止双写、旧项目显式迁移，并保留 Memory 自身格式升级边界。迁移技能覆盖所属权、冲突、暂停写入、no-replace 发布、活动任务交接、不可变证据、验证和回滚。

### 003 — 静态验证

14 个修改的 Skill package 已运行质量门禁，零失败；现有长技能出现上下文预算警告，保留必要协议，不以删规则消除警告。新增迁移技能通过。Claude manifest 解析及所有已注册技能路径检查通过，新增技能仅登记一次；git diff --check 通过。未运行单元测试或项目测试，未执行真实迁移。新增触发示例后的 agent-migration 与 task-maintenance 已再次通过质量门禁（后者保留预算警告）。链接检查最初误将 Task 的占位示例当真实文件，缩小为本次新增规范导航与技能引用后全部通过；活动 Skill Markdown 的旧 SOP/Rules/Hooks 路径仅存于迁移输入说明。

## Task Summary

**迁移与统一存储契约**：[/Users/caishilin/Desktop/personal/skills/skills/meta/agent-migration](file:///Users/caishilin/Desktop/personal/skills/skills/meta/agent-migration)，新增迁移 Skill、统一路径及过渡规范、触发示例，明确安全迁移和不兼容阻断条件。

**工作流技能**：[/Users/caishilin/Desktop/personal/skills/skills/meta](file:///Users/caishilin/Desktop/personal/skills/skills/meta)，更新 Task 家族、Topic、Archive、SOP、Rules、Hooks 的目标路径、存储门禁与迁移路由。

**开发产物消费者**：[/Users/caishilin/Desktop/personal/skills/skills/dev](file:///Users/caishilin/Desktop/personal/skills/skills/dev)，更新 brainstorming、deliberate、adversarial-review 的产物目标路径并继承 owning Task 的实际数据根。

**项目文档与入口**：[/Users/caishilin/Desktop/personal/skills/docs](file:///Users/caishilin/Desktop/personal/skills/docs)，增加存储导航、同步 Hooks RFC；同时更新根 README、PRINCIPLE、AGENTS 和 Claude 技能注册，不改变运行时解析或迁移任何旧项目。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 单一权威存储契约随迁移包分发，文档仅导航；沿用现有技能与 Task 生命周期，没有新增迁移运行时或双写机制。 | 不声称提供自动迁移 CLI；流程依赖实际宿主能力。 |
| 稳定性 | A | 14 包质量门禁零失败、注册检查与路径引用检查通过；迁移流程明确冲突不覆盖、不可变证据、no-replace、活动任务交接及回滚门禁。 | 本次不执行真实迁移或测试；旧运行时仍需后续适配。长技能的上下文预算警告保留，静态检查不能证明 Agent 行为。 |
| 完整性 | A | 目标路径覆盖 Task/Topic/归档/SOP/Rules/Hooks/Memory 与恢复材料；相关消费者与文档同步，新 Skill 已登记。 | 仅完成已确认的规范先行范围；不包含运行时路径切换或旧项目迁移，须独立交付。 |

## Target
- [x] T1: 所有相关 Task、Skill 和规范文件统一规定 CSL Agent Kit 管理数据归属 .csl-agent-kit，明确项目级与用户级边界。
- [x] T2: 提供 agent-migration Skill，指导旧项目将全部 Kit 所属历史数据安全迁入新目录，保留无关内容。
- [x] T3: 本次不执行旧项目数据迁移；变更通过适用的 Skill 质量与一致性检查。

## Result

- T1: 已核对统一存储契约及相关 Task/Topic/Archive/SOP/Rules/Hooks 和开发产物消费者的目标路径；活动 Skill Markdown 旧 SOP/Rules/Hooks 路径只保留为迁移输入；新规范引用全部可解析，README/PRINCIPLE/AGENTS/RFC 同步明确过渡期。
- T2: agent-migration Skill、随包权威存储契约和触发示例已创建；逐项检查所属权、运行时就绪、冲突、备份、no-replace、引用/证据、活动任务交接与恢复门禁；Claude manifest 注册一次且路径存在。仅文档流程，未实测迁移。
- T3: 14 个修改包的 skill-quality 零失败；新增迁移包及最新维护包复检通过；JSON manifest 和新引用检查、git diff --check 通过。只更新文档/技能/注册，未执行旧项目迁移、未运行单元测试或项目测试；长技能预算警告已评估保留。
- Review gate: Passed — 独立只读 fresh Reviewer cb218780-6837-432a-855b-842094bdedb8 无问题；round-01 已持久化。主 Agent 复核 check-evidence：26 文件快照一致、报告摘要通过，补齐 Reviewer 无法自行计算摘要的工具限制。实际迁移未验证属明确排除范围。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 跨技能存储契约和旧项目数据迁移指令影响多类读写方及数据安全，不能按纯文案低风险豁免。
- Snapshot: snapshot:tasks/artifacts/unify-kit-storage-specs/evidence/63282ec0babebcd4e4bbe5bca9bc871a679629b2bf2e757d39ace5f345dce97b.json#63282ec0babebcd4e4bbe5bca9bc871a679629b2bf2e757d39ace5f345dce97b
- Evidence: Result T1-T3 与 Execution Log 003：规范路径、迁移边界、14 包质量检查、注册和链接检查；未运行测试或真实迁移。
- Task fingerprint: 8fb9084faf56dd17e4916f9dea4b62ffb8d6a423f0f195a1b8b43dae99daa821

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/unify-kit-storage-specs/reviews/round-01.md) | snapshot:tasks/artifacts/unify-kit-storage-specs/evidence/63282ec0babebcd4e4bbe5bca9bc871a679629b2bf2e757d39ace5f345dce97b.json#63282ec0babebcd4e4bbe5bca9bc871a679629b2bf2e757d39ace5f345dce97b | no blocking findings | 5e0ec06cd161d13690489ffb20b670bb0f1efc22f44d165664336ce126ee70a5 |

## Verification

- Passed: 最终 check-evidence 验证26文件快照及round-01报告均一致；git diff --check通过。原静态质量和路径/注册证据仍绑定相同内容，自评结论无变化。独立审查无问题；未运行测试、未执行迁移或运行时切换。
