# 拆分行内说明与提交保护职责

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-06 11:54) |
| Artifacts | [Artifacts](../artifacts/split-commit-guard/) |
| Kind | Task |

## Target
- [x] T1: code-inline-review 仅负责指导行内说明的编写、维护与清理，不再承担提交检查或 hook 管理职责
- [x] T2: 现有提交检查逻辑及其内置 hooks 由独立 commit-guard Skill 负责，迁移后保留已有保护行为
- [x] T3: 技能入口、引用和文档反映新的职责边界，不新增推送扫描或其他内容检查规则

## Scope

迁移已有检查能力及文档，保持 code-inline-review 名称。原有推送保护设计另存于 plan-commit-guard，本任务不实现推送检查、不安装原生 Git hooks、不提交或发布。

## Decisions

检查逻辑和保护规范由 commit-guard 拥有；agent-hooks 保留运行时所需的注册文件和薄脚本入口。保留 inner:code-inline-review-commit ID 及入口路径，以继续尊重已有启用／禁用设置。运行时及宿主适配器保持原样。

## Plan

1. 分离两个 Skill 的职责、资源和入口说明。
2. 迁移检查器，保留单一规则实现及兼容的内置 hook 接入。
3. 通过内容比较、语法、质量门禁及隔离的 hook 行为观察验证迁移；不运行单元或项目测试套件。
4. 完成独立审查与最终证据核对。

## Execution Log

### 001 — 职责与接入边界

用户确认本次拆分目标。源码显示内置 hooks 仅由 agent-hooks 集中发现，脚本必须位于其受控 scripts 目录；采用现有跨组件调用模式保留薄入口，不扩大运行时发现范围。现有检查器无相对模块依赖，迁移可保持算法原样，仅导出入口函数供薄适配调用。工作区已有大量无关改动，本任务仅修改目标文件。

### 002 — 迁移与验证完成

检查器及保护规范迁入 commit-guard，agent-hooks 的原路径改为薄入口，保留规则 ID 及失败阻断配置。迁移前基线与 task-owned.diff 区分本任务和此前工作区改动。三个包质量门禁无失败；agent-hooks 的初始上下文估计2090 tokens超过预算，保留必要流程内容并披露。12项隔离运行时观察符合预期，不执行真实提交，不运行单元/项目测试。静态比较证明检查算法未改；缺少新模块时入口非零退出。当前交互会话重载及真实提交未验证。

## Task Summary

**code-inline-review**（[技能目录](../../../skills/dev/code-inline-review/)）：移除提交检查及 hook 管理职责，保留行内说明的生成、维护、清理与相应路由边界。

**commit-guard**（[技能目录](../../../skills/dev/commit-guard/)）：新增独立技能，接收原检查器和保护规范，明确当前只保护审查标记，不扫描推送历史。

**agent-hooks**（[组件目录](../../../skills/meta/agent-hooks/)）：原入口改为调用 commit-guard 的薄适配，保留历史 hook ID、执行权限和配置语义，更新职责文档。

**技能发现与文档**：更新 [Claude 注册](../../../.claude-plugin/plugin.json)、[README](../../../README.md) 和 [Hooks RFC](../../../docs/rfcs/agent-hooks.md)，反映两个独立技能的入口与边界。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 检查逻辑仅移动并导出 main；复用原发现、调度及用户设置，无通用运行时改动。见 task-owned.diff 和 observations.json。 | 薄入口是运行时受控路径所需；未发现额外抽象。 |
| 稳定性 | A | 算法内容比较一致；12项跨宿主观察确认 index/工作区分离、标记阻断、历史设置保留及只读效果；语法和规则校验通过。 | 未执行真实提交或重载当前会话；未运行单元/项目测试。agent-hooks 保留上下文预算警告。 |
| 完整性 | S | T1–T3 所需技能、逻辑、接入、注册、文档及路由均更新，质量门禁无失败。 | 推送和额外内容规则不在本任务范围；不把源码验证当作当前会话部署证明。 |

## Result

- T1: 检查当前 SKILL、路由案例和迁移差异：code-inline-review 保留生成/维护/清理流程，移除提交 hook 状态检查与提交执行指引；保护规范移至 commit-guard。证据：artifacts/split-commit-guard/evidence/task-owned.diff；skill-quality 通过。
- T2: 新检查器与迁移前源码逐字比较，仅新增 main 导出；历史 ID 和薄入口保留。observations.json 记录三宿主共12项运行时观察：干净 index 放行、完整/残缺标记阻断、历史 disabledHooks 生效，文件及 index 不变。两脚本可执行且语法通过；缺少模块时入口返回1，规则仍为 on-error:block。未运行真实提交或重载当前会话。
- T3: README、Claude 显式技能列表、Hooks RFC 和 agent-hooks 指引已同步；Pi/Codex/Cursor 及 npm 使用 skills 目录发现/打包。新增 commit-guard 路由案例，删除旧保护规范路径引用。三个包质量门禁无失败，agent-hooks 保留2090 token预算警告；未运行单元/项目测试。无推送扫描、密钥规则、提交或发布。
- Review gate: Passed — 独立只读 Reviewer b2f583ec-763b-406b-a93b-25898b9dd234 无已证实问题；round-01 已保存并校验。主代理 check-evidence 核对21文件快照一致，旧未跟踪规范路径确已不存在、两个脚本可执行，解除报告中有条件的快照证据缺口；真实宿主重载/提交限制保留。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 提交阻断接入迁移涉及保护规则和跨组件装载，需独立核对职责、兼容与失败路径。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/split-commit-guard/evidence/ac5a314b294f1090ec565ec5afb6a0bb2845f94a4f55656d1055b69f3bfe86d5.json#ac5a314b294f1090ec565ec5afb6a0bb2845f94a4f55656d1055b69f3bfe86d5
- Evidence: T1–T3 Result；evidence/observations.json、static-checks.json 和 task-owned.diff。旧未跟踪保护规范删除不能纳入CLI manifest，原文由baseline.json固定，最终核对其不存在。
- Task fingerprint: c56a0319cafc7bef30ab1ebdce486b5ee7182d7b1b3079645c2755ea5ca6a65b

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/split-commit-guard/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/split-commit-guard/evidence/ac5a314b294f1090ec565ec5afb6a0bb2845f94a4f55656d1055b69f3bfe86d5.json#ac5a314b294f1090ec565ec5afb6a0bb2845f94a4f55656d1055b69f3bfe86d5 | no blocking findings | b6d628a30598a8c0fb351bd57c3d9829eb204985a1308d5628b50f0f97d996b5 |

## Verification

- Passed: 最终 check-evidence：snapshot verified、1份审查报告摘要一致；删除路径与可执行权限核对通过。T1–T3、Self Assessment 与当前内容一致；12项运行时观察、算法比较及质量门禁证据仍适用，无新增变化。未运行测试套件或真实提交，不宣称当前会话已加载新保护。
