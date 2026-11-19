# 优化技能的场景执行路径与结论证据核验

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-18 17:57) |
| Artifacts | [Artifacts](../artifacts/verify-scenario-execution-evidence/) |
| Kind | Task |

## Target
- [x] T1: 相关规则与技能要求按用户场景核验真实执行路径，识别阻断和替代处理，并按证据限定结论
- [x] T2: 后续实施与审查核对关键事实前提，不将用户确认或历史结论作为实现事实
- [x] T3: 提供覆盖误判反例及简单路径的行为评估场景，明确已执行检查与未验证边界

## Scope

优化共同 Contract、repo-map、tldr、bug-fix、task 与 task-review 的证据核验指引，并补充项目级行为评估材料。保持现有路由、确认和审查分级机制；不修改阅读器业务代码、不要求输出或保存内部思维链、不创建 worktree、不运行单元或项目测试。真实模型行为回放不在本次已执行检查的承诺内。

## Plan

1. 核对共同原则的加载来源与各技能职责，完成有针对性的指引修改。
2. 补充含真实代码片段、反例与简单对照的行为评估材料。
3. 核对差异、资源链接、Hook 输出及技能质量，记录证据和限制后完成交付。

## Execution Log

### 001 — 目标确认与修改范围

用户已确认本会话展示的完整目标。初始工作区另有 Memory 正文及索引改动，属于既有后台内容，不纳入本任务。共同 Contract 的权威来源为 agent-hooks/references/csl-agent-kit-contract.md，读取脚本直接输出该文件。六个技能已有一般证据要求，但未明确限定场景入口与候选实现的区别；repo-map 禁止输出 open questions 的旧表述还需允许必要的入口覆盖限制，避免与不确定性披露冲突。项目评估根为 evals/，现有 Task Target 分类器不适用于执行路径行为评估，因此复用目录约定提供独立材料，不新增执行平台。

### 002 — 指引与评估材料完成

共同 Contract 新增 Execution Evidence；repo-map、tldr、bug-fix、task 与 task-review 增加各自职责内的路径核验要求，Reviewer 固定提示同步，保留现有路由、目标确认、审查分级及权限。repo-map 允许客观覆盖限制。新增 evals/execution-evidence 的10组／20个变体，覆盖旧实现、模式、状态、mock消费者、开关、未知宿主、历史前提、审查旁支、下游覆盖及简单路径，包含文件映射、预期／失败条件、人工判读和回放边界。

逐项核对本任务10份交付文件：未改运行时、安装器或业务代码，未增加自动审查、全仓审计或内部推理记录。确定性检查确认JSON、案例身份、两变体本地import闭合及评估链接有效；现有项目评估布局与Task Target的122个分类fixture验证通过。Contract读取脚本在pi、codex、claude-code环境参数下均输出当前权威正文及模式提示，只证明读取脚本输出，不证明真实适配器、已安装插件缓存或已有会话加载。

六个修改包的skill-quality均无失败；repo-map、tldr、bug-fix通过，agent-hooks与task-review有上下文预算警告，task还有长文件警告（336行）。保留必要指引，不做无关拆分；较长上下文仍可能影响实际遵循，需要未来行为评估。最终repo-map文案修改后重跑该包通过。未运行单元、项目测试或真实模型回放；合成代码未执行，未验证真实业务行为，未发布或刷新已安装宿主。

## Task Summary

**Agent Hooks**：[组件目录](../../../skills/meta/agent-hooks/)中的共同 Contract 增加场景执行路径与结论证据原则。

**Repo Map**：[组件目录](../../../skills/dev/repo-map/)补充实际入口和候选路径区分，允许客观披露覆盖限制。

**TLDR**：[组件目录](../../../skills/dev/tldr/)补充实现状态问题的证据分层与主结论未知披露。

**Bug Fix**：[组件目录](../../../skills/dev/bug-fix/)补充同场景因果追踪、阻断与结果消费核验。

**Task**：[组件目录](../../../skills/meta/task/)补充实施前关键事实复核与包含R0的条件式自查。

**Task Review**：[组件目录](../../../skills/meta/task-review/)及固定Reviewer提示补充独立入口和关键路径核验。

**项目评估**：[组件目录](../../../evals/)登记执行路径评估材料，增加10组含对照变体的合成代码案例及判读说明。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 本任务10份交付文件仅为已有指引的定点补充及评估材料，复用现有Hook读取器、质量检查和Task记录；未引入运行器、依赖或持久化字段。 | 未知真实模型读取成本；简单路径成本由未来回放观察。 |
| 稳定性 | A | 已逐项对照需求与完整差异，核对消费者为现有Contract读取器和技能／Reviewer提示；六包质量无失败，JSON与链接检查通过；未改生命周期、授权或运行时逻辑。 | 上下文篇幅警告保留；提示词实际遵循、适配器和已安装缓存加载未回放，不能承诺消除错误。 |
| 完整性 | A | T1/T2对应共同原则与五个消费技能及固定Reviewer提示；T3交付10组／20变体、判读边界，确定性检查完成。 | 未运行模型回放、单元或项目测试；本次交付是指引和评估材料，不是行为改善实验结论。 |

## Result

- T1: 逐项核对Contract与repo-map、tldr、bug-fix、task、task-review及固定Reviewer提示，覆盖场景入口、状态分支、阻断替代和结果消费；六包skill-quality无失败，篇幅警告见Execution Log 002。
- T2: Task启动与自查以及Reviewer指引明确复核关键前提，用户确认和历史Completed不证明实现事实；对齐与审查分级原机制未改。
- T3: 交付10组20变体的合成源码案例与人工判读说明；JSON、文件映射、import闭合、对照差异、链接及既有评估布局和122条fixture验证通过；未运行模型回放或单元和项目测试。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 本次为边界明确的提示词补充及评估材料，不改运行时、权限或任务门禁；可通过完整差异、加载读取器和确定性结构检查核验本次交付。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/verify-scenario-execution-evidence/evidence/011c5528db7309f03c8d00a87013bbdba824d8d90d962e0f0b26280924e63a6f.json#011c5528db7309f03c8d00a87013bbdba824d8d90d962e0f0b26280924e63a6f
- Evidence: Execution Log 002、Self Assessment及T1-T3；10份交付内容已逐项核对并绑定快照。
- Result clarity: 目标为增加执行路径核验指引和评估场景；不承诺本次真实模型行为改善，用户已确认范围。
- Bounded impact: 直接消费者为现有Contract读取器、五个消费技能与Reviewer固定提示；未改路由、确认、审查状态或可执行逻辑。
- Low risk: 文案与合成案例可逆，无业务代码、数据迁移、授权或外部发布影响；篇幅和实际遵循限制已披露。
- Sufficient verification: 六包质量零失败、案例结构及本地引用检查、三host参数下读取器正文匹配、既有评估验证及完整差异核对支持文档交付；未声称真实适配器或模型验证。
- Task fingerprint: 1f23d3ad5016e4c698329250705886e26c40eb34c1acb283f11a5a2602352402

## Verification

- Passed: 最终重新计算10份交付文件SHA256均匹配快照，git diff --check通过；Self Assessment与最终内容一致，未执行真实模型、单元或项目测试。
