# Adversarial Review: 分析 code-review-graph 的 Tree-sitter 实现

## Overall conclusion

- Result: READY
- Core conclusion: 报告准确解释了 Tree-sitter 的职责边界、文件级增量机制、知识图生命周期和两条 review tool 调用链。
- Remaining risk: none

## Topics reviewed

- Tree-sitter 的通用定义与该项目中的实际职责边界
- 全量构建、文件级增量更新和 review context 的源码调用链
- 功能模块划分、失败出口、状态变化和源码证据
- Mermaid 语法与交付契约

## Debate results

### R1 — 分离两条 review tool 调用链

- Reviewer position: 报告把 `get_review_context` 与 `detect_changes_func` 的行为合并成一条流程。
- Violated criterion: 必须从真实入口准确追踪 review context 流程。
- Evidence: `get_review_context` 直接计算 impact/snippets/guidance；diff range、risk、affected flow 属于 `detect_changes_func` → `analyze_changes`。
- Risk: 读者会误以为 `get_review_context` 提供行级映射、风险评分和 affected-flow 分析。
- Required outcome: 分开说明两个入口及各自产物。
- Suggested remedy: 把文本流程分叉，不增加第二张 Mermaid。
- Editor response: ACCEPT；已把单一 review 流程改为 `get_review_context` 与 `detect_changes_func` 两条分支，并分别说明产物。
- Editor audit: Current Adequacy：原文确有行为合并；Minimal Resolution：只改模块语义与核心流程文本；Blast Radius：报告第 3 条流程，不增 Mermaid 或模块；Proportionality：直接修正文档，无额外结构。
- Debate conclusion: ACCEPTED_AND_FIXED
- Final impact: 报告不再声称 `get_review_context` 执行 diff-range/risk/affected-flow 分析。
- Status: RESOLVED

### R2 — 修正 qualified name 格式

- Reviewer position: 报告写成 `file_path::parent::name`，与实现不符。
- Violated criterion: 关键实现事实必须准确并由源码锚点支持。
- Evidence: File 为 `file_path`；顶层实体为 `file_path::name`；嵌套实体为 `file_path::parent.name`。
- Risk: 读者会构造无法命中的查询键并误解节点身份。
- Required outcome: 准确描述三种形式。
- Suggested remedy: 直接替换格式说明。
- Editor response: ACCEPT；已改为 File=`file_path`、顶层实体=`file_path::name`、嵌套实体=`file_path::parent.name`。
- Editor audit: Current Adequacy：原格式与 `_make_qualified` 不符；Minimal Resolution：替换一条 invariant；Blast Radius：单行事实；Proportionality：完全对应实现分支。
- Debate conclusion: ACCEPTED_AND_FIXED
- Final impact: qualified name 规则与源码三分支一致。
- Status: RESOLVED

### R3 — 替换不存在的测试锚点

- Reviewer position: `TestCustomLanguageParsing`、`TestFlowTracing`、`TestAnalyzeChanges`、`TestReviewContext` 不存在。
- Violated criterion: 测试锚点必须存在且准确。
- Evidence: 对应实际类为 `TestParserIntegration`、`TestFlows`、`TestChanges`、`TestGraphPathResolution`。
- Risk: 验证路径不可复查，削弱证据链。
- Required outcome: 所有测试锚点指向现存类或具体函数。
- Suggested remedy: 替换为实际类与具体测试方法。
- Editor response: ACCEPT；四处均替换为存在的类和具体测试方法，并用 `rg` 逐项核对。
- Editor audit: Current Adequacy：原锚点不可导航；Minimal Resolution：只替换无效 anchor；Blast Radius：模块表 Tests 列；Proportionality：未扩展测试清单。
- Debate conclusion: ACCEPTED_AND_FIXED
- Final impact: 测试锚点落到 `TestParserIntegration`、`TestFlows`、`TestChanges`、`TestGraphPathResolution` 的具体方法。
- Status: RESOLVED

### R4 — 统一 CST/syntax tree 术语

- Reviewer position: 模块表中的 `AST walk` 与 Tree-sitter 的具体语法树数据模型不一致。
- Violated criterion: 不得混淆 Tree-sitter 的 CST/syntax tree 与 AST。
- Evidence: 实际遍历 `parser.parse(source)` 返回 tree 的 `root_node/children`。
- Risk: 读者会误以为 Tree-sitter 已做 AST 归约或语义抽象。
- Required outcome: 统一使用 syntax tree/CST traversal，并在必要时说明源码的 AST 是宽松称呼。
- Suggested remedy: 将 `AST walk` 改为 `syntax tree/CST walk`。
- Editor response: ACCEPT；已把唯一残留的 `AST walk` 改为 `syntax tree/CST walk`。
- Editor audit: Current Adequacy：术语表正确但模块表不一致；Minimal Resolution：替换一个短语；Blast Radius：单个表格单元格；Proportionality：保留源码符号名，不新增解释层。
- Debate conclusion: ACCEPTED_AND_FIXED
- Final impact: 报告统一使用 syntax tree/CST 语义。
- Status: RESOLVED

### R5 — 保留 impact backend 分派层

- Reviewer position: 新文本把 `get_review_context` 写成直接调用 SQL 实现，隐藏了 `get_impact_radius` 分派层及可选 NetworkX 后端。
- Violated criterion: 必须从真实入口准确追踪 review context。
- Evidence: `get_review_context` 调用 `GraphStore.get_impact_radius`；后者默认委托 SQL，但可由 `CRG_BFS_ENGINE=networkx` 切换。
- Risk: 读者会错误理解真实调用关系和执行后端。
- Required outcome: 写成调用 `get_impact_radius`，注明默认 SQL、可配置 NetworkX。
- Suggested remedy: 修改调用关系和证据锚点。
- Editor response: ACCEPT；改为 `get_review_context` 调用 `get_impact_radius`，并说明默认 SQL、`CRG_BFS_ENGINE=networkx` 时切换后端。
- Editor audit: Current Adequacy：原文把默认实现写成直接调用；Minimal Resolution：替换一段调用说明并增加分派锚点；Blast Radius：review flow 第 2 步；Proportionality：只呈现真实分派，不扩展后端细节。
- Debate conclusion: ACCEPTED_AND_FIXED
- Final impact: 报告保留真实分派层及默认 SQL、可选 NetworkX 的后端边界。
- Status: RESOLVED

### R6 — 补全 detect_changes 的源码读取

- Reviewer position: 新文本声称只有 `get_review_context` 会读取源码，但 `detect_changes_func(include_source=True)` 也会附加 changed-function source。
- Violated criterion: 两条调用链的职责与源码读取行为必须准确。
- Evidence: `detect_changes_func` 在 `include_source=True` 时按 changed function 行范围读取源码，失败时写占位符。
- Risk: 读者会误以为 `detect_changes` 不能返回源码上下文，并漏掉其读取失败出口。
- Required outcome: 明确两条路径都可按参数读源码，并区分文件级聚焦 snippets 与函数级 source。
- Suggested remedy: 修正结尾说明及文本流程。
- Editor response: ACCEPT；说明两条路径都可按参数读源码，并区分文件级 snippets 与函数级 source 及失败占位符。
- Editor audit: Current Adequacy：原排他性断言错误；Minimal Resolution：修改文本流程和结尾一步；Blast Radius：review flow 内两处；Proportionality：不改变模块划分。
- Debate conclusion: ACCEPTED_AND_FIXED
- Final impact: `detect_changes(include_source=True)` 的函数级源码产物和读取失败出口已补全。
- Status: RESOLVED

## Final conclusion

- Confirmed: Tree-sitter 只提供 syntax tree/CST；项目在其上执行实体/关系抽取、SQLite 持久化、文件级增量选择、派生分析与查询。报告已固定 revision，Mermaid 与全部修正均已验证。
- Changed: 分离两条 review tool 调用链；修正 qualified name、测试锚点和 CST 术语；补充 impact backend 分派与两条路径的可选源码读取。
- Unresolved: none
- User decision required: none

## Verification

- 本地 Mermaid 11.16.0 flowchart parser — `Mermaid parse OK`。
- Mermaid block count — `1`。
- 四个替换后的测试类与具体方法 — `rg` 均命中。
- 无效测试类名、`AST walk`、错误 qualified-name 文本 — `rg` 无命中。
- Tree-sitter old-tree/edit 调用 — `rg` 无命中。
- `CRG_BFS_ENGINE` 默认值与 NetworkX 分支 — 源码命中。
- 两条 review 路径的 `include_source` 分支与失败占位符 — 源码命中。
- `git rev-parse HEAD` — `6a1ee1c7063cc35cfa5ff12b8198c29360f3e4ad`。
- `git status --porcelain=v1` — 写报告前工作树 clean。
- Limitations: 按 analyze-project 只读协议未安装依赖、未运行上游测试或构建；结论基于源码、配置和既有测试代码。

## Technical appendix

### Review metadata

- Gate: APPROVED
- Review state: APPROVED
- Stop reason: approved
- Reviewer: `project-map-reviewer`
- Current round: RE-REVIEW (3)
- Updated: 2026-07-21T08:22:51+08:00

### Reviewed scope

- Task: [tasks/tasks/analyze-code-review-graph.md](../../../tasks/analyze-code-review-graph.md) — 分析 code-review-graph 的 Tree-sitter 实现
- Base or revision: `6a1ee1c7063cc35cfa5ff12b8198c29360f3e4ad`
- Artifacts: `/tmp/code-review-graph-analysis.0NhNlp/docs/analysis/project-map.md`
- Fingerprint: SHA-256 `e059eecb989b473d94bd4fac64500216a3e63c1076e450fa80aff11b5769eac7`
- Non-goals: 代码质量、安全、性能或架构审计；修改上游源码；运行或安装上游项目。

### Round history

| Round | State | New findings | Resolved | Unresolved |
|---|---|---|---|---|
| INITIAL (1) | CONTINUE | R1, R2, R3, R4 | none | R1, R2, R3, R4 |
| RE-REVIEW (2) | CONTINUE | R5, R6 | R1, R2, R3, R4 | R5, R6 |
| RE-REVIEW (3) | APPROVED | none | R5, R6 | none |

### Unresolved items

None.

### Approval boundary

- Approval covers only the identified revision and scope.
- Reviewed-artifact changes invalidate approval and resume the same numbered history.
- Report and task-summary synchronization are administrative review records.
- External action authorization: not authorized.
