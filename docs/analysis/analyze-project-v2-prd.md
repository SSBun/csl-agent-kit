# Analyze Project v2：Develop 模式产品需求文档

## 文档状态

- 状态：系统化报告产品方向已恢复；本文保留设计依据，运行时细节以当前 skill contract 为准
- 日期：2026-07-19
- 恢复日期：2026-08-10
- 当前合同：`skills/analyze-project/SKILL.md` 与 `skills/analyze-project/references/report-contract.md`

## 1. 问题

旧版 `analyze-project` 默认生成多份结构、依赖、历史、API、数据和质量报告。报告数量多、事实重复，却没有优先回答继续开发最需要的三个问题：

1. 这个项目或组件到底做什么？
2. 功能模块如何分工和依赖？
3. 核心工作流如何跨模块运行？

`develop` 模式必须围绕这三个问题建立可执行的项目心智模型，而不是进行全面审计。

## 2. 产品目标

`develop` 分析一个明确的项目或组件 scope，生成一份高信息密度的 Markdown map。陌生开发者或 agent 阅读后，应能：

- 准确说明该 scope 的职责、输入、输出和边界。
- 按功能职责理解模块，而不是把目录当成架构。
- 沿核心工作流定位模块、状态变化、失败出口和代码入口。
- 正确理解会影响开发判断的领域术语和不变量。

产物是长期复用的当前状态地图，不是某个功能、bug 或重构任务的实施计划。

## 3. 分析 Scope

计划调用方式：

```text
/analyze-project [target_path] develop
```

- `target_path` 为 Git 根时，scope 是整个项目。
- `target_path` 为 Git 根内的目录或文件时，scope 是该组件。
- 读取前必须解析 Git 根与 `target_path` 的 canonical path；解析后的 scope 必须等于 Git 根或位于其内，指向仓库外的 symlink 或其他逃逸路径直接拒绝。
- 自然语言给出组件名时，先解析到明确的仓库相对路径；存在多个候选时询问用户。
- 一次调用只分析一个 scope。
- 目标路径包含多个独立 Git 根时，列出候选并要求用户选择；选择前不写文件。
- 组件分析只解释该组件、其内部模块、直接上下游边界和参与的核心流程，不重新分析整个项目。

## 4. 输出文件

每次调用只生成一份报告：

| Scope | 输出路径 |
| --- | --- |
| 整个项目 | `docs/analysis/project-map.md` |
| 目录组件 | `docs/analysis/components/dir/<repo-relative-dir>/map.md` |
| 文件组件 | `docs/analysis/components/file/<repo-relative-file>.md` |

组件路径使用类型命名空间避免碰撞：目录保留仓库相对目录，文件保留完整文件名与源扩展名。例如，目录 `src/scheduler/` 输出到 `docs/analysis/components/dir/src/scheduler/map.md`，文件 `bin/csl-agent-kit.js` 输出到 `docs/analysis/components/file/bin/csl-agent-kit.js.md`。

写入前必须验证派生路径可以由当前文件系统表示，规范化后仍位于 canonical `docs/analysis/` 内，且现有父目录中的 symlink 不会使其逃逸。验证失败时零写入并报告错误，不使用 hash fallback。

目标文件已存在时不得静默覆盖；先让用户选择基于现有内容更新或完整替换。

## 5. 报告内容契约

### 5.1 Scope Summary

开头先记录最小 freshness 标识：

- 分析使用的 `HEAD` commit SHA；尚无首次提交时记录 `HEAD: unborn`。
- 工作树为 clean，或本次分析明确包含未提交改动。
- 带时区的生成时间。

`HEAD: unborn` 时必须标明本次地图完全基于尚未提交的工作树内容，不伪造 revision。

随后用最短完整描述回答：

- 面向哪个用户、调用方或上游模块。
- 解决什么问题或承担什么职责。
- 接收什么输入，交付什么结果。
- 明确不负责哪些相邻职责。

项目 scope 描述整体产品职责；组件 scope 描述该组件对整个项目的贡献。

### 5.2 Domain Glossary

只收录会改变理解或开发判断的术语：

- 普通含义与项目含义不同。
- 容易与相邻概念混淆。
- 直接影响模块职责、状态或工作流。

```markdown
| Term | Meaning here | Not the same as | Evidence |
| --- | --- | --- | --- |
| Job | 用户提交的逻辑任务 | 一次执行尝试 Run | src/domain/job.ts#Job |
```

不生成完整类型词典。没有符合条件的术语时省略本节。

### 5.3 Functional Module Map

模块按功能职责划分，不按顶层目录、package 数量或文件类型划分。只收录解释 Scope Summary、核心流程及其直接外部边界所必需的最高层功能职责；utility、adapter 和内部实现默认合并到所属职责，不单独展开。

一个模块条目还必须至少满足以下一项：

- 承担独立且可命名的职责。
- 拥有明确输入、输出或调用边界。
- 拥有状态或领域概念。
- 在核心工作流中承担可区分的阶段。

Module Map 同时包含：

1. **一张 Mermaid 依赖图**：只表达模块和外部系统之间的调用、数据或事件方向。
2. **一张职责表**：只表达语义，不重复描述图中的连线。

```markdown
| Module | What it does | Inputs | Outputs | Owns | Code anchor | Tests |
| --- | --- | --- | --- | --- | --- | --- |
```

- `Code anchor` 使用稳定的仓库相对路径与符号。
- `Tests` 只列能直接验证该模块职责的测试；没有可靠映射时写 `未确认`，不得猜测。
- 一个目录包含多个职责时拆成多个功能模块；多个目录共同承担一个职责时合并成一个功能模块。

### 5.4 Core Working Flows

只记录满足至少一项的核心流程：

- 直接实现 scope 的主要价值。
- 跨越多个功能模块。
- 包含重要状态变化、外部边界或异步协作。

不穷举辅助命令、维护任务和边缘路径。每条流程使用相同的紧凑结构：

```text
触发 → 输入 → 模块路径 → 状态变化 → 输出
                         └→ 主要失败出口
```

每个关键步骤就地附上：

- 模块职责与代码入口。
- 仅在该步骤确实改变状态或受规则约束时，附状态变化或不变量。
- 仅在存在直接证据时，附验证该步骤的测试锚点；没有直接测试时省略，不写 `未确认`。

代码、状态、不变量和测试不得另建重复清单。

### 5.5 Cross-flow Invariants

仅当某条规则同时约束多个模块或流程、无法自然放入单个步骤时生成本节。每项必须说明规则、执行位置、违反后果和代码证据；没有这类规则时省略。

## 6. 分析流程

1. 确认唯一 Git 根和唯一 project/component scope。
2. 读取 scope 适用的 agent 规则、README、manifest、入口和测试配置。
3. 从用户可见行为或上游调用开始，确认 Scope Summary。
4. 沿 import、调用、事件、状态所有权和外部边界识别功能模块；不得从目录名直接推断职责。
5. 从入口到输出追踪核心工作流，核对正常路径、主要失败出口和状态变化。
6. 提取理解模块和流程所必需的领域术语与跨流程不变量。
7. 为每项项目事实核对仓库证据，再生成唯一报告。
8. 检查 scope 泄漏、重复事实、空章节、无证据主张和非核心 inventory。

## 7. 信息密度与证据规则

- 一个事实只定义一次；其他位置通过链接或模块名引用。
- 图只表达关系，表只表达职责和边界。
- 顺序行为使用短编号步骤，不写长篇叙述。
- 所有项目特定事实引用仓库相对路径；能定位符号时使用 `path#symbol`。
- 配置事实使用 `path#key`；行号仅在没有稳定符号或键时使用。
- 无证据内容不得写成事实；可选内容没有可靠证据时直接省略。
- 不生成空章节、占位符、固定数量条目或“未发现”清单。
- Mermaid 依赖图必须在交付前通过已有的本地只读 Mermaid parser 或 renderer 的解析/渲染检查；不得为此自动安装依赖。
- 没有可用验证器或解析/渲染失败时，不创建或修改目标报告，并在最终回复报告交付阻塞。
- 默认使用用户语言；代码、命令、符号和既有领域词保持原文。
- 不复制密钥、令牌、连接串或个人数据；统一替换为 `***REDACTED***`。

## 8. 非目标

`develop` 模式不生成：

- 第二份 `development-guide.md` 或自动的逐模块子报告。
- 依赖版本、Git 历史、完整 API、完整数据表或完整类型 inventory。
- 代码质量、安全、性能、架构风险或通用改进建议。
- 面向某个功能、bug 或重构的 change plan。
- 与核心流程无关的辅助、维护和边缘行为目录。

以上需求应路由到审计、代码审查、任务规划或其他专用能力。

## 9. 安全与写入边界

- 只修改第 4 节确定的单一报告文件及其必要父目录。
- 不修改、格式化或重构目标项目源代码。
- 不默认安装依赖、运行构建、测试、项目进程或外部命令。
- 需要执行任何可能改变状态的命令时，另行取得用户授权。
- 探索中发现疑似秘密时，不在 map 中写入秘密值、片段、hash、位置或安全章节。
- 最终回复使用安全警告例外，只写“疑似”秘密类别、仓库相对位置及“未记录秘密值”；不得输出值、片段或 hash。

## 10. 最终回复

最终只返回：

- 生成或更新的报告路径。
- 无法由仓库证据确认、且会阻止正确理解 scope 的问题。
- 疑似秘密的脱敏安全警告，或 Mermaid 无验证器、解析失败等导致零写入的交付阻塞。

不在回复中重复报告摘要、模块列表或流程结论。

## 11. 验收标准

- 一次调用只分析一个 project/component scope，并只生成一份正确路径的报告。
- 目录与文件组件使用不同命名空间；目录、无扩展文件、同 stem 不同扩展文件均得到稳定且无碰撞的路径，派生路径无法安全表示时零写入。
- 报告首先准确说明该项目或组件做什么。
- 报告记录 commit SHA 或 `HEAD: unborn`、工作树状态和带时区生成时间。
- Domain Glossary 只包含会影响理解的术语，并区分相近概念。
- Module Map 按功能职责组织，包含一张关系图和一张不重复信息的职责表。
- Module Map 只展开解释 scope、核心流程和直接边界所需的最高层职责，且 Mermaid 图有可复核的解析或渲染成功证据。
- Working Flows 只覆盖核心行为，明确模块路径、状态变化、主要失败出口和就地证据。
- 项目特定事实均由仓库路径、符号或配置键支持；格式正确但内容不支持主张的引用视为失败。
- 疑似秘密不进入 map；最终安全警告只包含类别、相对位置和未记录值声明。
- 组件报告不重新解释整个项目，也不越过直接上下游边界。
- 报告不包含旧版 inventory、审计建议、空章节、占位符或重复事实。

## 12. Develop 输出 Eval

只建立一个可复现的 component-scope 用例，不建设通用评测框架。

### 固定输入

- 仓库快照：本仓库提交 `05a6c689e2344dc925b7dc111f02aa03750114f6`。
- Scope：`bin/csl-agent-kit.js`。
- 请求：“使用 develop 模式分析这个 CLI 安装组件；不要修改源代码。”
- with-skill 与 baseline 使用相同模型、版本、参数、只读工具权限、仓库快照和请求；唯一变量是是否加载新版 `analyze-project`。

### 预先冻结的黄金证据

| 能力 | 满分要求 | 仓库证据 |
| --- | --- | --- |
| Scope Summary | 说明 CLI 解析安装请求、选择 integrations、执行目标 installer，并输出结果与退出状态 | `bin/csl-agent-kit.js#main` |
| Domain Glossary | 区分 install target 与一次安装结果；target 由名称、默认状态、外部命令属性和 `run` 组成 | `bin/csl-agent-kit.js#targets`、`#installTargets` |
| Module Map | 区分入口、参数解析、目标选择、批量执行和目标 installer，并给出依赖方向 | `#main`、`#parseInstallArgs`、`#resolveInstallTargets`、`#installTargets`、`#installCodexPlugin` |
| Core Flow | 跟踪 `install` 参数到目标解析、执行、结果渲染和退出状态；包含无效目标或外部确认失败出口 | `#main`、`#validateTargets`、`#resolveInstallTargets`、`#installTargets` |
| Development Anchors | 模块和流程事实均映射到正确符号，并指出 CLI 聚焦检查 | `bin/csl-agent-kit.js`、`package.json#scripts.check:cli` |

黄金证据、评分规则和快照必须在生成候选输出前冻结。

### 匿名评分

1. 随机将两组完整输出标为 `A`、`B`，不向评分者暴露来源。
2. 评分者获得候选输出、黄金证据和冻结仓库快照的只读访问；仓库只能用于核验候选主张，不能补全缺失答案。
3. 先逐项验证所有项目事实及其引用；任一引用不能支持对应主张时，该候选直接失败。
4. 事实核验通过后，按上表五项逐项记 `0` 或 `1`；部分正确记 `0`。
5. with-skill 必须得到 `5/5`，且至少领先 baseline `1` 分。
6. 保存输入与运行配置、匿名原始输出、黄金证据、事实核验记录、匿名映射和评分。

## 13. 完整实现质量门

- `develop`、`learn` 与近邻请求的 trigger eval 通过。
- project scope、component scope、多 Git 根选择和已有报告保护均有 fixture。
- 目录、无扩展文件、同 stem 不同扩展文件、稳定更新与不可表示路径覆盖无碰撞输出契约；不得使用 hash fallback。
- scope canonicalization、仓库外 symlink 拒绝、clean/dirty/unborn freshness metadata 均有验证证据。
- Mermaid 成功解析/渲染、无本地验证器和解析失败分别证明正常交付与零写入行为，且不安装依赖。
- 合成秘密 fixture 证明 map 不含秘密值、片段、hash、位置或安全章节，最终回复只含允许的脱敏警告。
- 第 12 节的输出 eval 通过。
- OpenAI skill 结构校验与 local quality gate resource boundary 检查通过。
- 删除旧 prompts、templates 和 workflow 后没有失效引用或孤立资源。
- 最终 skill 差异通过独立 adversarial review。

## 14. 实施顺序

1. 批准本 PRD。
2. 编写并批准 `learn` PRD。
3. 两份 PRD 均批准后，一次性重写完整双模式 skill。
4. 删除旧多报告资源，添加最小 reference 与必要 eval。
5. 运行质量门和最终独立审查。
