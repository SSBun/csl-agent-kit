# 发布 CSL Agent Kit 3.1.0

状态：已完成（2026-07-16）

## 目标

- 将当前全部本地改动以 `3.1.0` minor 版本提交、打 tag、推送并发布到 npm。

## 计划

- [x] 更新版本元数据和 changelog，复核 npm 发布表面。
- [x] 运行项目检查、npm 发布演练及已改技能/钩子的 Yao 审计。
- [x] 提交全部本地改动，创建并推送 `v3.1.0`，发布 npm 包并验证 registry。

## 发布前复核

- npm registry 仅有 `2.0.0`，目标 `3.1.0` 尚未发布；当前 npm 登录用户为 `ssbun`。
- `npm run check` 的 45 项测试、`npx skills add . --list --full-depth`、`npm pack --dry-run --json` 与 `npm publish --dry-run --access public` 均通过；发布包含 133 个文件、13 份第三方来源元数据，未包含项目本地 `.agents/skills/` 流程。
- Yao：`integrate-third-skills` 的 lint、资源边界与 11/11 trigger eval 通过；治理仅提示既有的无 `manifest.json` 约定。13 个导入上游技能均通过 lint；`code-review`、`improve-codebase-architecture`、`teach`、`ubiquitous-language`、`writing-great-skills` 超过 1,000-token 入口预算，保留上游原文以维持可比较更新性。

## 发布结果

- 发布提交为 `0201f85`（`release: csl agent kit 3.1.0`）；`main` 与注释 tag `v3.1.0` 均已推送到 GitHub。
- `@ssbun/csl-agent-kit@3.1.0` 已发布，npm `latest` 指向 `3.1.0`。

# 收敛安装器默认选项并移除项目本地链接

状态：已完成（2026-07-16）

## 目标

- `csl-agent-kit install` 在没有已保存选择时，仅默认勾选 `codex-skills` 与 `codex-plugin`。
- 移除 `Repo-local .agents/skills links` 目标、实现、文档和测试；`.agents/skills/` 仅保留项目本地技能职责。

## 计划

- [x] 删除安装器中的 `repo-link` 目标及其专用逻辑，并调整默认目标。
- [x] 更新 CLI 回归测试、README、忽略规则和工作区上下文。
- [x] 运行全量检查、默认安装预览与差异检查，并完成复核。

## 复核

- 默认目标现在仅为 `codex-skills` 与 `codex-plugin`；Cursor 和 Pi 保留为可选目标。
- `repo-link` 及其创建/迁移 `.agents/skills` 的实现已删除；显式传入该目标会以“Unknown target”失败。
- `env -u NO_COLOR npm run check` 通过 45 项测试；其默认 dry-run JSON 仅返回这两个目标，`git diff --check` 通过。

# 将 integrate-third-skills 限定为项目本地技能

状态：已完成（2026-07-16）

## 目标

- `integrate-third-skills` 仅位于并由本仓库 `.agents/skills/` 发现，不再进入共享技能目录、全局 Codex symlink 安装或 Pi 命令发现。

## 计划

- [x] 检查现有 `.agents/skills` 链接、共享发现器和所有公开引用，确定最小迁移边界。
- [x] 将技能和附带脚本迁入受版本控制的项目本地目录，并调整 CLI 的 repo-local 安装逻辑以保留该目录。
- [x] 更新测试、README、忽略规则与工作区上下文，证明全局发现不再包含该技能而当前项目仍可发现它。
- [x] 运行聚焦与全量验证、打包检查、差异检查和 `yao-meta-skill` 审计。

## 复核

- 已将 `skills/integrate-third-skills/` 迁至 `.agents/skills/integrate-third-skills/`；该目录不再是指向共享 `skills/` 的符号链接。
- `metadata.internal: true` 让 `npx skills add . --list --full-depth` 只列出 27 项可安装共享技能；Codex 仍可在本仓库发现项目本地目录。
- `csl-agent-kit install` 的 `codex-skills` 只处理共享技能；`repo-link` 现在在项目 `.agents/skills/` 中逐项链接共享技能，因此不会覆盖本地流程。
- 临时副本验证了旧 `.agents/skills -> skills/` 链接会被 `repo-link` 迁移为真实目录，并生成共享技能的单独链接。
- `env -u NO_COLOR npm run check` 通过 43 项测试；`quick_validate.py`、Yao lint、资源边界、治理和 11/11 trigger eval 通过。治理仅提示项目既有的无 `manifest.json` 约定。

# 为第三方技能增加上游检查子命令

## 计划

- [x] 确认子命令作为 `integrate-third-skills` 的附带脚本实现，不扩展主安装 CLI。
- [x] 设计 `status` 与 `diff <技能名>` 的只读 Git 契约、错误输出和临时目录边界。
- [x] 实现脚本并更新技能说明、README 与最小回归测试。
- [x] 运行聚焦与全量验证、打包检查和技能审计。

## 复核

- 新增 `skills/integrate-third-skills/scripts/third-party-skills.js`：`status` 按每个 `.repository.json` 的 `sourcePath` 判断上游内容是否变化；`diff <技能名>` 先展示导入后上游差异，再展示当前上游与本地副本的差异；`--patch` 才输出完整补丁。
- 所有命令只读：每个 `repository/ref` 只在系统临时目录克隆一次，结束后删除；不修改 vendor 文件、`~/.agents/skills` 或 Git 工作树。`.repository.json` 从本地内容差异中排除，并拒绝越出上游仓库的 `sourcePath`。
- 回归测试覆盖分支名称后缀误匹配、仓库有新提交但某技能路径未变、本地差异、元数据排除与路径越界拒绝；`env -u NO_COLOR npm run check` 通过 42 项测试，打包检查包含脚本，发现器仍列出 28 项技能。
- `yao-meta-skill` lint、资源边界、治理与 11 条 trigger eval 通过；初始技能体为 509/1,000 token。治理仍仅警告项目既有的无 `manifest.json` 约定；`validate_skill.py` 仍仅要求未采用的 `agents/interface.yaml`，按现有避免一次性 agents 元数据目录的约定不新增。

# 建立第三方技能集成流程

## 计划

- [x] 确认第三方技能以每个叶子技能目录为来源元数据边界，并定义最小 `.repository.json` 结构。
- [x] 为现有 `skills/mattpocock/*/` 技能补充来源元数据。
- [x] 创建 `integrate-third-skills` 技能，固化选择、导入、许可证、冲突、测试与审计流程。
- [x] 添加回归覆盖、更新技能目录文档与数量，并完成验证和规则审计。

## 复核

- 13 个 `skills/mattpocock/<技能>/` 叶子目录各有 `.repository.json`；记录上游 URL、原始相对路径、`main`、导入 commit `66898f60e8c744e269f8ce06c2b2b99ce7660d5f`、MIT 与上游状态。`ubiquitous-language` 明确标记为 `deprecated`。
- 新增 `skills/integrate-third-skills/`：接收第三方技能仓库链接后先列候选、等待选择，再按来源分组导入；它要求逐技能元数据、保留许可证、显式处理重名与本地修改，并禁止把源码导入误当作 `~/.agents/skills` 安装。
- README 已说明第三方目录与元数据约定，技能总数更新为 28；CLI/Pi 回归测试验证新技能被发现，CLI 测试还验证现有第三方叶子和来源数据一一对应。
- `env -u NO_COLOR npm run check` 通过 40 项测试；`npx skills add . --list --full-depth` 发现 28 项；`npm pack --dry-run --json` 包含新流程和全部来源文件；`git diff --check` 通过。未运行真实安装、发布或推送，`~/.agents/skills` 保持为空。
- `yao-meta-skill` 的 lint、资源边界和治理审计通过；资源边界为 361/1,000 初始 token，路由 eval 10/10 通过。治理仅警告全项目采用的无 `manifest.json` 约定；聚合 `validate_skill.py` 仅要求未采用的 `agents/interface.yaml`，按既有“避免一次性 agents 元数据目录”约定不新增该目录。

# 集成选定的 Matt Pocock Skills

## 计划

- [x] 确认 13 个选定上游技能、现有发现机制与同名 `grill-me` 冲突。
- [x] 将选定技能放入专用的 `skills/mattpocock/` 目录，并移除顶层旧版 `grill-me` 以避免重复名称。
- [x] 让 CLI 安装器和 Pi 命令发现递归识别该专用目录中的独立技能。
- [x] 添加最小回归测试，验证嵌套技能进入 symlink 安装与 Pi 命令发现。
- [x] 运行聚焦与全量检查、打包检查和 `yao-meta-skill` 审计。

## 复核

- 专用目录采用 `skills/mattpocock/<skill>/`；公开技能名保持上游原名，避免把来源前缀暴露给用户。
- 现有顶层 `skills/grill-me` 与选定上游技能同名；将由专用目录版本替代，而不是同时保留两个候选。
- 已导入 13 项用户指定的上游包，并保留 `skills/mattpocock/LICENSE`；`ubiquitous-language` 虽位于上游 `deprecated/`，仍按用户明确选择保留。
- CLI 与 Pi 均改为在没有 `SKILL.md` 的分组目录中递归寻找叶子技能；Codex 安装 dry-run 现在为 27 个唯一名称创建 symlink 计划，Pi 新增别名回归测试。
- 测试先确认 RED：新增 CLI 与 Pi 用例均找不到嵌套技能；实现后 `npm run check` 的 39 项测试通过，`npx skills add . --list --full-depth` 发现 27 项，`npm pack --dry-run` 包含 120 个文件与全部导入资源。
- `yao-meta-skill` 审计记录上游包的既有质量缺口：13 项均缺少 `agents/interface.yaml`，5 项超过 1,000-token 入口预算，所有项缺少可选 `manifest.json`。为保持上游来源可更新且不引入一次性元数据，未做本地改写。
- README 已更新为 27 个可安装技能，并说明 CSL 递归发现 `skills/` 下的叶子 `SKILL.md`；专用来源目录与上游已废弃技能的保留状态也已标注。

# 纠正全局技能清理范围

## 计划

- [x] 确认用户要的是清空后的空目录，而不是按推荐清单重装。
- [x] 删除 `~/.agents/skills` 的全部剩余条目，并清空对应技能锁记录。
- [x] 从 Matt Pocock 上游列出全部可选技能；不执行任何整合或重装。

## 复核

- 上一轮错误地将“选择常用技能”理解成可立即重装；本轮以空目录为完成标准，整合清单须等待用户明确选择。
- `~/.agents/skills` 已为空，`~/.agents/.skill-lock.json` 的 `skills` 映射也为空；没有保留或重装任何技能。
- `npx skills@latest add mattpocock/skills --list --full-depth` 从上游发现 40 个技能；本轮仅列出它们，不执行 CSL Agent Kit 整合。

# 精简全局 Agent Skills

## 计划

- [x] 对照 `mattpocock/skills` 当前 README 与本机目录，确定稳定、日常使用的最小技能集合。
- [x] 清空 `~/.agents/skills` 及其过期锁记录，再从上游安装选定技能。
- [x] 验证仅保留选定目录、每项均含 `SKILL.md`，并复核锁文件。

## 复核

- 选定集合：`grill-with-docs`、`grilling`、`to-spec`、`implement`、`tdd`、`diagnosing-bugs`、`code-review`、`research`、`codebase-design`、`domain-modeling`、`resolving-merge-conflicts`、`handoff`。它覆盖需求澄清、规格、实现、测试、诊断、审查、研究、设计和交接；`grilling` 是 `grill-with-docs` 的直接依赖。不安装上游标记为 `in-progress` 的技能，也不安装功能重叠的 `grill-me`、一次性项目配置的 `setup-matt-pocock-skills` 或依赖特定 issue tracker 的工作流。
- 用户明确要求清空 `~/.agents/skills`，因此不保留其中的个人、第三方或旧版技能。
- 已清除 57 个原有条目（包括 14 个 CSL Agent Kit 符号链接），并从 `mattpocock/skills` 的 `main` 重装选定 12 项；锁记录从 42 项收敛为相同的 12 项，来源均为 `mattpocock/skills`。
- 目录枚举、12 个 `SKILL.md`、零符号链接及 `skills list --global --json` 均与预期一致。`yao-meta-skill` 审计发现上游 12 项均缺少 `agents/interface.yaml`；`code-review`、`codebase-design` 和 `diagnosing-bugs` 也超出其 1,000-token 入口预算。为保持上游技能原样，未在本地补丁修复这些上游质量问题。

# 提交本地技能规则改动

## 计划

- [x] 复核工作树并暂存全部当前改动。
- [x] 用英文提交信息创建本地提交，不推送。
- [x] 验证工作树干净。

## 复核

- 当前全部五个改动已写入一个本地提交；未推送。

---

# 补充 Swift 小型代码风格规则

## 计划

- [x] 将已调研的十项可执行 Swift 规则按主题写入 `swift-style.md`。
- [x] 保留现有 API Design SOP 的语义边界，不加入行宽、`self`、import 排序等纯团队偏好。
- [x] 验证 Markdown、差异格式与技能规则审计。

## 复核

- `swift-style.md` 新增可选值、失败路径、控制流、类型表达式和文档注释规则，覆盖强制操作、`T!`、`guard`、`for ... where`、合并 `switch` case、`@unknown default`、类型简写、冗余语法与公开声明 summary。
- 保留 Swift API Design SOP 对文档语义的要求；未加入行宽、`self`、import 排序等纯团队偏好。
- Markdown 代码围栏成对，`git diff --check` 通过；Yao lint 通过，资源与治理检查只有既有警告，聚合校验仍只报告既有的 `agents/interface.yaml` 缺失。

---

# 调研 Swift 小型代码风格坏味道

## 计划

- [x] 搜索 Swift、Apple 和公开团队的一手规范，收集小型代码风格坏味道。
- [x] 区分可作为跨项目默认规则的建议与团队偏好。
- [x] 输出有来源的建议，不修改现有规则文件。

## 复核

- 基于 Swift.org、Apple、swift-format 与 Google 的公开 Swift 规范，整理了十项高收益小型坏味道及其边界；本轮未修改现有 Swift 规则文件。
- 安全性与局部可读性规则可作为跨项目默认建议；行宽、self、导入顺序、尾随闭包和访问控制写法应保留为团队偏好。

---

# 为 Swift 规则按需加入代码块

## 计划

- [x] 在 enum 注释、MARK、功能 extension、protocol conformance extension 和多参数方法规则下加入最小代码块。
- [x] 明确主 SOP 中代码块只在规则需要精确语法参考时使用。
- [x] 更新 workspace context，并验证 Markdown、路由、差异格式与技能规则审计。

## 复核

- `swift-style.md` 在五条需要精确 Swift 语法或布局的规则下加入短代码块：enum case 注释、MARK、功能 extension、单 protocol conformance extension 和多参数方法。
- `code-style.md` 明确代码块仅在文字无法充分表达语法或布局时使用，且必须紧邻对应规则；规则仍是参考文件的主体。
- 五组 Swift 代码围栏均成对；SOP 摘要和候选路由保持不变，`git diff --check` 与空白检查通过。
- Yao lint、资源边界和治理检查通过；聚合校验仍只报告既有的 `agents/interface.yaml` 缺失，资源边界与治理仅有既有警告。

---

# 收紧 Swift 风格参考边界

## 计划

- [x] 将 `swift-style.md` 改为仅含按主题分组的具体 Swift 规则与短示例。
- [x] 将适用边界和使用顺序移至 `code-style.md`，不重复保留在参考文件。
- [x] 更新 workspace context，并验证 Markdown、路由、差异格式与技能审计。

## 复核

- `swift-style.md` 现仅保留五个规则分区：类型与状态、enum 与 MARK、extension 组织、方法布局、改动边界与验证；不再包含范围、使用顺序、例外、坏味道或完成检查章节。
- `code-style.md` 的使用方式现在承载 Swift 的使用说明：结构改动前读取目标文件和必要调用方，确认局部结构；参考只处理文件内组织，不决定 API 命名或 protocol 是否应采用。
- 分区检查确认参考文件只有五个规则标题且没有被移走的章节；SOP 摘要和 Swift 风格候选路由仍只命中 `code-style`。空白与 `git diff --check` 通过。
- Yao lint、资源边界和治理检查通过；聚合校验仍只报告既有的 `agents/interface.yaml` 缺失，资源边界与治理仅有既有警告。

---

# 将 Swift 样例迁移为样式规则参考

## 计划

- [x] 用逐条规则和短示例创建 `swift-style.md`，覆盖 enum 注释、`MARK`、extension 与多参数方法布局。
- [x] 合并旧用户级 `swift-code-style.md` 的适用规则并删除该文件，同时删除被替代的 `swift.swift`。
- [x] 更新 Code Style SOP 的引用和 workspace context。
- [x] 验证 Markdown、引用、差异格式与技能规则审计。

## 复核

- 新增 `skills/sop-manager/references/code-style/swift-style.md`：逐条定义 Swift 的局部结构规则，并用短代码片段说明 enum case 的 `///` 注释、`// MARK: -`、职责 extension、单 protocol conformance extension 和多参数方法换行。
- 已合并旧用户级 `~/.csl-agent-kit/sops/swift-code-style.md` 的局部一致性、`private(set)`、lowerCamelCase、最小改动、坏味道与验证规则，并删除该文件和被替代的 `swift.swift`。
- `code-style.md` 现引用 `swift-style.md`，且明确只排除“协议设计”，不排除 protocol conformance 的文件内组织。SOP 摘要和候选路由的 Swift 风格正例只命中 `code-style`。
- 文件存在性、旧文件缺失、空白与 `git diff --check` 均通过。Yao lint、资源边界和治理检查通过；聚合校验仍只报告既有的 `agents/interface.yaml` 缺失，资源边界与治理仅有既有警告。

---

# 扩展 Swift 代码风格模板结构

## 计划

- [x] 为 enum case 增加文档注释示例。
- [x] 按职责和协议分别拆分 extension，并示范多参数方法换行。
- [x] 验证 Swift 语法、差异格式与技能规则审计。

## 复核

- `swift.swift` 现在示范 enum case 的 `///` 文档注释、`// MARK: - <分组名>`、按派生状态、重试操作和报告职责拆分的方法 extension，以及 `CustomStringConvertible` 和 `Equatable` 各自独立的协议 extension。
- `retrySummary` 展示多参数方法声明的逐行折叠。类型检查同时发现原模板的默认参数不能引用协变 `Self`，已改为 `RetryState.defaultMaximumRetryCount`。
- `swiftc -parse`、`swiftc -typecheck`、`git diff --check` 与空白检查通过。`yao-meta-skill` 的 lint、资源边界和治理检查通过；资源边界仅提示既有 `SKILL.md` 已接近 1,000 token 上限，聚合校验仍仅报告既有的 `agents/interface.yaml` 缺失，治理检查仍仅提示可选 `manifest.json` 缺失。

---

# 新增内置 Code Style SOP 与 Swift 模板

## 计划

- [x] 创建跨语言的内置 `code-style` 规则型 SOP，并明确不与 API 设计、架构或业务规则混用。
- [x] 创建首个 Swift 参考模板 `skills/sop-manager/references/code-style/swift.swift`。
- [x] 验证 SOP 候选路由、Swift 语法和差异格式。
- [x] 按仓库规则运行 `yao-meta-skill` 审计。

## 复核

- 新增 `skills/sop-manager/sops/code-style.md`：按语言读取模板、以项目局部风格为高优先级、限制为当前任务的最小风格改动。
- 新增 `skills/sop-manager/references/code-style/swift.swift`：展示 lowerCamelCase 属性、`private(set)` 源状态与相邻的派生状态和行为。
- `swiftc -parse` 通过；候选路由正例命中 `code-style`，Swift API 设计与架构反例不命中；`git diff --check` 通过。
- `yao-meta-skill` 的 lint 与资源边界检查通过；governance 仅报告既有的可选 `manifest.json` 缺失，`validate_skill.py` 仅报告既有的 `agents/interface.yaml` 缺失，均未在本次扩大范围修复。

---

# 压缩 Tips 候选上下文

## 计划

- [x] 先补回归断言，要求候选 hook 与 Pi 上下文保留服从语义但删除冗余说明。
- [x] 将候选 tips 头部压缩为最少的确认、适用与优先级信息。
- [x] 运行聚焦与全量检查、规则审计及打包检查，再继续 v3.0.0 发布。

## 复核

- 候选 hook 现在只输出一行“当前 prompt 已命中的已确认指令，除非高优先级指令冲突则遵守”说明与 tip 条目；不再输出来源路径、编号检查清单或重复的确认语句。Pi 使用相同的精简优先级语义。
- 测试先行确认 RED：旧输出缺少新短头部且仍含冗余前言；实现后 tips 的 18 项测试、Pi 的 9 项测试与全量 37 项检查均通过。
- `yao-meta-skill` lint、资源边界与 trigger eval（20/20）通过；governance 仅报告既有的可选 `manifest.json` 缺失。
- 已存在会话中的旧长上下文无法回写删除；当前本机插件直接链接工作区，后续匹配 prompt 会使用新格式。

# 发布 CSL Agent Kit 新版本

## 计划

- [x] 审查全部本地改动、版本来源、git 远端与 npm 已发布版本，建议最小合适的目标版本。
- [x] 获得用户对目标版本、远端发布动作和 npm 登录后的明确确认。
- [x] 更新版本号、CHANGELOG 与必要发布元数据，并运行规则审计。
- [x] 运行完整测试、打包与 npm 发布演练，复核发布内容。
- [x] 提交全部本地改动并创建本地版本标签。
- [x] 推送 `main` 与 `v3.0.0`。
- [ ] 使用 npm 一次性验证码发布公开包。
- [ ] 验证远端提交、标签与 npm dist-tag，记录发布结果和剩余风险。

## 复核

- npm 当前最新版本为 `2.0.0`；未提交改动移除了 `tips.md` 运行时 fallback，并改为关键词 JSON，因此建议下一个版本为破坏性变更的 `3.0.0`。
- `env -u NO_COLOR npm run check` 通过 37 项测试与安装 dry-run；`git diff --check` 通过。Yao lint 与资源边界审计通过，`validate_skill.py` 仅报告两个既有 skills 缺少 `agents/interface.yaml`。
- `npm pack --dry-run` 通过并仅包含 82 个预期文件；保留用户要求提交的 `AGENTS.md.backup-*`，但从 npm `files` 白名单中排除，避免将临时备份发布。
- npm 登录用户为 `ssbun`，`npm publish --dry-run --access public` 通过；发布提交为 `c97ece7`，本地 `v3.0.0` 标签已创建。
- GitHub OAuth token 补充 `workflow` scope 后，HTTPS 已将 `main` 推送至 `c97ece7`，并创建远端 `v3.0.0` 标签。
- 实际 `npm publish --access public` 被 npm 的 `EOTP` 拦下；registry 仍仅有 `2.0.0`，因此尚未发布。需要当前的一次性验证码后重试。

# 关键词化 Tips 按需注入

## 记住交互式安装选择

### 计划

- [x] 先补 CLI 回归测试，覆盖保存选择、下次交互预选、无效状态回退默认项，以及显式参数不改写已保存选择。
- [x] 用 Node 标准库在用户数据目录保存交互式已确认选择，并在交互 checklist 中读取它。
- [x] 更新 CLI 说明与变更记录，保持非交互参数和现有安装行为不变。
- [x] 运行聚焦与全量检查、打包检查和差异复核。

### 复核

- 仅记住交互式 checklist 的已确认选择；`--target`、`--all` 和 `--yes` 继续使用其当前显式语义。
- 选择文件以原子替换方式写入；无效、损坏或只包含未知目标的文件会回退到原有三个默认预选项。外部命令未确认、取消或保存失败不会阻断既有安装流程。
- 回归测试先确认缺少存储 API 时失败；实现后 `env -u NO_COLOR npm run test:cli` 的 10 项测试、`env -u NO_COLOR npm run check` 的 37 项测试与安装 dry-run 均通过。
- `npm pack --dry-run` 成功生成 83 文件的发布清单，`git diff --check` 通过。当前命令软链接到本工作区；已将截图中确认的 5 项写入 `/Users/caishilin/.csl-agent-kit/install-selection.json`。
- 未解决但不属于本改动的风险：`/Users/caishilin/.agents/skills/grill-me` 是普通目录而非符号链接，勾选 `Codex skills symlinks` 时仍会因该冲突失败。

## 删除全局 Wildcard Tip

### 计划

- [x] 先补回归测试，明确所有 tips 都会被静默检查，但 `"*"` 不是合法关键词且不会匹配每条 prompt。
- [x] 移除 wildcard 校验与匹配分支，并更新 skill、诊断和相关说明。
- [x] 通过共享 JSON 写入逻辑删除本地 `DO NOT send optional commentary` tip，不改动其余 5 条。
- [x] 运行聚焦与全量验证、打包检查和必需的 `yao-meta-skill` 审计。

### 复核

- 范围仅限删除用户指定的全局 tip 及其 `"*"` 机制；其他 tips 保持“每轮静默检查、仅命中注入”的现有行为。
- 测试先行确认 RED：新增 `"*"` 能写入且会命中任意 prompt；实现后 `tips` 的 18 个测试和 Pi 的 9 个测试均通过。
- 本地 JSON 在文件锁内按精确正文删除目标条目，再用共享原子写入器校验；现在保留 5 条显式关键词 tips，未命中 prompt 不输出任何 tip。
- `env -u NO_COLOR npm run check` 通过 34 个测试与 install dry-run；Bash/Node/JSON 静态检查、manifest parity、`npm pack --dry-run`（82 个文件）和 `git diff --check` 通过。
- `yao-meta-skill` 的 lint、governance、resource-boundary 通过；聚合校验仍仅报告既有的 `Missing agents/interface.yaml`，并提示可选的 `manifest.json` 未提供。
- 已有会话历史中的旧完整 tips developer context 无法由 hook 删除；新会话和后续 prompt 不会再注入该 wildcard tip。

## 计划

- [x] 审查现有 tips 存储、Codex/Pi 生命周期、SOP candidate 实现及回归测试。
- [x] 确定 JSON 存储、关键词匹配、`"*"` 全局关键词及 6 条本地 tip 的候选映射。
- [x] 将 tips 改为按 prompt 关键词匹配，只把命中的 tip 注入对应 turn 的上下文。
- [x] 更新跨客户端实现、诊断、文档与回归测试。
- [x] 按用户确认的 150 字符单条上限迁移本地数据，并重装本地 Codex plugin。
- [x] 完成全量静态、打包与 `yao-meta-skill` 审计。

## 复核

- JSON 存储、写入锁、候选 hook、Pi 动态匹配、诊断与回归测试均已实现；旧 Markdown 不再作为运行时 fallback。
- 单条上限已按用户要求调整为 150 个字符；150/151 的 ASCII 与中文边界回归通过。
- 已迁移 `/Users/caishilin/.csl-agent-kit/tips/tips.md`：现在有 6 条 JSON tips，旧文件安全保留为 `tips.md.bak`，`tips-doctor.sh` 未报告数据或 lifecycle 警告。
- `csl-agent-kit@csl-agent-market` 已重新安装并启用，来源为当前工作区。
- `env -u NO_COLOR npm run check` 通过 32 个测试与 install dry-run；Bash/Node/JSON 静态检查、hook manifest parity、`npm pack --dry-run`（82 个文件且包含新运行时脚本）和 `git diff --check` 均通过。
- `yao-meta-skill` 的 lint、governance、resource-boundary 检查通过；聚合校验仅报告既有的 `Missing agents/interface.yaml`，governance 另提示未提供可选 `manifest.json`。
- 对抗性复核覆盖 150/151 字符边界、失败迁移不改动原文件、目标/源同路径拒绝、JSON 候选只命中相关 tip、`"*"` 全局匹配与旧 Markdown 备份；未发现需要修复的问题。

# 移除 Tips 的逐轮注入

## 计划

- [x] 确认范围：仅移除 tips 的 `UserPromptSubmit` hook，保留该事件下的 SOP candidates。
- [x] 检查 hook manifests、doctor 诊断、相关测试、工作区状态和近期提交。
- [x] 写入并复核最小设计规格，等待用户确认书面规格。
- [x] 按 TDD 先更新契约测试并验证预期失败，再修改两个 hook manifests 与 doctor。
- [x] 运行聚焦测试、全量检查、hook parity、安装包检查和 Yao 审计。
- [x] 更新复核并确认不影响 `SessionStart`、`PostCompact`、Pi `before_agent_start` 与 SOP candidates。

## 复核

- 两个 hook manifests 的 `UserPromptSubmit` 已删除 `tips-inject.sh`，仍保留 `sop-candidates.js`；`SessionStart` 与 `PostCompact` 的 tips hooks 未变。
- 新增 manifest 契约测试，先确认 RED（`true !== false`），完成最小修改后 14 个 tips tests 全部通过；Pi 的 7 个 tests 继续通过。
- `env -u NO_COLOR npm run check` 通过 28 个 tests 和 install dry-run；原始环境因外部 `NO_COLOR=1` 与“默认彩色”测试冲突而失败，未修改无关 CLI 行为。
- JSON、Bash、hook parity、残留 lifecycle 契约、npm pack 与 `git diff --check` 通过；发布包保留两个 manifests、tips skill/doctor 和 Pi context extension。
- Yao lint、governance 与 resource boundary 通过；聚合验证仅保留仓库既有的 `Missing agents/interface.yaml`，且 tips 仍没有可选的 `manifest.json` 治理元数据。
- 已重装本机 `csl-agent-kit@csl-agent-market` local plugin；cache 验证 `tips=false`、`sop=true`。SOP hook 索引变化后需在新会话通过 `/hooks` 复核 trust。

# 清理废弃 Agent Skills

## 计划

- [x] 删除 4 个上游明确 deprecated 的技能目录。
- [x] 删除 4 个已重命名或移除的旧技能目录。
- [x] 从 `~/.agents/.skill-lock.json` 删除对应安装记录。
- [x] 验证目录、锁文件和当前有效替代技能，记录复核结果。

## 复核

- 已删除 `design-an-interface`、`qa`、`request-refactor-plan`、`ubiquitous-language`、`diagnose`、`to-issues`、`to-prd` 和 `zoom-out`。
- `~/.agents/.skill-lock.json` 可正常解析，8 个对应键和所有指向 `deprecated/` 的记录均已清除。
- 逐项验证 8 个目录均不存在；有效替代技能 `diagnosing-bugs`、`to-spec`、`to-tickets` 仍存在。
- Yao 安装一致性审计通过：42 条锁记录均有安装目录，35 个 `mattpocock/skills` 记录均指向当前上游文件，deprecated 与 stale 路径均为 0。
- 未改动 `~/Desktop/test/skills` 上游参考仓库，也未清理 `~/.claude/skills` 等未授权目录。

# 复核并提交 Codex Plugin Identity

## 计划

- [x] 逐项审查当前 diff 的正确性、迁移兼容性、破坏性操作和测试覆盖。
- [x] 重跑全量检查，更新复核记录并提交全部当前仓库改动。
- [x] 验证提交后工作区 clean；不执行 push。

## 复核

- Code review 无 Critical、Suggestion 或 Nit findings；改动范围与用户确认的 `csl-agent-kit@csl-agent-market` identity 一致。
- 迁移覆盖 clean install、legacy `csl@CSL`/`csl@csl`、重复安装和旧 marketplace 清理；本机已实际迁移并连续安装两次验证幂等。
- `npm run check` 通过 27 项测试；npm pack 包含 79 个文件且关键 manifests/hooks 齐全；manifest identity、hook parity、local Codex identity 与 `git diff --check` 通过。
- 已提交为 `fix: migrate Codex plugin identity`；提交后工作区 clean，本地 `main` 比 `origin/main` 领先 3 个提交，未执行 push。

# 统一 Codex Plugin Identity

## 计划

- [x] 将 Codex marketplace/plugin identity 改为 `csl-agent-kit@csl-agent-market`，不改 Claude、Cursor 或独立 skill 名称。
- [x] 修正 installer 的迁移流程和最小回归测试，清理 `csl@CSL`、`csl@csl` 旧注册。
- [x] 运行全量检查，迁移本机 Codex 配置并验证 hooks 只注册一次。
- [x] 更新复核；本轮未收到 commit/push 请求，因此保留仓库改动未提交。

## 复核

- `.agents/plugins/marketplace.json` 现使用 marketplace `csl-agent-market` 和 plugin `csl-agent-kit`；`.codex-plugin/plugin.json` 与之对齐。
- Installer 会先移除新 identity 以支持幂等重装，再清理 `csl@CSL`、`csl@csl` 及旧 marketplaces，最后安装 `csl-agent-kit@csl-agent-market`；新增 CLI regression test 固定该命令序列。
- 本机 `/Users/caishilin/.codex/config.toml` 和旧 cache 已清理；`codex plugin list` 只显示一个启用项 `csl-agent-kit@csl-agent-market`，连续运行 installer 两次仍保持单一注册。
- `npm run check` 共通过 27 项测试（CLI 7、tips 13、Pi 7）；manifest contract、hook parity、npm pack 和 `git diff --check` 通过。
- Yao audit 不适用：本轮未修改 agent rule、skill、SOP 或 hook 定义，只修改 Codex distribution identity、installer、文档和测试。

# 诊断重复 Hook 执行

## 计划

- [x] 确认当前客户端实际加载的 CSL plugin/hook 来源及重复注册路径。
- [x] 对照两个 hook manifests、安装 symlink 和客户端配置复现重复数量。
- [x] 给出根因与最小修复；未经确认不删除用户安装配置。

## 复核

- 根因不是单个 manifest 内重复，而是 Codex 同时启用了 `csl@CSL` 和 `csl@csl`；两个 marketplace 名称仅大小写不同，且都指向 `/Users/caishilin/Desktop/personal/skills`。
- `/Users/caishilin/.codex/config.toml` 同时包含 `[marketplaces.CSL]`、`[marketplaces.csl]`、`[plugins."csl@CSL"]`、`[plugins."csl@csl"]`，hook trust state 也分别记录了两套相同 hash，因此 CSL 的 SessionStart 和 UserPromptSubmit hooks 各运行两次。
- 当前 manifest 和 `codex plugin list` 的 canonical identity 是小写 `csl@csl`；最小修复是删除 legacy uppercase `CSL` marketplace/plugin/state，保留 lowercase 注册。
- 该重复由 installer 的升级迁移遗漏造成：v2.0.0 将 marketplace 从 `CSL` 改为 `csl`，但 `installCodexPlugin()` 只删除 `csl@csl`，没有清理旧的 `csl@CSL` marketplace/plugin/state；旧安装在升级重装后变为双注册。
- 后续用户确认采用 `csl-agent-kit@csl-agent-market`；本机旧配置已清理，installer 也已加入迁移步骤。

# 复查 Hooks 并提交 Handoff 删除

## 计划

- [x] 枚举 JSON hooks、Pi lifecycle hooks 及其 matcher、脚本和触发时机。
- [x] 验证 hook manifest parity、JSON、脚本可执行性、匹配行为和全量测试。
- [x] 更新任务复核，提交全部当前更改，并确认工作区状态。

## 复核

- JSON hook manifests 完全一致，共 5 类事件、8 个 command hooks：SessionStart、PostCompact、UserPromptSubmit、PreToolUse、PostToolUse。
- Pi context extension 共 5 个 lifecycle hooks：session_start、session_compact、before_agent_start、tool_call、tool_result；Fast Mode extension 共 3 个：session_start、model_select、before_provider_request。
- JSON matcher、Figma/MasterGo matcher、tips/SOP 脚本、tips doctor lifecycle、Pi context tests 和 Fast Mode priority payload smoke test通过；`.git/hooks` 只有未启用的 sample hooks。
- `npm run check` 通过 26 个测试；hook parity、manifest、npm pack、Pi command discovery、Yao audit 与 `git diff --check` 结果保持通过。
- 本轮更改已提交，提交后工作区 clean；本地 `main` 比 `origin/main` 领先 2 个提交，未执行 push。

# 删除全部 Handoff 机制

## 计划

- [x] 删除仓库中的 handoff-save、handoff-restore 及所有当前产品声明。
- [x] 删除独立安装的 Pi handoff skill 和 `~/.agents/handoffs/` 用户数据。
- [x] 验证各平台 manifest、Pi 命令发现、npm pack、全量测试和残留引用。
- [x] 运行所需 Yao skill 审计并记录已知非阻塞缺口。

## 复核

- 删除了仓库中的 handoff-save、handoff-restore 和格式模板，并清理 README、六个 plugin/marketplace manifest 与当前 skill 文案中的产品引用；CHANGELOG 已记录到 `[Unreleased]`。
- 删除了 `~/.agents/skills/handoff-save`、`~/.agents/skills/handoff-restore`、第三方 `~/.agents/skills/handoff`、Pi handoff symlink 和 `~/.agents/handoffs/` 内全部用户数据。
- `npm run check` 通过 26 个测试；Claude manifest 与 15 个实际 skill 目录完全一致，npm pack 不含 handoff skills，Pi RPC 的 61 个命令中无 handoff 命令。
- JSON、hook parity、残留路径和 `git diff --check` 验证通过；brainstorming 与 tips quick validation 通过。Yao lint、governance、resource boundary 通过，聚合结果仅保留仓库统一的 `Missing agents/interface.yaml` 约定缺口。

# 审计并构思跨会话 Handoff 机制

## 计划

- [x] 读取 handoff-save、handoff-restore、格式模板、实际 handoff 样本和相关历史审计。
- [x] 验证两个 skill 的结构、资源边界、存储与恢复流程。
- [x] 说明当前用法，识别“继续执行”与“继续思考”的差距，并提出最小设计方向。

## 复核

- 当前双 skill 分工清楚，适合把单一编码任务从一个会话交给下一个会话；实际样本证明 Task Scope、Pinboard、Locked Decisions 和 Next Action 可用。
- 主要缺口是单项目单文件会冲突、restore 未校验 workspace/branch/HEAD、格式要求展示不存在的 In Progress、显式 project-name 缺少严格规范化，以及 handoff 没有 consumed/archive 生命周期。
- 当前格式保存执行位置多于思考前沿；若目标是跨会话继续推理，应保存当前心智模型、未决问题、候选路径、证据缺口和下一步思考动作，而不是保存聊天叙事。
- quick validation 通过；Yao lint、governance 和 resource boundary 通过，聚合结果仅报告仓库统一的 `Missing agents/interface.yaml` 约定缺口；两个 skill 当前都没有 trigger eval。

# 修复复审发现的全部问题

## 计划

- [x] 为自定义 tips 路径、C locale Unicode 边界、Node 18 测试面和发布版本归属补回归检查。
- [x] 统一 Pi 与 shell readers 的 `CSL_AGENT_KIT_TIPS_FILE`/`CSL_AGENT_KIT_TIPS_DIR` 路径解析。
- [x] 使用 Node Unicode code-point 计数替代 locale-sensitive 的 Bash/AWK 长度计算。
- [x] 将未发布功能移回 CHANGELOG `[Unreleased]`，保留已发布 `2.0.0` 的真实内容，不执行版本发布动作。
- [x] 拆分 Node 18 CLI/tips 测试与 Node 22.19+ Pi 测试，并在 CI 覆盖两条运行时边界。
- [x] 运行 Node 18/20/22、全量检查、npm pack、trigger eval、Yao audit 和 diff 验证。
- [x] 调用独立只读 Pi reviewer 复审完整 diff；若发现有效问题则继续修复并重复验证。

## 复核

- Pi、inject、doctor 和 add 现在按 `TIPS_FILE > TIPS_DIR > CSL_AGENT_KIT_HOME` 解析路径；跨客户端 override 回归通过。
- tips 单条与总量、doctor overlong 诊断均改为 Node Unicode code-point 计数，`LC_ALL=C` 下 120/121 个中文字符边界通过。
- tips 并发写入改用 Linux `flock` / macOS `lockf` 原生进程锁；进程退出或崩溃后内核自动释放，已有 lock file 可安全复用。doctor 改为 JSON 解析 hooks，不再依赖格式或事件名正则。
- CHANGELOG 将新功能移回 `[Unreleased]`；当前 source of truth 仍为已发布 `2.0.0`，package-lock 无需变化，未执行 tag、push 或 publish。
- CI 以 Node 18/20 matrix 验证 CLI/tips，并以固定 Node 22.19.0 验证 Pi；本地 Node 18、20、22 全部通过。Node 22 共通过 26 个测试，Node 18/20 各通过 19 个并明确跳过不受支持的 Pi runtime。
- npm pack、TypeScript no-emit、Bash/Node/YAML/JSON、hook parity、trigger eval 与 `git diff --check` 通过；quick validation 通过。Yao lint、governance、resource boundary 通过，聚合结果仅保留仓库既有 `Missing agents/interface.yaml` 约定缺口。
- 两个独立只读 Pi reviewer 经过多轮复审；修复原生锁、JSON hook 解析、Node 20 CI 和 Node 22.19 pin 后，最终均返回“无发现”。

# 复审全部本地更改

## 计划

- [x] 重新梳理全部 tracked 与 untracked 改动及其业务目标。
- [x] 复查跨客户端 hook、tips/SOP 数据边界、Pi 生命周期、打包表面和规则变更。
- [x] 运行聚焦与全量验证，按严重级别记录仍可复现的问题。

## 复核

- 仍发现 4 个问题：Pi 忽略自定义 tips 文件路径、CHANGELOG 把未发布功能写入已发布版本、字符限制受 locale 影响，以及新增质量门禁无法在声明支持的 Node 18/20 上运行。
- 已复现 Pi 与 shell 注入分别读取 default/custom tips；`LC_ALL=C` 下 120 个中文字符被误算为 360；Node 18 的 tips 测试和 Node 18/20 的 Pi 测试命令均失败。
- npm registry 的 `2.0.0` 发布于 2026-07-10，已发布 tarball 不含 `csl-context-hooks.ts`，而本地 CHANGELOG 将该功能列入 `2.0.0`。
- `npm run check` 的 22 个测试通过；本地 npm pack 包含 Pi context hook，hook parity 与 `git diff --check` 通过。

# 修复本地审计问题

## 假设与成功标准

- 假设本次修复覆盖审计发现的全部 5 个问题，不扩展 tips、SOP 或 Pi 的产品语义。
- 并发添加后仍严格满足 20 条、单条 120 字符和总计 2,000 字符限制，文件格式不损坏。
- 任一畸形 SOP、被其他 extension 消费的输入、排队输入或失败的设计工具调用，都不能污染下一轮上下文或阻断 tips 注入。
- `tips-doctor.sh` 在源码仓库和无 `.git` 的 npm 包目录中都能报告 hook 与 Pi lifecycle。

## 计划

- [x] 先补回归测试：并发 tips 写入、畸形用户 SOP、跨轮 prompt 残留、失败的设计工具结果，以及无 Git 元数据的 doctor 包目录。
- [x] 在 `tips-add.sh` 中用实际 tips 文件旁的可移植锁包住“读取—校验—初始化—追加”整个临界区；锁等待有上限并通过 `trap` 清理，避免并发越限、重复和部分初始化。
- [x] 在共享 SOP loader 中把 `name`、`when_to_use` 和 `globs` 规范为安全类型，并让单个不可读或畸形 SOP 降级而非破坏整批加载；Pi 候选匹配继续单独容错，确保 tips 始终可注入。
- [x] 删除 Pi 的单槽 `latestPrompt`/`input` 缓存，直接使用当前 `before_agent_start` 的 `event.prompt`，消除被消费输入和排队输入造成的串轮状态。
- [x] 仅在匹配的设计工具成功时追加 `figma-describe` 提醒，并覆盖成功、失败和重复提醒三种结果。
- [x] 让 doctor 从脚本物理位置解析 package root，不再依赖 `.git`；保持现有源码仓库输出格式。
- [x] 运行聚焦测试、`npm run check`、Bash/Node/JSON/TypeScript 检查、hook parity、npm pack 隔离验证和 `git diff --check`。
- [x] 做对抗性复核：强制终止后的锁清理、并发首次创建、畸形 SOP 与有效 SOP 共存、多条排队 prompt、失败工具结果，以及 npm 安装目录无 Git 元数据。

## 复核

- 新增并发回归后先复现 30 个写入全部成功，再用同文件锁把完整检查与追加临界区串行化；最终仅 20 个成功、文件保留单一标题且无重复，聚焦并发测试连续运行 3 次通过。
- SOP loader 现在逐文件容错并规范关键字段；Pi 候选匹配失败只清空候选，不再阻断 mandatory tips。畸形与有效 SOP 共存测试通过。
- Pi 删除原始输入单槽状态，连续 prompt 直接按当前 `event.prompt` 重算候选；失败和已提醒的设计工具结果不再追加提醒。
- doctor 改为从脚本物理路径定位 package root；临时无 Git 包目录测试和真实 `npm pack` 解包检查均能发现 UserPromptSubmit 与 before_agent_start lifecycle。
- `npm run check` 通过：6 个 CLI、10 个 tips、6 个 Pi 测试，共 22 个测试；Bash、Node、JSON、TypeScript、hook parity、signal lock cleanup、npm pack 隔离和 `git diff --check` 均通过。
- tips trigger eval 为 0 false positive、0 false negative；两个相关 skill 的 quick validation 通过。Yao 聚合审计的 lint、governance 和 resource boundary 通过，仅继续报告仓库既有的 `Missing agents/interface.yaml` 约定缺口。
- 已知边界：不可捕获的 `SIGKILL` 可能遗留 `.lock` 目录；命令会在 5 秒后失败并报告完整锁路径，不会绕过限制或损坏 tips 文件。

# 审计本地更改

## 计划

- [x] 梳理本地 diff 的业务目标、改动边界与相关运行时契约。
- [x] 检查正确性、安全性、兼容性、边界条件和测试覆盖。
- [x] 运行聚焦验证，并按严重级别记录可复现的问题与剩余风险。

## 复核

- 发现 5 个需处理的问题：tips 并发写入可突破硬限制，畸形用户 SOP 可中断 Pi 的整块上下文注入，Pi 的原始 prompt 缓存可能串轮，失败的设计工具结果仍会宣称已取得设计数据，以及 npm 安装环境中的 doctor 不会检查 lifecycle。
- `npm run check` 全部通过；Bash/JSON/Node 语法、hook parity 与 `git diff --check` 通过。
- 并发复现中 30 个写入最终保存了 26–30 条，稳定突破 20 条上限；隔离的非 git 包目录复现了 doctor 完全省略 hook/Pi lifecycle 输出。
- 独立 TypeScript no-emit 命令因仓库默认 CommonJS 推断拒绝 `import.meta`，这不是当前 npm/CI 测试采用的加载模式，未作为代码 finding。

# 精简默认 Agent 原则

## 计划

- [x] 从默认 `AGENTS.md` 模板删除 Plan Mode 和 Subagent Strategy 两节，并连续重编号。
- [x] 保留所有文件修改必须写 `tasks/todo.md` 的规则及 context 日常维护例外，记录已确认的长期决策。
- [x] 验证模板内容、`~/.agents/AGENTS.md` 软链接生效情况和 diff，并运行 Yao 规则审计。

## 复核

- 删除了 `Plan Mode Default` 和 `Subagent Strategy`；默认规则不再规定何时进入 plan mode 或调用 subagent。
- 保留所有文件修改或非简单任务必须先写 `tasks/todo.md` 的要求，并保留 context 日常维护的唯一例外。
- 将剩余章节连续调整为 1–7，未改动其他原则内容。
- 已把确认后的组件来源与长期决策沉淀到 `tasks/context.md`，并记录 todo、plan mode、subagent 的职责边界 lesson。
- 验证目标章节已删除、todo/context 规则仍存在、`~/.agents/AGENTS.md` 解析到更新后的模板，`git diff --check` 通过。
- 已运行 Yao 审计：lint、governance 和 resource boundary 通过；聚合验证仅因当前工作区已删除的 `skills/super-agent/agents/openai.yaml` 报告已知的 `Missing agents/interface.yaml`。

# 添加工作区上下文沉淀机制

## 计划

- [x] 在默认 `AGENTS.md` 模板中加入 `tasks/context.md` 的读取、自动沉淀和当前事实维护规则。
- [x] 创建默认的零字节 `tasks/context.md`。
- [x] 验证规则内容、空文件状态、`~/.agents/AGENTS.md` 软链接生效情况，并运行 Yao 规则审计。

## 复核

- 默认规则现在以会话启动目录为 workspace root，在 session start、resume 和 compact 后读取 `tasks/context.md`，并于当前 turn 结束前自动沉淀对话中确认的稳定事实。
- 上下文文件采用可更新的当前事实快照，限定工作区结构、组件关系、领域术语和工作区级决策；明确排除推测、秘密、任务进度、lessons 和对话历史。
- 创建了零字节 `tasks/context.md`；首次实际写入时才添加标题和所需分区。
- 增加常规 context 维护无需创建 todo 计划的例外，避免规则之间互相递归。
- 验证 `~/.agents/AGENTS.md` 仍准确解析到默认模板，九个规则章节连续，`git diff --check` 通过，npm dry-run 包含更新后的默认模板。
- 已运行 Yao 审计：lint、governance 和 resource boundary 通过；聚合验证仅因当前工作区已删除的 `skills/super-agent/agents/openai.yaml` 报告已知的 `Missing agents/interface.yaml`。

# Install Super Agent Instructions Globally

## Plan

- [x] Back up the existing Codex and Claude instruction targets.
- [x] Link Codex, Agent Skills, and Claude Code to the bundled Super Agent instructions.
- [x] Verify all symlinks and backups, then run the required Yao rule audit.

## Review

- Codex, Agent Skills, and Claude Code now link directly to the bundled Super Agent instructions.
- Preserved the previous Codex file and Claude symlink in timestamped adjacent backups.
- Verified all three targets with `test -L` and exact `readlink` comparison; verified both backups and the original Claude link destination.
- Required Yao audit ran: lint, governance, and resource-boundary checks passed. Aggregate validation reports the repository's known release-only `Missing agents/interface.yaml` gap.

# 在 Pi 中安装 Caveman 和 Ponytail

## 计划

- [x] 记录当前 Pi package/settings 状态，并确认目标资源尚未安装。
- [x] 通过官方原生 Pi package 安装 Ponytail。
- [x] 从现有可信 Codex plugin 源中只安装 Caveman 主回答风格 skill。
- [x] 验证 Pi package 注册、Caveman 发现路径、源文件完整性和目标资源冲突。

## 复核

- 通过 `pi install git:github.com/DietrichGebert/ponytail` 安装 Ponytail 4.8.4；Pi settings 和 `pi list` 均已登记该 package。
- 创建 `~/.pi/agent/skills/caveman` 软链接，只暴露主 `caveman` skill；未安装 `caveman-stats`、`cavecrew` 或 `caveman-compress`。
- Pi RPC `get_commands` 实际发现 `/ponytail`、全部 Ponytail 扩展命令、`/skill:ponytail*` 和 `/skill:caveman`。
- Ponytail 的 Pi extension 专项测试 23/23 通过，目标资源没有名称冲突。
- Ponytail 上游完整测试 82 项中 81 项通过；唯一失败是 correctness benchmark 需要本机未安装的 Python `pandas`，与 Pi extension 加载无关，未擅自修改全局 Python 环境。
- 当前 Pi 会话需要执行 `/reload`，或重启 Pi，才能加载新资源。

# Clarify Caveman And Ponytail Roles

## Plan

- [x] Stop the proposed Caveman disablement before making any configuration changes.
- [x] Record the distinct responsibility of each plugin for future recommendations.

## Review

- No plugin or Pi configuration was changed.
- Caveman remains the natural-language verbosity reducer; Ponytail remains the concise, clear code-output discipline.

# Remove Super Agent Interface Folder

## Plan

- [x] Confirm the folder contents and search for runtime, packaging, and documentation references.
- [x] Remove `skills/super-agent/agents/` without changing the skill workflow or bundled AGENTS source.
- [x] Run package tests, diff checks, and the required `yao-meta-skill` audit.

## Review

- Removed the unreferenced `skills/super-agent/agents/openai.yaml` and its now-empty directory.
- Kept `skills/super-agent/SKILL.md` and `skills/super-agent/references/AGENTS.md` unchanged.
- Verified no runtime, package, or documentation references remain.
- `npm run check` passed: 6 CLI, 8 tips, and 4 Pi tests, plus install dry-run.
- Package dry-run contains the skill and bundled AGENTS reference but no super-agent `agents/` path.
- `git diff --check` passed.
- Required Yao audit ran; lint, governance, and resource checks passed. Its aggregate validator reports `Missing agents/interface.yaml`, which is expected after intentionally removing the one-off interface directory and is not a runtime/package requirement in this repository.

# Implement Stronger Tips Compliance

## Plan

- [x] Inspect the current tips implementation, hook adapters, tests, and dirty workspace without disturbing unrelated work.
- [x] Add failing coverage for confirmation, normalization boundaries, per-tip/quantity/total limits, duplicates, multiline input, and mandatory injection wording.
- [x] Implement the minimum shared validation and injection changes.
- [x] Wire complete tips injection into every supported per-turn lifecycle while preserving session and compaction coverage.
- [x] Extend doctor diagnostics for limits, malformed data, injection preview, and lifecycle coverage.
- [x] Update user-facing skill guidance and trigger evaluations without broadening automatic capture.
- [x] Run focused tests, shell/static checks, diff review, and the required `yao-meta-skill` audit.

## Review

Implemented stronger tips capture and compliance semantics:

- Kept explicit preview and confirmation mandatory before every write; ordinary preferences still do not trigger automatic saving.
- Added semantic guidance for durable, cross-task, single-behavior, non-sensitive tips and allowed normalization before confirmation.
- Enforced 120 characters per tip, 20 tips, 2,000 total tip characters, single-line/nonblank input, and exact duplicate rejection.
- Changed injected tips into confirmed persistent user instructions that are mandatory whenever applicable.
- Added complete per-turn refresh through `UserPromptSubmit` hooks and Pi `before_agent_start`, while preserving session start, resume, and compaction refresh.
- Expanded doctor output with limits, malformed/overlong/duplicate diagnostics, lifecycle coverage, and the full injection preview.
- Added eight tips tests and strengthened Pi tests to prove that changed tips are reloaded before the next agent turn.

Verification performed:

- `npm run check`: 6 CLI tests, 8 tips tests, and 4 Pi tests passed; install dry-run passed.
- Trigger evaluation: 0 false positives, 0 false negatives, precision 1.0, recall 1.0 across 20 cases.
- Bash syntax, JSON parsing, hook parity, TypeScript no-emit check, Unicode 120/121-character boundary, doctor lifecycle smoke test, and `git diff --check` passed.
- Required `yao-meta-skill` audit ran: lint, governance, and resource-boundary checks passed; the aggregate validator still reports the repository-wide packaging convention gap `Missing agents/interface.yaml`, which predates this change and is not added speculatively for tips alone.

Unresolved risk:

- Hook-only clients may retain repeated `UserPromptSubmit` context in conversation history because they lack Pi-style ephemeral system-prompt replacement; the agreed 20-tip/2,000-character limits bound each injection, but host-specific accumulation remains outside this repository's control.

# Brainstorm Stronger Tips Compliance

## Plan

- [x] Clarify whether “more positive” refers to saving tips or complying with already injected tips.
- [x] Compare compliance-strength designs while preserving explicit confirmation before every write.
- [x] Agree on the desired execution semantics and document the validated design only if requested.

## Review

- Confirmed that saved tips are mandatory whenever applicable but remain below system, developer, and explicit current-turn user instructions.
- Kept exact-preview and explicit-confirmation requirements before every write.
- Defined tips as normalized, single-line, single-behavior persistent instructions.
- Agreed limits: 120 characters per tip, 20 tips, and 2,000 total tip characters.
- Agreed to inject the complete current tips block before every agent turn, plus session start and post-compaction/resume.
- No standalone design document was requested or written.

# Add Pi Tips And SOP Lifecycle Hooks

## Plan

- [x] Add test fixtures for Pi session context injection, SOP candidate routing, tool reminders, and Figma result reminders.
- [x] Refactor SOP candidate routing into a reusable module without changing the Codex hook behavior.
- [x] Add a Pi extension using `session_start`, `session_compact`, `input`, `before_agent_start`, `tool_call`, and `tool_result`.
- [x] Inject tips and SOP summaries from `~/.csl-agent-kit/` into Pi's per-turn system prompt.
- [x] Update package scripts, README, and changelog.
- [x] Run Node tests, Pi extension loading tests, skill validation, package checks, and Yao audit.

## Review

Added `pi/extensions/csl-context-hooks.ts` with Pi-native lifecycle integration:

- `session_start` and `session_compact` refresh tips and SOP metadata.
- `input` captures the raw interactive prompt for SOP candidate routing.
- `before_agent_start` injects persistent tips, available SOP summaries, and prompt-specific SOP candidates into Pi's system prompt each run.
- `tool_call` shows one mutation-time SOP reminder when the current prompt has matching candidates.
- `tool_result` appends `figma-describe` guidance after matching Figma/MasterGo design-fetch tools.
- Missing or unreadable tips/SOP files degrade to empty context without blocking Pi.

Supporting changes:

- Refactored `skills/sop-manager/scripts/sop-candidates.js` to export reusable `loadSops`, `findCandidates`, and formatting functions while preserving its CLI hook behavior.
- Added `tests/pi-context-hooks.test.mjs` covering context formatting, all event registrations, candidate injection, mutation reminder, and Figma reminder.
- Added `npm run test:pi`, aggregate `npm test`, and `npm run check`; CI now runs the aggregate check.
- Updated README and the `2.0.0` changelog entry.

Verification performed:

- `npm run check`: 6 CLI tests and 3 Pi context-hook tests passed.
- `node --experimental-strip-types --test tests/pi-context-hooks.test.mjs`
- TypeScript no-emit check for `pi/extensions/csl-context-hooks.ts`.
- All three Pi extensions loaded successfully with Node type stripping.
- Codex SOP candidate CLI compatibility test passed.
- `quick_validate.py skills/sop-manager` passed.
- `yao.py validate skills/sop-manager` ran; the only failure remains the intentionally non-blocking `Missing agents/interface.yaml`, with lint/governance/resource checks passing apart from the existing heavy-SKILL warning.
- `npm pack --dry-run --json` includes `pi/extensions/csl-context-hooks.ts` (83 package files).
- `npm publish --dry-run --access public` passed.
- `git diff --check` passed.

Unresolved risk:

- User-authored tips and SOP summaries are injected into every Pi agent run; very large local datasets may need a future context-size cap.
- The live npm `2.0.0` publish is still pending an OTP and these new changes are not committed or pushed yet.

# Commit And Release CSL Agent Kit

## Plan

- [x] Confirm release target, package ownership, current/target version, and SemVer impact.
- [x] Audit the complete dirty workspace and separate unrelated changes if any.
- [x] Update version metadata and changelog for the confirmed release.
- [x] Run full local verification, npm pack/publish dry-runs, and inspect package contents.
- [ ] Present commit, tag, push, and publish commands for explicit confirmation.
- [ ] Commit only approved files, then execute only confirmed remote release actions.
- [ ] Verify git and registry state after release.

## Review

Release preparation complete; remote release actions pending final confirmation.

Confirmed release:

- GitHub: `SSBun/csl-agent-kit`
- npm: `@ssbun/csl-agent-kit@2.0.0`
- npm user: `ssbun`
- version type: major, because old paths, namespace, and skill invocation compatibility were intentionally removed.

Preparation completed:

- Renamed the GitHub repository from `SSBun/skills` to `SSBun/csl-agent-kit` and updated local `origin`.
- Updated package and plugin versions to `2.0.0`.
- Added `CHANGELOG.md` with breaking-change notes.
- Added an npm `files` allowlist, public publish config, repository metadata, Node engine requirement, and optional Pi peer dependency.
- Updated CI to validate the npm CLI and the current Codex plugin contract.

Verification performed:

- `npm ci`
- `npm run check:cli`
- JSON, hook parity, shell syntax, and Node syntax checks.
- All 17 skills passed `quick_validate.py`.
- Manifest and CI contract checks passed.
- `git diff --check`
- `npm pack --dry-run --json`: 82 files, approximately 77 kB packed / 213 kB unpacked.
- Packed tarball install simulation passed.
- `npm publish --dry-run --access public` passed.
- `npm whoami` returned `ssbun`.
- `@ssbun/csl-agent-kit@2.0.0` is available.

Pending remote actions:

- Commit release changes.
- Push `main` to `origin` (including the two existing local commits ahead of the old remote main).
- Publish `@ssbun/csl-agent-kit@2.0.0` with public access.
- Create and push `v2.0.0` after recording final release status.

# Default NPM CLI Output To Color

## Plan

- [x] Add a regression test proving default non-JSON output contains ANSI colors.
- [x] Change automatic color mode to default-on while preserving explicit opt-out.
- [x] Keep JSON output color-free and update documentation.
- [x] Run CLI tests, package checks, and diff verification.

## Review

Changed human-readable CLI output to use ANSI colors by default, including non-TTY output.

Behavior:

- Default: colors enabled.
- `--color`: colors explicitly enabled, overriding `NO_COLOR`.
- `--no-color`: colors disabled.
- `NO_COLOR=1`: default colors disabled.
- `--json`: always valid color-free JSON.

TDD verification:

- RED: the new default-color test failed because non-TTY output was previously plain text.
- GREEN: all six CLI output tests pass after changing color auto-mode to default-on.

Verification performed:

- `npm run test:cli`
- `node bin/csl-agent-kit.js install --yes --dry-run`
- `NO_COLOR=1 node bin/csl-agent-kit.js install --yes --dry-run`
- `npm run check:cli`
- `npm pack --dry-run --json`
- `git diff --check -- bin/csl-agent-kit.js tests/cli-install-output.test.js README.md tasks/lessons.md tasks/todo.md`

# Add Colors To NPM CLI Output

## Plan

- [x] Add regression tests for forced color and explicit no-color output.
- [x] Add terminal-aware ANSI colors without affecting alignment or JSON output.
- [x] Support `--color`, `--no-color`, and the `NO_COLOR` convention.
- [x] Update help and README documentation.
- [x] Run CLI tests, package checks, and diff verification.

## Review

Added dependency-free ANSI color output to `csl-agent-kit install`:

- Interactive TTY output automatically uses colors.
- Header and preview phase use cyan; success indicators and summaries use green; errors use red; skipped details use yellow; verbose details use dim text.
- Padding happens before color decoration, preserving column alignment.
- Added `--color` to force colors and `--no-color` to disable them.
- Automatic color mode respects `NO_COLOR` and disables colors for non-TTY output.
- `--json` remains valid, color-free JSON even when combined with `--color`.
- Updated CLI help and README.

TDD verification:

- RED: color tests failed because `--color` and `--no-color` were initially unknown.
- GREEN: all six CLI output tests pass.

Verification performed:

- `npm run test:cli`
- `node bin/csl-agent-kit.js install --all --dry-run --color`
- `node bin/csl-agent-kit.js install --help`
- `node --check bin/csl-agent-kit.js`
- `npm run check:cli`
- `npm pack --dry-run --json`
- `git diff --check -- bin/csl-agent-kit.js tests/cli-install-output.test.js package.json README.md tasks/todo.md`

Unresolved risk:

- ANSI support depends on the terminal; unsupported terminals can use `--no-color` or `NO_COLOR=1`.

# Beautify NPM CLI Install Output

## Plan

- [x] Add a CLI output regression test for concise integration-level summaries.
- [x] Aggregate symlink and command results by integration instead of printing every unchanged path.
- [x] Add `--verbose` for full path and command details.
- [x] Verify normal, verbose, JSON, dry-run, and package behavior.
- [x] Record review evidence and unresolved risks.

## Review

Root cause:

- The installer printed every low-level symlink and external command as first-class output, so unchanged paths overwhelmed the integration result.

Changes:

- Default output now prints one aligned summary row per integration.
- Symlinks and commands are aggregated into counts such as `2 links updated · 15 up to date`.
- Added `--verbose` / `-v` to expose full symlink paths and commands when debugging.
- Kept `--json` output unchanged for automation.
- Added `tests/cli-install-output.test.js` using Node's built-in test runner.
- Added `npm run test:cli` and included it in `npm run check:cli`.
- Updated README with the concise-default / verbose-details behavior.

Verification performed:

- RED: `npm run test:cli` failed against the old noisy output and missing `--verbose` option.
- GREEN: `npm run test:cli` passes both concise and verbose output tests.
- `node bin/csl-agent-kit.js install --all --dry-run`
- `node bin/csl-agent-kit.js install --all --dry-run --verbose`
- `node bin/csl-agent-kit.js install --all --dry-run --json`
- `node --check bin/csl-agent-kit.js`
- `bash -n scripts/install.sh`
- `git diff --check -- bin/csl-agent-kit.js tests/cli-install-output.test.js package.json README.md tasks/todo.md`

Unresolved risk:

- Terminal alignment assumes normal-width Latin integration titles; future CJK or ANSI-colored titles may need display-width-aware padding.

# NPM CLI Interactive Installer With Prompts

## Plan

- [x] Inspect current package shape and TypeScript CLI SOP constraints.
- [x] Add an npm `bin` CLI entry for `csl-agent-kit`.
- [x] Implement `csl-agent-kit install` with a `prompts` multiselect panel and non-interactive flags for tests/automation.
- [x] Reimplement install operations in Node instead of wrapping `scripts/install.sh`.
- [x] Update package metadata and README install docs.
- [x] Run syntax, JSON, dry-run, package, and diff verification; record review evidence.

## Review

Implemented a Node-based npm CLI installer:

- Added `bin/csl-agent-kit.js` with shebang and `csl-agent-kit install` command.
- Added `package.json` `bin` entry and `check:cli` script.
- Added `prompts` as a runtime dependency and generated `package-lock.json`.
- Added `node_modules/` to `.gitignore`.
- Replaced `scripts/install.sh` with a thin compatibility wrapper around the Node CLI.
- Updated README to make `csl-agent-kit install` the recommended installer.

CLI behavior:

- `csl-agent-kit install` opens a `prompts` multiselect panel for:
  - Cursor local plugin
  - Codex skills symlinks
  - Repo-local `.agents/skills` link
  - Codex plugin hooks
  - Pi package
- Non-interactive modes are available for tests/automation:
  - `csl-agent-kit install --yes`
  - `csl-agent-kit install --target cursor,codex-skills,repo-link`
  - `csl-agent-kit install --all --dry-run`
  - `csl-agent-kit install --all --json`
- Install operations are implemented in Node:
  - symlink creation for Cursor, Codex skills, and repo-local `.agents/skills`;
  - external command execution for `codex plugin ...` and `pi install ...` when selected;
  - `--dry-run` prevents filesystem and external command changes.

Verification performed:

- `npm install --package-lock-only`
- `npm install`
- `node --check bin/csl-agent-kit.js`
- `bash -n scripts/install.sh`
- `node -e "console.log(typeof require('prompts'))"`
- `node bin/csl-agent-kit.js install --yes --dry-run --json`
- `node bin/csl-agent-kit.js install --target cursor,codex-skills,repo-link --dry-run`
- `node bin/csl-agent-kit.js install --target codex-plugin,pi --dry-run --json`
- `node bin/csl-agent-kit.js install --help`
- `npm run check:cli`
- `./scripts/install.sh --yes --dry-run --json`
- `jq . package.json package-lock.json`
- `npm pack --dry-run --json`
- `rg` checks for stale `./scripts/install.sh <target>` install docs.
- `git diff --check -- bin/csl-agent-kit.js package.json package-lock.json README.md scripts/install.sh .gitignore tasks/todo.md`

Unresolved risks:

- Interactive UI itself was not manually exercised in this non-interactive harness, but `prompts` is installed and the non-interactive code paths are verified.
- External integrations still depend on installed and authenticated `codex` / `pi` CLIs when selected outside `--dry-run`.

# Rename Inject My Agents To Super Agent

## Plan

- [x] Rename `skills/inject-may-agents` to `skills/super-agent` and rename bundled `references/AGENTS.template.md` to `references/AGENTS.md`.
- [x] Rewrite the skill behavior so `super-agent` asks which agent config file to replace, backs up the old file, then symlinks the bundled default instructions.
- [x] Update skill metadata, README, plugin manifests, marketplace keywords, and Pi slash-command aliases from `inject-may-agents` to `super-agent`.
- [x] Run validation, stale-reference grep, package checks, and `yao-meta-skill` audit.
- [x] Record review evidence and unresolved risks.

## Review

Implemented `super-agent` as a replacement for `inject-may-agents`:

- Renamed `skills/inject-may-agents/` to `skills/super-agent/`.
- Renamed the bundled default instruction file from `references/AGENTS.template.md` to `references/AGENTS.md`.
- Rewrote `skills/super-agent/SKILL.md` so the skill:
  - asks which agent config file should be replaced;
  - treats `references/AGENTS.md` as the source of truth;
  - handles special target names such as Claude Code `CLAUDE.md` by asking instead of guessing;
  - shows source, target, backup path, and command plan before changing files;
  - backs up the old target as `{target}.backup-YYYYMMDD-HHMMSS`;
  - creates a symlink and verifies `readlink`.
- Updated `skills/super-agent/agents/openai.yaml` with the new display name and default prompt.
- Updated README and plugin/marketplace manifests from `inject-may-agents` to `super-agent`.
- Pi slash aliases are covered by the dynamic skill discovery in `pi/extensions/csl-skill-commands.ts`, so no hard-coded Pi entry needed changing.
- Updated `.gitignore` so `skills/super-agent/references/AGENTS.md` is visible even when a global gitignore ignores `AGENTS.md` files.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/super-agent`
- YAML parse for `skills/super-agent/agents/openai.yaml`
- `jq . package.json .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json >/dev/null`
- `bash -n scripts/install.sh`
- `npm pack --dry-run --json >/dev/null`
- Active-surface stale reference check: `rg -n "inject-may-agents|Inject My Agents|AGENTS\\.template|My agent-principles|My Agents|inject-may" README.md package.json .claude-plugin .cursor-plugin .codex-plugin .agents pi skills scripts tasks/lessons.md`
- Positive reference check for `super-agent`, `Super Agent`, and `references/AGENTS.md`.
- `git diff --check -- README.md .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json skills/super-agent skills/inject-may-agents pi/extensions/csl-skill-commands.ts .gitignore tasks/todo.md`
- `git status --short --untracked-files=all -- skills/super-agent skills/inject-may-agents .gitignore`

Yao audit:

- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/super-agent`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `super-agent`; lint, governance, and resource-boundary checks passed.
- Historical generated analysis docs still mention `inject-may-agents`; active docs, manifests, and skill files now use `super-agent`.

# Remove Legacy Compatibility From CSL Agent Kit Rename

## Plan

- [x] Remove `~/.ssbun-skills/` runtime fallback and migration code; use only `~/.csl-agent-kit/`.
- [x] Remove legacy `SSBUN_TIPS_DIR` / `SSBUN_TIPS_FILE` environment-variable fallbacks.
- [x] Rename plugin namespace/id surfaces from `CSL` to the short canonical `csl`, including README command examples and installer hints.
- [x] Update active docs and skill references for `/csl:<skill>` instead of `/CSL:<skill>`.
- [x] Run JSON, syntax, package, grep, and smoke-test verification; record results.

## Review

Removed the compatibility layer as requested:

- Removed `~/.ssbun-skills/` fallback and migration logic from active runtime scripts.
- Removed `SSBUN_TIPS_DIR` and `SSBUN_TIPS_FILE` fallbacks; scripts now use `CSL_AGENT_KIT_*` variables or `~/.csl-agent-kit/` defaults.
- Changed plugin IDs / namespaces to canonical short `csl` in Claude, Cursor, Codex, and `.agents` marketplace metadata.
- Updated README command examples from `/CSL:<skill>` to `/csl:<skill>` and install examples from `CSL@...` to `csl@...`.
- Updated `skills/figma-describe/SKILL.md` to reference `/csl:figma-describe`.
- Updated `tasks/lessons.md` with the rule that renames should not preserve legacy compatibility when the user says compatibility is not needed.

Verification performed:

- `bash -n scripts/install.sh skills/tips/scripts/tips-add.sh skills/tips/scripts/tips-inject.sh skills/tips/scripts/tips-doctor.sh skills/sop-manager/scripts/sop-summaries.sh`
- `node --check skills/sop-manager/scripts/sop-candidates.js`
- `jq . package.json .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json hooks/hooks.json .codex-plugin/hooks/hooks.json >/dev/null`
- `cmp -s hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `skills/tips/scripts/tips-inject.sh`
- `skills/tips/scripts/tips-doctor.sh`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `test ! -e "$HOME/.ssbun-skills" && test -d "$HOME/.csl-agent-kit"`
- `npm pack --dry-run --json >/dev/null`
- Active-surface stale compatibility grep: `rg -n "/CSL:|CSL@|csl@CSL|~/.cursor/plugins/local/CSL|\\.ssbun-skills|~/.ssbun-skills|SSBUN_TIPS|SSBUN|ssbun-skills|Renamed ~/.ssbun|legacy" README.md scripts hooks .codex-plugin/hooks skills .claude-plugin .cursor-plugin .codex-plugin .agents tasks/lessons.md`
- `git diff --check -- README.md scripts/install.sh skills/tips/scripts/tips-add.sh skills/tips/scripts/tips-inject.sh skills/tips/scripts/tips-doctor.sh skills/sop-manager/scripts/sop-summaries.sh skills/sop-manager/scripts/sop-candidates.js skills/figma-describe/SKILL.md .claude-plugin/plugin.json .cursor-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json tasks/lessons.md tasks/todo.md`

Yao audit:

- `quick_validate.py` passed for `skills/tips`, `skills/sop-manager`, and `skills/figma-describe`.
- `yao.py validate` still reports the pre-existing `Missing agents/interface.yaml` issue for those skills; lint, governance, and resource-boundary checks passed. `sop-manager` still has the existing heavy `SKILL.md` warning.

# CSL Agent Kit Local Data Directory Rename

## Plan

- [x] Update active docs and skill instructions from `~/.ssbun-skills/` to `~/.csl-agent-kit/`.
- [x] Update SOP and tips scripts to read/write the new local data directory, with safe legacy environment-variable fallback where useful.
- [x] Update hooks/status messages and release routing references to the new directory name.
- [x] Safely migrate existing local user data from `~/.ssbun-skills/` to `~/.csl-agent-kit/` without overwriting files.
- [x] Run syntax, JSON, grep, and smoke-test verification; record review evidence.

## Review

Renamed the CSL Agent Kit local user data directory:

- Active docs now use `~/.csl-agent-kit/`:
  - `README.md`
  - `skills/sop-manager/SKILL.md`
  - `skills/tips/SKILL.md`
  - `skills/release/SKILL.md`
- Runtime scripts now default to the new directory:
  - SOPs: `~/.csl-agent-kit/sops/`
  - Tips: `~/.csl-agent-kit/tips/tips.md`
- Legacy compatibility remains only in code paths that safely read/migrate old data:
  - `~/.ssbun-skills/` is treated as a legacy fallback for existing installs.
  - `SSBUN_TIPS_DIR` / `SSBUN_TIPS_FILE` are still accepted as legacy environment overrides.
- Hooks now show `CSL Agent Kit tips` instead of `SSBun tips`.
- Existing local user data was renamed on this machine from `/Users/caishilin/.ssbun-skills` to `/Users/caishilin/.csl-agent-kit`.

Verification performed:

- `bash -n scripts/install.sh skills/tips/scripts/tips-add.sh skills/tips/scripts/tips-inject.sh skills/tips/scripts/tips-doctor.sh skills/sop-manager/scripts/sop-summaries.sh`
- `node --check skills/sop-manager/scripts/sop-candidates.js`
- `jq . hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `cmp -s hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/release`
- `skills/tips/scripts/tips-inject.sh`
- `skills/tips/scripts/tips-doctor.sh`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `test -d "$HOME/.csl-agent-kit/sops" && test -s "$HOME/.csl-agent-kit/tips/tips.md" && test ! -e "$HOME/.ssbun-skills"`
- `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`
- `npm pack --dry-run --json`
- Active-doc stale path check: `rg -n "~/.ssbun-skills|\\.ssbun-skills|ssbun-skills|SSBun tips|Loading SSBun|Reloading SSBun" README.md hooks .codex-plugin/hooks skills/release skills/sop-manager/SKILL.md skills/tips/SKILL.md`
- `git diff --check -- README.md hooks/hooks.json .codex-plugin/hooks/hooks.json scripts/install.sh skills/tips/SKILL.md skills/tips/scripts/tips-add.sh skills/tips/scripts/tips-inject.sh skills/tips/scripts/tips-doctor.sh skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh skills/sop-manager/scripts/sop-candidates.js skills/release/SKILL.md tasks/lessons.md tasks/todo.md`

Yao audit:

- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/tips`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/release`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `tips`, `sop-manager`, and `release`; lint, governance, and resource boundary checks passed. `sop-manager` still has the existing heavy `SKILL.md` warning.
- Historical task logs and generated analysis reports may still mention `~/.ssbun-skills/` as historical context; active docs and runtime paths now use `~/.csl-agent-kit/`.

# CSL Agent Kit Renaming Execution

## Plan

- [x] Update package and plugin metadata from `CSL Skills` / `csl-skills` / skill-only wording to `CSL Agent Kit` / `csl-agent-kit` / toolkit wording.
- [x] Update README and install examples to use the new branding and repository path while preserving skill invocation compatibility.
- [x] Update installer output/comments to match the new project name.
- [x] Run JSON, script, package, stale-name, diff, and status verification.
- [x] Record review evidence and unresolved compatibility risks.

## Review

Renaming executed for the current project surfaces:

- `package.json`: package name is now `csl-agent-kit`; description and keywords describe a multi-client agent toolkit.
- `README.md`: title is now `CSL Agent Kit`; opening positioning covers skills, plugins, commands, hooks, and Pi extensions; install examples use `SSBun/agent-kit` and `CSL@SSBun-agent-kit`.
- Plugin metadata: Claude, Cursor, Codex, and `.agents` marketplace descriptions now use `CSL Agent Kit` / toolkit wording.
- `scripts/install.sh`: installer comment and Claude Code install hint now use the new Agent Kit name.

Compatibility choices:

- Kept plugin IDs / command namespace as `CSL` / `csl`, preserving `/CSL:<skill>` invocations and `codex plugin add csl@CSL` behavior.
- Kept the standard `skills/` directory and individual skill names unchanged.
- Kept `~/.ssbun-skills/` user data paths unchanged to avoid breaking existing SOP and tips storage.

Verification performed:

- `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`
- `jq . .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json >/dev/null`
- `bash -n scripts/install.sh`
- `npm pack --dry-run --json`
- `rg -n "CSL Skills|csl-skills|SSBun/skills|SSBun-skills|Agent skill collection" README.md package.json .claude-plugin .cursor-plugin .codex-plugin .agents scripts pi docs commands hooks`
- `git diff --check -- package.json README.md .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json scripts/install.sh tasks/todo.md`
- `git status --short --untracked-files=all`

Unresolved risks:

- GitHub repository rename to `SSBun/agent-kit` still needs to happen outside this code edit, or install examples will depend on that future path existing.
- Some repository files are already dirty from unrelated work; this task only changed the naming surfaces listed above plus this task record.

# Task File Newest-First Rule

## Plan

- [x] Add a local `AGENTS.md` rule requiring newest-first ordering for `tasks/todo.md` and `tasks/lessons.md` entries.
- [x] Record this user correction in `tasks/lessons.md`, inserted at the top for readability.
- [x] Verify formatting and run the required `yao-meta-skill` audit because `AGENTS.md` changes.
- [x] Update this task entry with review evidence.

## Review

- Added `AGENTS.md` guidance that new `tasks/todo.md` and `tasks/lessons.md` entries must be inserted directly under the file title.
- Added the correction as the newest lesson: `2026-07-09 Task Files Newest First`.
- Inserted this task entry at the top of `tasks/todo.md`, following the new rule.

Verification performed:

- Read `AGENTS.md`, `tasks/lessons.md`, and `tasks/todo.md` to confirm newest-first placement.
- Python assertion confirmed `tasks/todo.md` starts with `# Task File Newest-First Rule` and `tasks/lessons.md` first lesson is `2026-07-09 Task Files Newest First`.
- `git diff --check -- AGENTS.md tasks/lessons.md tasks/todo.md`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py adapt-scan /Users/caishilin/Desktop/personal/skills --source AGENTS.md --min-support 1 --output-json <tmp>/agents-adapt-scan.json --output-md <tmp>/agents-adapt-scan.md`
- Confirmed temporary `reports/user_patterns.*` files from an earlier audit attempt were removed.

Note:

- `yao.py validate .` was attempted first, but it is not suitable for the repository root because the root has no `SKILL.md` or `agents/interface.yaml`; no root validation issue was introduced by this change.

# Current Skills Audit

## Plan

- [x] Inventory repository structure and current skill manifests.
- [x] Review existing lessons and project documentation.
- [x] Audit skill files for structure, trigger clarity, safety rules, and maintainability.
- [x] Check supporting scripts, commands, and docs for broken references or drift.
- [x] Write findings and recommendations to `docs/analysis/current-skills-audit.md`.
- [x] Add a review section with verification evidence.

## Review

Report created: `docs/analysis/current-skills-audit.md`

Verification performed:

- `find skills -maxdepth 2 -type f -name SKILL.md`
- `find . -maxdepth 3 -type f -print`
- `git status --short --untracked-files=all`
- `bash -n scripts/install.sh`
- `jq . .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json`
- Checked `analyze-project` prompt references to templates and `docs/analysis` output paths.

Top findings:

- `handoff-restore` has a contradictory existing-file branch.
- `venom-cli` classifies `gen-asset-code` as read-only even though it generates code.
- `beautiful-mermaid` and `venom-cli` instruct global npm installs without explicit approval.
- `code-reviewer` reference docs still contain placeholder content.
- `scripts/install.sh` needs safer symlink target checks.

# Current Skills Optimization Plan

## Plan

- [x] Re-read the audit report and existing task records.
- [x] Group all findings into implementation phases.
- [x] Write a complete optimization plan with acceptance criteria.
- [x] Add verification commands and manual review checklist.
- [x] Verify the plan document and workspace status.

## Review

Plan created: `docs/analysis/current-skills-optimization-plan.md`

The plan covers all 18 audit findings across four phases:

- Phase 1: Safety and workflow correctness.
- Phase 2: Installer and CI hardening.
- Phase 3: Skill content quality.
- Phase 4: Documentation and platform alignment.

Verification performed:

- Read `docs/analysis/current-skills-optimization-plan.md`.
- Confirmed 18 numbered optimization items with `rg -n "^### [0-9]+\\."`.
- Checked workspace status with `git status --short --untracked-files=all`.

# Current Skills Optimization Implementation

## Plan

- [x] Split implementation into disjoint file groups for subagents.
- [x] Fix safety and workflow skill issues.
- [x] Harden installer, ignore policy, and CI validation.
- [x] Replace placeholder review references and tune interaction skills.
- [x] Align platform command/spec documentation.
- [x] Run verification commands from the optimization plan.
- [x] Review workspace status and summarize changed files.

## Review

Implementation completed across four file groups:

- Safety/workflow skills: `handoff-restore`, `venom-cli`, `beautiful-mermaid`, `release`, `handoff-save`, `sop-manager`.
- Installer/CI: `scripts/install.sh`, `.gitignore`, `.github/workflows/validate.yml`, `README.md`.
- Skill content quality: `code-reviewer` references, `same-page`, `brainstorming`, `figma-describe`.
- Platform docs: `commands/sop-activate.md`, `docs/superpowers/specs/2026-06-04-figma-describe-design.md`.

Verification performed:

- `bash -n scripts/install.sh`
- `git diff --check`
- `jq .` across all plugin and marketplace manifests
- Skill frontmatter validation loop from CI
- Command frontmatter validation loop from CI
- Analyze-project prompt docs path validation loop from CI
- Source keyword scan for removed unsafe/stale patterns
- `git status --short --untracked-files=all`

# SOP Routing Index

## Plan

- [x] Create a lightweight built-in SOP index under `skills/sop-manager/sops/`.
- [x] Add a plugin `SessionStart` hook that points procedural work to the index.
- [x] Update `sop-manager` lookup guidance to read the built-in index before individual built-in SOPs.
- [x] Verify index references and workspace status.

## Review

Created a lightweight frontmatter summary router for built-in SOPs.

Added SOP routing to `hooks/hooks.json` as a `SessionStart` hook:

- Do not read SOP files by default.
- For procedural work only, consult SOP summaries from frontmatter.
- Do not read unrelated SOP files.

Updated `skills/sop-manager/SKILL.md` so built-in SOP lookup reads the index first.

Verification performed:

- Read `hooks/hooks.json`.
- Read SOP frontmatter summaries.
- Checked index references with `rg`.
- Verified referenced SOP files exist.
- Checked `git status --short --untracked-files=all`.

# Figma Describe Hook

## Plan

- [x] Add a Codex `SessionStart` lifecycle hook for CSL SOP routing.
- [x] Add a Codex `PostToolUse` lifecycle hook for Figma/MasterGo design-fetch MCP tools.
- [x] Document `hooks/` in the repository layout.
- [x] Verify hook JSON, matcher coverage, and workspace status.

## Review

Added `hooks/hooks.json` with a `SessionStart` hook that injects the SOP routing prompt when the plugin loads in a Codex session.

Added `hooks/hooks.json` with a `PostToolUse` hook for Figma/MasterGo design-fetch MCP tools. The hook prints a mandatory reminder to use `figma-describe` before implementation, summary, or UI translation.

Updated `README.md` to document `hooks/` as bundled Codex lifecycle hooks.

Verification performed:

- `jq . hooks/hooks.json`
- Executed the `SessionStart` and `PostToolUse` hook commands extracted from `hooks/hooks.json`
- Tested matcher coverage against representative Figma and MasterGo MCP tool names
- Checked SOP and Figma routing references with `rg`
- Checked workspace status
# SOP Manager Dynamic User SOPs

## Plan

- [x] Rename `sop-creator` to `sop-manager` in the skill and docs.
- [x] Define `sop-manager list`, `create`, and `see` behavior in the skill.
- [x] Standardize SOP frontmatter on `name` and `description`.
- [x] Add a hook script that summarizes built-in SOPs and `~/.ssbun-skills/sops/*.md`.
- [x] Update `SessionStart` hook to run the summary script.
- [x] Verify JSON, script output, references, and workspace status.

## Review

- Renamed the skill to `sop-manager` and updated plugin manifests, README, Claude command docs, and analysis references.
- Replaced the old built-in SOP index with per-SOP YAML frontmatter summaries.
- Added `skills/sop-manager/scripts/sop-summaries.sh` to summarize built-in SOPs and user SOPs under `~/.ssbun-skills/sops/*.md`.
- Updated the Codex `SessionStart` hook to run the summary script, with a minimal fallback if the script is not found.
- Updated `scripts/install.sh` to remove the old Codex `sop-creator` symlink during install.

Verification performed:

- `jq . hooks/hooks.json .codex-plugin/plugin.json .claude-plugin/plugin.json .cursor-plugin/plugin.json .agents/plugins/marketplace.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json`
- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `bash -n scripts/install.sh`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `jq -r '.hooks.SessionStart[0].hooks[0].command' hooks/hooks.json | sh`
- Temporary `HOME` test with `~/.ssbun-skills/sops/release-hotfix.md`
- `rg` check for stale `sop-creator`, `skills/sop-creator`, `INDEX.md`, and `~/.agents/sops` references in active files
- `git status --short --untracked-files=all`
# SOP Manager Lessons

## Plan

- [x] Add `sop-manager learn` behavior for reusable mistake/lesson capture.
- [x] Extend SOP templates with a lessons section.
- [x] Record the user correction in `tasks/lessons.md`.
- [x] Verify the updated skill text.

## Review

- Added `sop-manager learn` for reusable mistake/lesson capture.
- Added `## Lessons` to the SOP creation template.
- Defined companion user SOPs like `~/.ssbun-skills/sops/{built-in-name}-lessons.md` for lessons related to built-in SOPs, so built-in SOP files are not modified or shadowed.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `rg` check for `sop-manager learn`, `## Lessons`, and companion lesson references.
- Read the updated `sop-manager` command section.
- `git diff --check`
# Rewrite Swift API Design SOP

## Plan

- [x] Rewrite `skills/sop-manager/sops/swift-api-design.md` against the official Swift API Design Guidelines.
- [x] Remove rules not present in that official guideline from this SOP.
- [x] Remove the built-in Google Swift style SOP so only the Swift API design SOP remains.
- [x] Add `PostCompact` SOP summary reload and `PreToolUse` SOP reminder hooks.
- [x] Verify frontmatter, hook summary output, and diff.

## Review

- Rewrote `swift-api-design` as a Chinese SOP based on the official Swift API Design Guidelines.
- Removed the `#fileID/#filePath/#file` production/test-helper rule because it is not part of that official API design page.
- Removed `swift-google-style` from built-in SOPs.
- Added `PostCompact` to reload SOP summaries after compaction and `PreToolUse` to remind the agent to check matching SOPs before procedural tool use.
- Added missing guidance for introduction-level intent, documentation summaries, associated type role naming, fluent-usage limits, mutating/nonmutating naming details, argument-label exceptions, tuple/closure names, and unconstrained polymorphism.

Verification performed:

- `skills/sop-manager/scripts/sop-summaries.sh | rg -n 'swift-api-design|Swift API|用于设计'`
- `rg -n "swift-google-style|Google Swift" -S .`
- `rg -n '#fileID|#filePath|#file\\b|Last Updated|version: 1.1|description:' skills/sop-manager/sops/swift-api-design.md`
- `jq . hooks/hooks.json`
- Executed `SessionStart`, `PostCompact`, and `PreToolUse` hook commands from `hooks/hooks.json`
- `git diff --stat`

# Inject May Agents Skill

## Plan

- [x] Create `skills/inject-may-agents` with a copied AGENTS template.
- [x] Write the skill workflow for explicit invocation only.
- [x] Require final proposed AGENTS.md content to be shown before writing.
- [x] Validate skill metadata and check references.
- [x] Add a review section with verification evidence.

## Review

- Added `skills/inject-may-agents/SKILL.md`.
- Added `skills/inject-may-agents/references/AGENTS.template.md`, copied from the current English `AGENTS.md`.
- Added `skills/inject-may-agents/agents/openai.yaml` with implicit invocation disabled.
- Updated `README.md` and plugin manifests with the new skill and install count.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/inject-may-agents`
- `cmp -s skills/inject-may-agents/references/AGENTS.template.md /Users/caishilin/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_6iu30dwhwv3r22_a1e7/msg/file/2026-06/AGENTS.md`
- `rg -n "inject-may-agents|17 skills" README.md skills/inject-may-agents`
- `jq . .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json`
- `rg -n "inject-may-agents" README.md skills/inject-may-agents .claude-plugin .cursor-plugin .codex-plugin .agents/plugins`
- `git diff --check`
- `git status --short --untracked-files=all`

# Yao Meta Skill Portfolio Audit

## Plan

- [x] Inventory all `skills/*/SKILL.md` packages in this repository.
- [x] Run Yao portfolio and per-skill validation checks.
- [x] Inspect resource boundaries, trigger descriptions, manifests, and safety issues.
- [x] Write a Chinese audit report under `docs/analysis/`.
- [x] Record verification evidence and remaining risks.

## Review

- Created `docs/analysis/yao-meta-skill-portfolio-audit.md`.
- Generated Yao Skill Atlas artifacts under `docs/analysis/yao-meta-skill-audit/`.
- Audited 17 skills for route collisions, OpenAI schema compatibility, Yao validation, resource boundary size, trust/safety signals, manifest coverage, and high-risk command patterns.
- Cleaned unintended per-skill `reports/security_trust_report.*` files generated by `yao.py trust`; only the centralized audit artifacts remain.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py skill-atlas --workspace-root /Users/caishilin/Desktop/personal/skills --output-dir /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit --report-json /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit/skill-atlas.json --report-html /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit/skill-atlas.html --today 2026-07-03`
- Per-skill `yao.py validate`
- Per-skill `resource_boundary_check.py`
- Per-skill OpenAI `quick_validate.py`
- Safety keyword scan with `rg`
- `jq` summary checks for Atlas outputs
- `git diff --check`

# Yao Meta Skill Audit Fixes

## Plan

- [x] Mark Yao metadata gaps as release-only gates instead of normal platform blockers.
- [x] Remove unsupported `argument-hint` frontmatter and preserve usage hints in skill bodies.
- [x] Reduce over-budget `SKILL.md` entrypoints by moving detail into references.
- [x] Remove duplicated `beautiful-mermaid` install instructions.
- [x] Regenerate audit artifacts and verify OpenAI/Yao checks.

## Review

- Added `skill_atlas/policy.json` so Yao interface/governance metadata gaps are tracked as release-only gates for this OpenAI/Codex-first skill collection.
- Removed all unsupported `argument-hint` frontmatter keys and kept usage hints in skill bodies.
- Reduced over-budget entrypoints by moving detailed workflow/format material into `references/` for `analyze-project`, `repo-map`, `same-page`, `figma-describe`, and `handoff-save`.
- Removed the duplicated global install block from `beautiful-mermaid`; also removed duplicate setup install text from `venom-cli`.
- Refreshed Yao Skill Atlas artifacts under `docs/analysis/yao-meta-skill-audit/` and updated the audit report with post-fix status.

Verification performed:

- `rg -n "^argument-hint:" skills/*/SKILL.md`
- Per-skill OpenAI `quick_validate.py`
- Per-skill Yao `resource_boundary_check.py`
- Yao `skill-atlas` regeneration with `--today 2026-07-03`
- Yao `validate` summary confirmed only `Missing agents/interface.yaml`, now release-only

# Yao Meta Skill Optimization Reanalysis

## Plan

- [x] Re-run Yao Atlas across all skills.
- [x] Re-run OpenAI schema and Yao resource-boundary checks.
- [x] Scan skill content for remaining optimization opportunities.
- [x] Write a concise optimization report under `docs/analysis/`.
- [x] Record verification evidence.

## Review

- Created `/Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-optimization-opportunities-2026-07-03.md`.
- Confirmed no hard failures in OpenAI schema validation, Yao resource-boundary validation, or Yao Atlas route/resource checks.
- Identified remaining optimization opportunities: `sop-manager`, `venom-cli`, and `test-triage` are close to the 1000-token production budget; Yao governance metadata remains release-only; optional trigger evals could cover near-neighbor routing groups.

Verification performed:

- Yao `skill-atlas` regeneration with `--today 2026-07-03`
- Per-skill OpenAI `quick_validate.py`
- Per-skill Yao `resource_boundary_check.py`
- Content scan for `argument-hint`, platform-specific prompt-tool references, placeholders, and stale markers

# Release Skill Routing


## Plan

- [x] Replace the broad release skill with a thin release-orchestrator router.
- [x] Remove ecosystem-specific publish commands from the release skill.
- [x] Add built-in `release-orchestrator` SOP.
- [x] Make user SOPs override same-named built-in SOP summaries.
- [x] Remove built-in `npm-publish-tool-or-native-app` and keep it user-defined under `~/.ssbun-skills/sops`.
- [x] Update README wording for the release skill.
- [x] Verify release skill no longer contains direct publish commands.

## Review

- Replaced the broad cross-ecosystem release skill with a thin release-orchestrator.
- Removed direct npm/PyPI/Cargo/Xcode/Homebrew/CocoaPods publish commands from the release skill.
- Added built-in release routing while keeping the npm publish SOP user-defined under `~/.ssbun-skills/sops`.
- Updated the SOP summary script so `~/.ssbun-skills/sops/{name}.md` overrides same-named built-in SOP summaries.
- Updated README release description to say it routes release work to matching SOPs.

Verification performed:

- `rg -n "npm publish|twine upload|cargo publish|pod trunk|agvtool|git push|git tag|Bump version|walk through publishing|publishing itself" skills/release/SKILL.md README.md`
- Read `skills/release/SKILL.md`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `test ! -e skills/sop-manager/sops/npm-publish-tool-or-native-app.md`

# Internet Research: Popular Agents and Skills

## Plan

- [x] Research popular coding agents, agent frameworks, and skill/plugin ecosystems from current public internet sources.
- [x] Compare repeated capability patterns across those agents.
- [x] Write a Chinese report under `docs/analysis/` with source links and recommendations.
- [x] Verify the report file, links/source coverage, and workspace diff.

## Review

- Created `docs/analysis/popular-agents-and-skills-report.md`.
- Compared popular coding agents and agent frameworks using GitHub metadata collected on 2026-06-25.
- Identified high-frequency skill categories: repo understanding, file/shell/test loop, test triage, dependency docs, browser UI verification, code/security review, GitHub workflow, MCP/connectors, release gates, and handoff/SOP.
- Recommended highest-impact coding power additions: `test-triage`, `repo-map`, `dependency-docs`, `browser-ui-verify`, `security-review`, and release-gate SOPs.

Verification performed:

- Read the generated report.
- `rg -n 'https://|test-triage|repo-map|dependency-docs|browser-ui-verify|security-review|release-gate' docs/analysis/popular-agents-and-skills-report.md`
- `git diff --check`
- `git status --short --branch --untracked-files=all`

# Initial Test Triage Skill

## Plan

- [x] Define what `test-triage` does and when it should trigger.
- [x] Create `skills/test-triage/SKILL.md` with a minimal diagnostic workflow.
- [x] Add `test-triage` to the README skill table.
- [x] Validate skill frontmatter and workspace diff.

## Review

- Added `skills/test-triage/SKILL.md`.
- Defined the skill as a reproduce -> diagnose -> fix -> verify loop for failing tests, CI failures, runtime errors, flaky behavior, regressions, and bug reports.
- Updated `README.md` with the new skill and corrected the global install count to 14 skills.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/test-triage`
- `rg -n '13 skills|14 skills|test-triage' README.md skills/test-triage/SKILL.md tasks/todo.md`
- `git diff --check`
- Full `quick_validate.py` across all existing skills was attempted but stops on pre-existing `skills/analyze-project` frontmatter key `argument-hint`; this is outside the new `test-triage` change.

# Test Triage Skill Subagent Audit

## Plan

- [x] Spawn an independent subagent to audit `skills/test-triage/SKILL.md`.
- [x] Review the audit findings.
- [x] Apply focused fixes if the audit identifies actionable issues.
- [x] Re-run validation and document the outcome.

## Review

Subagent verdict: minor edits, no blocker.

Changes made from audit:

- Narrowed the frontmatter trigger by removing generic focused-verification language.
- Added common trigger terms: red builds, pipeline failures, crashes, exceptions, stack traces, and timeouts.
- Added runtime bug reproduction paths before patching and before final verification.
- Moved practical regression-test creation before production-code changes.
- Changed multiple-failure handling from immediate stop to grouping and selecting the highest-signal first failure before escalating broad cleanup.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/test-triage`
- `rg -n 'focused verification|red builds|pipeline failures|crashes|exceptions|stack traces|timeouts|original failure path|regression test|highest-signal' skills/test-triage/SKILL.md tasks/todo.md`
- `git diff --check`

# Initial Repo Map Skill

## Plan

- [x] Define `repo-map` as a lightweight pre-exploration skill for unknown repositories or unfamiliar modules.
- [x] Include optional CodeGraph indexing/query workflow with `rg`/manifest fallback.
- [x] Emphasize key types/classes, responsibilities, entry points, and call/impact relationships.
- [x] Add `repo-map` to the README skill table and install count.
- [x] Validate the new skill and record verification.

## Review

- Added `skills/repo-map/SKILL.md`.
- Designed `repo-map` to run before broad exploration of an unknown repository or unfamiliar module.
- Made key types/classes the center of the output: role, collaborators, owned state, effects, tests, and relationships.
- Added optional CodeGraph flow using `codegraph init`, `sync`, `status`, `files`, `query`, `callers`, `callees`, and `impact`, with `rg`/manifest fallback.
- Updated `README.md` with `repo-map` and corrected the install count to 15 skills.

Verification performed:

- `command -v codegraph`
- `codegraph --help`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n '13 skills|14 skills|15 skills|repo-map|codegraph (init|sync|status|files|query|callers|callees|impact|uninit)' README.md skills/repo-map/SKILL.md tasks/todo.md`
- `git diff --check`

# Repo Map Glossary Correction

## Plan

- [x] Update `repo-map` so it produces a project glossary, not only a structural map.
- [x] Make glossary evidence-backed and focused on preventing user-agent terminology gaps.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill.

## Review

- Updated `skills/repo-map/SKILL.md` so its required output has both `Project Glossary` and `Working Map`.
- Glossary entries now cover domain terms, code terms, project-specific meaning, confusing nearby terms, and evidence source.
- Workflow now collects repeated domain words and builds an evidence-backed glossary before tracing relationships.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'glossary|Glossary|shared vocabulary|understanding gaps|Not the same as|Source|Unknown|domain terms|code terms|基础 glossary|理解偏差' skills/repo-map/SKILL.md tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Multi-Repo Root Detection

## Plan

- [x] Update `repo-map` to detect whether the working folder is a git repo.
- [x] Add child git repository detection when the working folder is only a container.
- [x] Require separate maps/glossaries per child repository.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill.

## Review

- Updated `skills/repo-map/SKILL.md` with a `Resolve project roots` first step.
- The skill now runs `git rev-parse --show-toplevel` to detect a root repo.
- If the working folder is not a git repo, it checks immediate child folders for `.git` and maps each child repository separately.
- CodeGraph usage is now scoped per project root instead of indexing a parent folder containing unrelated repos.
- Recorded the multi-repo correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'git rev-parse|show-toplevel|child git|child folders|separate|separately|project root|project roots|multi|多个项目|子 repo|git repo' skills/repo-map/SKILL.md tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Example Format

## Plan

- [x] Add a repo-map example markdown file as a reference resource.
- [x] Link the example from `skills/repo-map/SKILL.md`.
- [x] Make clear that example facts must not be copied into target reports.
- [x] Validate the skill and reference.

## Review

- Added `skills/repo-map/references/repo-map-web-example.md`.
- Linked the example from `skills/repo-map/SKILL.md` for saved report output or unclear format cases.
- The example includes `Project Glossary`, `Working Map`, and `Confidence`.
- The skill explicitly says not to copy example facts into target reports.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `test -f skills/repo-map/references/repo-map-web-example.md`
- `rg -n 'repo-map-web-example.md|docs/analysis/repo-map.md|Project Glossary|Working Map|Confidence|do not copy example facts' skills/repo-map/SKILL.md skills/repo-map/references/repo-map-web-example.md`
- `git diff --check`

# Repo Map Project-Specific Formats

## Plan

- [x] Update `repo-map` so it chooses report format by project kind.
- [x] Add an iOS/native repo-map example.
- [x] Keep the generic example for non-native or unclear project types.
- [x] Record the project-specific format lesson.
- [x] Validate the updated skill and examples.

## Review

- Updated `skills/repo-map/SKILL.md` to identify project kind before choosing the output format.
- Added `skills/repo-map/references/repo-map-apple-example.md`.
- Kept `repo-map-web-example.md` as the web-specific format.
- The iOS/native example now focuses on app targets, Swift modules, app entry, navigation, SwiftUI state, key types, persistence/networking boundaries, and XCTest hooks.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `test -f skills/repo-map/references/repo-map-apple-example.md`
- `rg -n 'repo-map-apple-example.md|iOS|macOS|SwiftUI|UIKit|AppKit|XCTest|Project kind|App Targets And Modules|App Entry And Navigation|State And Data Flow|Persistence, Networking, And Side Effects|project kind|web/backend|项目类型|apple' skills/repo-map/SKILL.md skills/repo-map/references/repo-map-apple-example.md tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Four Project Kinds

## Plan

- [x] Restrict repo-map format kinds to web, backend, apple, and android.
- [x] Rename the generic example into a web example.
- [x] Rename the iOS/native example into an apple example.
- [x] Add backend and Android examples.
- [x] Update lessons to reflect the four supported kinds.
- [x] Validate all repo-map references.

## Review

- Restricted repo-map format kinds to exactly four: web, backend, apple, and android.
- Renamed the original generic/web example to `repo-map-web-example.md`.
- Renamed the iOS/native example to `repo-map-apple-example.md`.
- Added `repo-map-backend-example.md` and `repo-map-android-example.md`.
- Updated `skills/repo-map/SKILL.md` to select only among those four references.
- Updated `tasks/lessons.md` with the four-kind rule.

Verification performed:

- `find skills/repo-map/references -maxdepth 1 -type f -print | sort`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'repo-map-example|repo-map-ios-native|repo-map-web-example|repo-map-backend-example|repo-map-apple-example|repo-map-android-example|web, backend, apple, or android|四类|Android|Gradle|Activity|XCTest' skills/repo-map tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Deep Concepts Only

## Plan

- [x] Remove obvious inventory from repo-map output guidance.
- [x] Rewrite all four examples around business concepts, core logic modules, key type effects, business flows, relevance filters, and verification hooks.
- [x] Keep implementation details summarized rather than expanded.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill and references.

## Review

- Updated `skills/repo-map/SKILL.md` to reject obvious inventory in final output unless it explains business boundaries.
- Removed `Scope` and `Project Shape` style metadata from all four repo-map examples.
- Reworked all examples to focus on deep concepts: glossary, core concepts, core logic modules, key type effects, business flows, relevance filters, change targets, and verification hooks.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n '^## Scope|^### Project Shape|Language:|Framework:|Project:|Root:|Generated:|Project kind:' skills/repo-map/references/*.md`
- `rg -n 'Core Concepts|Core Logic Modules|Key Type Effects|Business Flows|Relevance Filter|Verification Hooks|obvious inventory|implementation detail|Deep Concepts Only|项目名|语言|框架|核心类型影响|无关区域' skills/repo-map tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Remove Question List

## Plan

- [x] Remove the default question-list section from all repo-map examples.
- [x] Update task records that described that section as part of the format.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the references.

## Review

- Removed the default question-list section from all four repo-map reference examples.
- Updated historical task wording so it no longer describes that section as part of the repo-map format.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- no-residual search for the removed question-list heading across `skills/repo-map`, `tasks/todo.md`, and `tasks/lessons.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `git diff --check`

# Repo Map Component Summary

## Plan

- [x] Add a concise component summary requirement to `repo-map`.
- [x] Update all repo-map format examples to include the summary.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill and references.

## Review

- Added `Component Summary` before `Project Glossary` in the repo-map output guidance.
- Updated all four reference examples to include a concise product/business responsibility summary.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'Component Summary|component summary|组件摘要|Repo Map Component Summary' skills/repo-map tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Objective Structure

## Plan

- [x] Remove subjective/audit-style sections from the repo-map skill.
- [x] Update repo-map examples to show objective structure, modules, and key types.
- [x] Rewrite the generated `ZHShortStory` repo-map file in the objective format.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the skill, examples, and generated file.

## Review

- Updated `skills/repo-map/SKILL.md` so repo-map outputs objective structure only: component summary, glossary, file structure, modules, key types, and core flows.
- Rewrote all four repo-map reference examples to remove `Risk`, `Confidence`, `Relevance Filter`, `Change Targets`, and `Verification Hooks`.
- Rewrote `ZHShortStory/docs/analysis/repo-map.md` in the objective format.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'Risk|risk|Confidence|confidence|Relevance Filter|Change Targets|Verification Hooks|Why It Matters|Open Questions|open questions|audit|审计|风险|置信|建议|问题清单' skills/repo-map /Users/caishilin/Documents/SharkSpace/native-short-reader/ZHShortStory/docs/analysis/repo-map.md tasks/lessons.md`
- `rg -n '^## Component Summary|^## Project Glossary|^## Working Map|^### File Structure|^### Modules|^### Key Types|^### Core Flows' /Users/caishilin/Documents/SharkSpace/native-short-reader/ZHShortStory/docs/analysis/repo-map.md skills/repo-map/references/*.md`
- `git diff --check`
- `git diff --check -- docs/analysis/repo-map.md`

# SOP Create English Output (Superseded)

## Plan

- [x] 曾尝试在 `sop-manager create` 指令中加入 SOP 文件正文语言规则。
- [x] 保持模板结构不变，只补充语言约束，避免扩大改动。
- [x] 用搜索和 diff 校验规则位置与格式。

## Review

- 已被后续 “Remove SOP Create Language Limit” 撤销。
- 原因：用户明确纠正主流程描述可以使用任意语言，不应限制整份 SOP 文件语言。

Verification performed:

- `rg -n 'frontmatter 的 \`description\`|SOP Create English Output' skills/sop-manager/SKILL.md tasks/todo.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- skills/sop-manager/SKILL.md tasks/todo.md`

# SSBun SOP Storage

## Plan

- [x] Move user SOP storage into the SSBun-owned local folder: `~/.ssbun-skills/sops`.
- [x] Update SOP lookup, create, learn, see, release, hook, and script path references.
- [x] Record the naming correction for short preferences as tips, not rules.
- [x] Test the updated skill, script, hook command, and path searches.

## Review

- Updated `sop-manager` create/list/learn/see guidance to use `~/.ssbun-skills/sops`.
- Updated `sop-summaries.sh`, `release`, and `release-orchestrator` to resolve user SOPs from the new folder.
- Updated hooks to prefer `~/.ssbun-skills/skills/sop-manager/scripts/sop-summaries.sh`, with existing fallback paths preserved.
- Updated `scripts/install.sh` so Codex installs also create `~/.ssbun-skills/skills/{name}` symlinks.
- Documented user-created SOP storage in `README.md`.
- Removed the invalid `argument-hint` frontmatter key from `skills/release/SKILL.md` after validation exposed it.
- Recorded the tips naming correction in `tasks/lessons.md`.

Verification performed:

- `bash -n skills/sop-manager/scripts/sop-summaries.sh scripts/install.sh`
- `jq . hooks/hooks.json`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/release`
- Temporary `HOME` test with `~/.ssbun-skills/sops/release-orchestrator.md`
- Executed the `SessionStart` hook command from `hooks/hooks.json`
- No-residual search for legacy user SOP path
- `git diff --check`

# Tips Skill

## Plan

- [x] Create the `tips` skill with minimal add/list/edit guidance.
- [x] Store user tips under `~/.ssbun-skills/tips/tips.md`.
- [x] Add scripts to append tips and inject tips into session context.
- [x] Add hooks for session start/new/resume/clear/compact and post-compact injection.
- [x] Update install/docs and verify scripts, hooks, and skill metadata.

## Review

- Added `skills/tips/SKILL.md` and `skills/tips/agents/openai.yaml`.
- Added `skills/tips/scripts/tips-add.sh` to append one short tip to `~/.ssbun-skills/tips/tips.md`.
- Added `skills/tips/scripts/tips-inject.sh` to inject stored tips into session context.
- Updated `hooks/hooks.json` so tips inject before SOP summaries on `SessionStart` (`startup|resume|clear|compact|new`) and before SOP reload on `PostCompact`.
- Updated README and plugin manifests to include `tips`.

Verification performed:

- `bash -n skills/tips/scripts/tips-add.sh skills/tips/scripts/tips-inject.sh scripts/install.sh`
- `jq .` for hook and plugin JSON files
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- Temporary `HOME` test for `tips-add.sh` and `tips-inject.sh`
- Temporary `HOME` tests for `SessionStart` and `PostCompact` tips hook commands
- Hook order check: tips runs before SOP summary/reload
- `git diff --check`

# Tips Length Guard

## Plan

- [x] Add a length guard before `tips-add.sh` writes a tip.
- [x] Document the maximum tip length in `skills/tips/SKILL.md`.
- [x] Verify accepted and rejected tips do the right thing.

## Review

- Added a 240-character guard to `skills/tips/scripts/tips-add.sh`.
- The guard runs before directory/file creation, so rejected tips do not write anything.
- Documented the 240-character limit in `skills/tips/SKILL.md`.

Verification performed:

- `bash -n skills/tips/scripts/tips-add.sh`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- Temporary `HOME` test: short tip is saved and injected.
- Temporary `HOME` test: 241-character tip is rejected and no tips file is created.

# Tips Confirmation Guard

## Plan

- [x] Require explicit confirmation before any tip write.
- [x] Update `tips-add.sh` so old direct calls fail without `--confirmed`.
- [x] Document the show-then-ask workflow in `skills/tips/SKILL.md`.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Verify confirmed writes, unconfirmed rejection, and validation.

## Review

- Updated `tips-add.sh` to require `--confirmed` before writing.
- Updated `skills/tips/SKILL.md` to require showing the exact tip and waiting for explicit user confirmation.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `bash -n skills/tips/scripts/tips-add.sh`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- Temporary `HOME` test: unconfirmed write is rejected and no tips file is created.
- Temporary `HOME` test: confirmed short tip is saved and injected.
- Temporary `HOME` test: confirmed 241-character tip is rejected and no tips file is created.

# Tips Agents Metadata Removal

## Plan

- [x] Remove optional `skills/tips/agents/` metadata.
- [x] Verify the `tips` skill still validates and scripts remain present.

## Review

- Removed `skills/tips/agents/openai.yaml`.
- `tips` now contains only `SKILL.md` and the two scripts it needs.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- `find skills/tips -maxdepth 3 -type f`

# SOP Files Audit

## Plan

- [x] Identify built-in, current user, and legacy user SOP files.
- [x] Read every discovered SOP file.
- [x] Check frontmatter, trigger visibility, path consistency, and referenced SOP availability.
- [x] Report findings without modifying SOP behavior.

## Review

- Audited built-in SOPs:
  - `/Users/caishilin/Desktop/personal/skills/skills/sop-manager/sops/release-orchestrator.md`
  - `/Users/caishilin/Desktop/personal/skills/skills/sop-manager/sops/swift-api-design.md`
- Audited legacy user SOPs:
  - `/Users/caishilin/.sops/npm-publish-tool-or-native-app.md`
  - `/Users/caishilin/.sops/typescript-cli.md`
- Current user SOP directory `~/.ssbun-skills/sops` has no SOP files.

Verification performed:

- `find skills/sop-manager/sops -maxdepth 1 -type f -name '*.md'`
- `find ~/.ssbun-skills/sops -maxdepth 1 -type f -name '*.md'`
- `find ~/.sops -maxdepth 1 -type f -name '*.md'`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `nl -ba` on all discovered SOP files
- `rg` for SOP path references and release orchestrator target names

# User SOP Migration

## Plan

- [x] Check current and legacy user SOP directories for conflicts.
- [x] Move legacy `~/.sops/*.md` files into `~/.ssbun-skills/sops/`.
- [x] Verify SOP summary output includes the migrated user SOPs.

## Review

- Moved `/Users/caishilin/.sops/npm-publish-tool-or-native-app.md` to `/Users/caishilin/.ssbun-skills/sops/npm-publish-tool-or-native-app.md`.
- Moved `/Users/caishilin/.sops/typescript-cli.md` to `/Users/caishilin/.ssbun-skills/sops/typescript-cli.md`.
- Legacy `/Users/caishilin/.sops` no longer contains `.md` SOP files.

Verification performed:

- `find ~/.ssbun-skills/sops -maxdepth 1 -type f -name '*.md'`
- `find ~/.sops -maxdepth 1 -type f -name '*.md'`
- `skills/sop-manager/scripts/sop-summaries.sh`

# Remove SOP Create Language Limit

## Plan

- [x] 删除 `sop-manager create` 中“整份 SOP 必须使用英文”的限制。
- [x] 保留现有模板和用户 SOP 存储路径不变。
- [x] 记录这次纠正，避免以后把语言要求扩大到整份 SOP。
- [x] 校验 skill 和 diff。

## Review

- 删除了 `skills/sop-manager/SKILL.md` 中强制 SOP 文件全篇英文的步骤。
- 保留模板本身不变；SOP 主流程描述现在不再被固定为英文或其他单一语言。
- 在 `tasks/lessons.md` 记录这次纠正：不要把语言偏好扩大成整份 SOP 文件限制。

Verification performed:

- Confirmed no active SOP language-limit rule remains in `skills/sop-manager/SKILL.md`.
- `rg -n 'Remove SOP Create Language Limit|SOP Create Language Scope' tasks/todo.md tasks/lessons.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- skills/sop-manager/SKILL.md tasks/todo.md tasks/lessons.md`

# Baoyu Skills Wiki Collection

## Plan

- [x] 读取用户 tips，确认 wiki 文档保存到本地 MyWiki 目录。
- [x] 只读检查 `JimLiu/baoyu-skills` 仓库权限和当前 commit。
- [x] 抽取远端仓库 skill 清单与 frontmatter 描述。
- [x] 写入中文收藏文档到 wiki 目录。
- [x] 打开生成的 Markdown 文件并校验路径。

## Review

- 已创建 wiki 文档：`/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md`
- 文档来源：`https://github.com/JimLiu/baoyu-skills`，采集 commit `c9a50cc`。
- 文档包含推荐安装组合、公众号文章工作流、内容采集、视觉生成、发布分发、工具类和 21 个 skill 的完整索引。
- GitHub repo 当前对本机账号权限为 `READ`，没有直接推送远端 wiki。
- 已按 tips 用 Typora 打开生成的 Markdown 文件。

Verification performed:

- `gh repo view jimliu/baoyu-skills --json nameWithOwner,url,description,defaultBranchRef,viewerPermission,hasWikiEnabled`
- `git clone --depth 1 https://github.com/jimliu/baoyu-skills.git /tmp/baoyu-skills`
- `find /tmp/baoyu-skills -maxdepth 3 -type f -name SKILL.md`
- `rg -n '^\| `baoyu-' "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md"`
- `wc -l "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md"`
- `open -a Typora "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md"`
- `git diff --check -- tasks/todo.md`

# SOP Create Good Example

## Plan

- [x] Add a concise good SOP example under `skills/sop-manager/references/`.
- [x] Update `sop-manager create` to read and follow the example before writing a SOP.
- [x] Verify the skill, reference path, and diff.

## Review

- Added `/Users/caishilin/Desktop/personal/skills/skills/sop-manager/references/good-sop-example.md`.
- Updated `sop-manager create` so new SOP creation reads that example first and checks trigger description, scope, executable steps, confirmation gates, concrete error handling, and reusable lessons.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `test -f skills/sop-manager/references/good-sop-example.md`
- `rg -n 'good-sop-example|清楚的触发型|Save Markdown Docs SOP|SOP Create Good Example' skills/sop-manager tasks/todo.md`
- `git diff --check`

# Install Script Output And Local Data Boundary

## Plan

- [x] Stop creating `~/.ssbun-skills/skills` mirrors; keep `~/.ssbun-skills` for user data only.
- [x] Link Codex skills directly from `~/.agents/skills/{name}` to this repository's `skills/{name}`.
- [x] Remove hook lookups for `~/.ssbun-skills/skills/...`.
- [x] Make install output show unchanged links in default color, new links in green, updated links in yellow.
- [x] Verify install behavior with a temporary HOME and fake Codex path.

## Review

- Updated `scripts/install.sh` so Codex skill symlinks point directly from `~/.agents/skills/{name}` to `/Users/caishilin/Desktop/personal/skills/skills/{name}`.
- Removed creation of `~/.ssbun-skills/skills/{name}` mirrors.
- Added cleanup for obsolete symlinks under `~/.ssbun-skills/skills`; only symlinks are removed.
- Changed installer output to status lines:
  - `unchanged` in default terminal color.
  - `new` in green when stdout supports color.
  - `updated` in yellow when stdout supports color.
- Removed `~/.ssbun-skills/skills/...` lookups from tips and SOP hooks.
- Updated the current machine: removed the old `~/.ssbun-skills/skills` symlink mirror and relinked real `~/.agents/skills/*` entries directly to this repository.
- Recorded the local-data boundary correction in `tasks/lessons.md`.

Verification performed:

- `bash -n scripts/install.sh`
- `jq . hooks/hooks.json`
- Temporary `HOME` install with Codex hidden from `PATH`: creates direct `~/.agents/skills` links and no `~/.ssbun-skills/skills`.
- Temporary `HOME` migration test: removes old mirror symlink and updates `.agents` link to direct repository path.
- Hook fallback tests for tips and SOP summary commands.
- Real HOME relink test with Codex hidden from `PATH`; second run reports `unchanged`.
- `git diff --check`

# Codex Duplicate Skills Fix

## Plan

- [x] Explain duplicate skill source.
- [x] Change install output so unchanged links do not print an `unchanged` status.
- [x] Show only the Codex skill path in install output, not the repository target path.
- [x] Make Codex plugin hooks-only so skills load from `~/.agents/skills` instead of both plugin cache and symlinks.
- [x] Refresh current Codex plugin cache and verify duplicate plugin skills are gone.

## Review

- Root cause: Codex had both `/Users/caishilin/.agents/skills/sop-manager` and plugin cache `/Users/caishilin/.codex/plugins/cache/CSL/csl/1.7.1/skills/sop-manager`, so the same skill appeared twice.
- Updated `scripts/install.sh` output:
  - Unchanged links print as `Codex: ~/.agents/skills/{name}` in default color.
  - New links print as `new Codex: ~/.agents/skills/{name}` in green when color is available.
  - Updated links print as `updated Codex: ~/.agents/skills/{name}` in yellow when color is available.
  - Repository target paths are no longer printed for normal skill links.
- Added `.codex-plugin/hooks/hooks.json` so `.codex-plugin` is the actual hooks-only Codex plugin package.
- Removed `skills` export from `.codex-plugin/plugin.json`.
- Changed the Codex marketplace source to `./.codex-plugin`.
- Removed the old tracked `plugins/csl -> ..` symlink, which caused Codex to package the whole repository as the plugin.
- Updated `scripts/install.sh` to remove/re-add `csl@CSL`, preventing stale plugin caches from keeping a `skills/` directory.
- Refreshed current machine's `csl@CSL` plugin cache; it no longer contains `skills/`.
- Documented in `README.md` that Codex skills are linked through `~/.agents/skills` and the plugin is hooks-only.

Verification performed:

- `bash -n scripts/install.sh`
- `jq . .codex-plugin/plugin.json .codex-plugin/hooks/hooks.json hooks/hooks.json .agents/plugins/marketplace.json`
- Temporary `HOME` install output test: first run shows `new ...`, second run shows plain `Codex: ~/.agents/skills/{name}`.
- Real `./scripts/install.sh codex`
- Confirmed `/Users/caishilin/.codex/plugins/cache/CSL/csl/local/skills` does not exist.
- Confirmed `/Users/caishilin/.codex/plugins/cache/CSL/csl/local/hooks/hooks.json` exists.
- Confirmed `/Users/caishilin/.agents/skills/sop-manager` points to `/Users/caishilin/Desktop/personal/skills/skills/sop-manager`.
- `git diff --check`

# Wiki Skill Collections Folder

## Plan

- [x] Create a dedicated local wiki folder for future skill collection docs.
- [x] Move the existing `baoyu-skills` collection doc into that folder.
- [x] Verify the new path and open the moved document.

## Review

- Created `/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections`.
- Moved the existing `baoyu-skills` collection doc into that folder.
- Future agent skill collection wiki docs should go in this folder.

Verification performed:

- `ls -la "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections"`
- `wc -l "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections/我收藏的 Agent Skills - baoyu-skills.md"`
- `open -a Typora "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections/我收藏的 Agent Skills - baoyu-skills.md"`
- `git diff --check -- tasks/todo.md`

# Global AGENTS Rule Optimization

## Plan

- [x] Preserve mandatory `tasks/todo.md` and `tasks/lessons.md` compliance.
- [x] Keep `### 8. Verification Before Done` unchanged.
- [x] Merge duplicate thinking, planning, task-management, and simplicity rules.
- [x] Record the correction about todo/lessons in `tasks/lessons.md`.
- [x] Audit the updated rules with `yao-meta-skill` and verify the final diff.

## Review

- Updated `/Users/caishilin/.codex/AGENTS.md` in English.
- Merged `Think Before Coding` and `Engineering Mindset` into `Engineering Thinking`.
- Merged `Goal-Driven Execution` and `Task Management` into `Goal-Driven Task Management`.
- Removed duplicate `Core Principles` while preserving root-cause and minimum-code rules under `Simplicity First`.
- Kept `### 8. Verification Before Done` unchanged.
- Preserved strong `tasks/todo.md` and `tasks/lessons.md` compliance rules.
- Recorded the todo/lessons correction in `tasks/lessons.md`.

Yao audit:

- Scope is an AGENTS rule-file cleanup, not a skill package or release.
- No trigger boundary changed for a skill; no `trigger_eval.py` required.
- Lightest reliable process applies: inspect changed rules, remove duplication, verify with grep and diff check.

Verification performed:

- `rg -n "^## Engineering Mindset|^## Task Management|^## Core Principles|^### 8\\. Verification Before Done|tasks/todo\\.md|tasks/lessons\\.md" /Users/caishilin/.codex/AGENTS.md`
- `git diff --check -- tasks/todo.md tasks/lessons.md`

# Codex AGENTS Concept Contract Test

## Plan

- [x] Add a small script that checks the AGENTS rule contract.
- [x] Cover first-principles thinking, adversarial review, mandatory todo/lessons, unchanged verification section, and removed duplicate sections.
- [x] Run the script against `/Users/caishilin/.codex/AGENTS.md`.
- [x] Record verification results.

## Review

- Added `/Users/caishilin/Desktop/personal/skills/scripts/check_codex_agents_contract.py`.
- The script checks the static AGENTS rule contract:
  - language protocol and AGENTS language exception
  - first-principles thinking
  - adversarial review
  - mandatory `tasks/todo.md` and `tasks/lessons.md`
  - unchanged `### 8. Verification Before Done`
  - removed duplicate old sections
  - RTK include
- It intentionally does not simulate a live model conversation; live behavior still needs manual prompt scenarios or a separate LLM harness.

Verification performed:

- `python3 -m py_compile scripts/check_codex_agents_contract.py`
- `python3 scripts/check_codex_agents_contract.py`
- `python3 scripts/check_codex_agents_contract.py /Users/caishilin/.codex/AGENTS.md`

# Inject My Agents Name Fix

## Plan

- [x] Update the misspelled user-facing skill name to `Inject My Agents`.
- [x] Update matching description text that names the template phrase.
- [x] Leave the existing `inject-may-agents` skill ID and paths unchanged for compatibility.
- [x] Validate metadata, JSON manifests, and search results.
- [x] Audit the skill change with `yao-meta-skill`.

## Review

- Updated `skills/inject-may-agents/SKILL.md` title and frontmatter description.
- Updated `skills/inject-may-agents/agents/openai.yaml` display name.
- Updated `README.md` skill summary.
- Kept `inject-may-agents` as the stable invocation ID and path.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/inject-may-agents`
- YAML parse for `skills/inject-may-agents/agents/openai.yaml`
- JSON parse for plugin and marketplace manifests
- `rg -n "Inject May Agents|May agent|May Agents|Inject My Agents|My agent|My Agents" README.md skills/inject-may-agents`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/inject-may-agents`
- `git diff --check -- README.md skills/inject-may-agents/SKILL.md skills/inject-may-agents/agents/openai.yaml tasks/todo.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/inject-may-agents`; lint, governance check, and resource boundary check passed.

# SOP Example Modern Format

## Plan

- [x] Update `skills/sop-manager/references/good-sop-example.md` to use the modern SOP structure.
- [x] Preserve the example's existing trigger, topic, and frontmatter compatibility.
- [x] Include header metadata, purpose, scope, definitions, responsibilities, prerequisites, step-by-step procedure, exception handling, outputs, appendix, and lessons.
- [x] Validate the example and `sop-manager` skill references.
- [x] Audit the SOP/skill documentation change with `yao-meta-skill`.

## Review

- Rewrote `skills/sop-manager/references/good-sop-example.md` around the modern SOP format supplied by the user.
- Preserved the existing `save-markdown-docs` frontmatter name, description, version, and owner.
- Kept the example topic as Markdown document saving; did not change the `sop-manager` embedded creation template.
- Added Basic Info, Revision History, Definitions, Responsibilities, Prerequisites, Procedure with input/action/expected output, Exception Handling, Output Results, Appendix, and Lessons.

Adversarial review:

- Risk: breaking skill trigger metadata. Mitigation: frontmatter was parsed and `name`/`description` were checked.
- Risk: example becoming too domain-specific. Mitigation: kept the existing generic Markdown-saving scenario.
- Risk: claiming Yao audit passed when it did not. Mitigation: recorded the exact pre-existing failure below.

Verification performed:

- Parsed frontmatter and asserted all modern SOP headings exist.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "good-sop-example|基本信息|职责|异常处理|输出结果|附录|Lessons|DOC-SAVE-001" skills/sop-manager tasks/todo.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# Remove Release Orchestrator SOP

## Plan

- [x] Delete the built-in `release-orchestrator` SOP shell.
- [x] Update `skills/release/SKILL.md` to route directly to concrete existing release SOPs.
- [x] Verify SOP summaries no longer list `release-orchestrator`.
- [x] Validate affected skills and audit with `yao-meta-skill`.
- [x] Record changed files and unresolved risks.

## Review

- Deleted `skills/sop-manager/sops/release-orchestrator.md`.
- Updated `skills/release/SKILL.md` so it no longer loads an orchestrator SOP.
- Release now:
  - checks workspace status directly.
  - discovers concrete release SOPs from built-in and user SOP directories.
  - ignores `project-version-update` as a publish SOP because it is version-prep only.
  - stops when no concrete matching release SOP exists.
  - requires explicit confirmation before tag, push, publish, upload, notarize, or remote release actions.

Verification performed:

- `rg -n "release-orchestrator|xcode-macos-dmg-release|python-pypi-release|cargo-crates-release" skills README.md hooks commands -S`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/release`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/release`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `git diff --check -- skills/release/SKILL.md skills/sop-manager/sops/release-orchestrator.md tasks/todo.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/release` and `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# SOP English Frontmatter

## Plan

- [x] Add SOP manager rule that all SOP frontmatter values must be written in English.
- [x] Convert built-in SOP frontmatter values to English.
- [x] Convert user-scoped SOP frontmatter values to English.
- [x] Validate frontmatter language, summary output, hooks, and skill metadata.
- [x] Audit changed SOP rules with `yao-meta-skill`.

## Review

- Updated `skills/sop-manager/SKILL.md` to require English values in all SOP frontmatter.
- Converted frontmatter values to English in built-in SOP files and examples:
  - `skills/sop-manager/sops/swift-api-design.md`
  - `skills/sop-manager/references/process-sop-example.md`
  - `skills/sop-manager/references/rule-sop-example.md`
- Converted frontmatter values to English in all user-scoped SOPs under `/Users/caishilin/.ssbun-skills/sops/*.md`.
- Added an extra `swift-api-design` exclusion so Swift file organization prompts route to `swift-code-style` instead of API design.

Verification performed:

- Parsed 11 SOP/example files and asserted no Chinese characters in YAML frontmatter.
- Asserted required frontmatter fields: `name`, `description`, and `when_to_use`.
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- Tested candidate matching for Swift API and Swift code organization prompts after English conversion.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `jq . hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `cmp -s hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `git diff --check -- hooks/hooks.json .codex-plugin/hooks/hooks.json skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh skills/sop-manager/scripts/sop-candidates.js skills/sop-manager/references/process-sop-example.md skills/sop-manager/references/rule-sop-example.md skills/sop-manager/sops/swift-api-design.md tasks/todo.md`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint and governance passed. Resource boundary passed with a warning that `SKILL.md` is getting heavy at 908 estimated tokens.

# SOP Hook Routing Hardening

## Plan

- [x] Update SOP manager criteria with `when_to_use`, `do_not_use_when`, `globs`, and completion criteria guidance.
- [x] Update SOP summary output to include `globs` without reading full SOP bodies.
- [x] Add a prompt-time SOP candidate hook only if the hook event is supported by existing plugin conventions.
- [x] Tighten PreToolUse SOP reminder to use `when_to_use` and completion criteria.
- [x] Migrate all built-in and user-scoped SOP frontmatter to the newest criteria.
- [x] Validate hook JSON, scripts, SOP frontmatter, summaries, and skill metadata.
- [x] Audit changed rules, hooks, skills, and SOPs with `yao-meta-skill`.

## Review

- Updated `skills/sop-manager/SKILL.md` so new SOPs require routing-focused `when_to_use`, content-focused `description`, optional `do_not_use_when`, optional `globs`, and checklist completion criteria.
- Updated `skills/sop-manager/scripts/sop-summaries.sh` to print `globs` while still loading only frontmatter.
- Added `skills/sop-manager/scripts/sop-candidates.js` and wired `UserPromptSubmit` in `hooks/hooks.json` and `.codex-plugin/hooks/hooks.json`.
- Tightened `PreToolUse` so it tells agents to match by `when_to_use` or `name`, read the full SOP before tool use, and verify completion criteria before final.
- Migrated all built-in and user-scoped SOPs under `skills/sop-manager/sops/*.md` and `/Users/caishilin/.ssbun-skills/sops/*.md` to the new frontmatter criteria.
- Added missing checklist completion criteria to legacy user SOPs and removed old `Lessons` sections.

Verification performed:

- Parsed 9 SOP files and asserted `name`, `description`, `when_to_use`, `version`, `update_date`, no `owner`, no `Lessons`, and checklist completion criteria.
- `jq . hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `cmp -s hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `node --check skills/sop-manager/scripts/sop-candidates.js`
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- Executed `UserPromptSubmit` hook command with a YouTube-to-Markdown prompt.
- Executed `PreToolUse` hook command.
- Tested candidate matching for Swift API, Swift code organization, macOS DMG, and YouTube Markdown prompts.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- hooks/hooks.json .codex-plugin/hooks/hooks.json skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh skills/sop-manager/scripts/sop-candidates.js skills/sop-manager/references/process-sop-example.md skills/sop-manager/references/rule-sop-example.md skills/sop-manager/sops/swift-api-design.md tasks/todo.md`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint and governance passed. Resource boundary passed with a warning that `SKILL.md` is getting heavy at 908 estimated tokens.

# SOP When-To-Use Strict Routing

## Plan

- [x] Remove legacy `description` fallback from the SOP summary formatter.
- [x] Update SOP manager docs so `when_to_use` is the only routing field.
- [x] Validate summary output and skill metadata.
- [x] Audit the SOP manager change with `yao-meta-skill`.

## Review

- Removed legacy `description` fallback from `skills/sop-manager/scripts/sop-summaries.sh`.
- Updated `skills/sop-manager/SKILL.md` so SOP routing only uses `when_to_use` or `name`.
- Missing `when_to_use` now appears as `Missing when_to_use frontmatter.` in summaries, which makes unmigrated SOPs visible.

Verification performed:

- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- `rg -n 'legacy|旧版|description fallback|field description|name or description|No when_to_use or description' skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh tasks/todo.md`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# SOP When-To-Use Frontmatter

## Plan

- [x] Add an explicit SOP frontmatter field for agent routing conditions.
- [x] Keep old SOPs compatible by falling back to `description`.
- [x] Update built-in examples and `swift-api-design` to demonstrate the field.
- [x] Validate summary output, skill metadata, and changed rule files.
- [x] Audit the SOP manager change with `yao-meta-skill`.

## Review

- Added `when_to_use` as the explicit SOP routing field in `skills/sop-manager/SKILL.md`.
- Kept `description` as the short content summary and documented legacy fallback behavior.
- Updated `skills/sop-manager/scripts/sop-summaries.sh` to display `when_to_use` first, then fall back to `description`.
- Added `when_to_use` to `skills/sop-manager/references/process-sop-example.md`, `skills/sop-manager/references/rule-sop-example.md`, and `skills/sop-manager/sops/swift-api-design.md`.

Verification performed:

- Parsed changed SOP frontmatter and asserted `name`, `description`, and `when_to_use`.
- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh skills/sop-manager/references/process-sop-example.md skills/sop-manager/references/rule-sop-example.md skills/sop-manager/sops/swift-api-design.md tasks/todo.md`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# Swift API Design SOP Rewrite From Wiki

## Plan

- [x] Read the local Swift API Design Guidelines wiki source.
- [x] Rewrite built-in `swift-api-design` as a rule SOP using the wiki as source.
- [x] Preserve routing metadata and update lightweight metadata.
- [x] Validate SOP structure, frontmatter, summaries, and skill metadata.
- [x] Audit the SOP change with `yao-meta-skill`.

## Review

- Rewrote `skills/sop-manager/sops/swift-api-design.md` from the local wiki source `/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/Swift/Swift API Design Guidelines.md`.
- Kept the SOP as a rule SOP instead of forcing a linear execution flow.
- Preserved routing metadata for Swift files and updated lightweight metadata to `version: 1.2` and `update_date: 2026-07-09`.
- Added wiki-backed rule groups for clear usage, fluent call sites, side-effect naming, terminology, parameter labels, documentation comments, tuple/closure guidance, and `#fileID` / `#filePath` / `#file` usage.
- Converted compliance into checkbox completion criteria for agent review.

Verification performed:

- Parsed YAML frontmatter and asserted `name`, `version`, `update_date`, required sections, wiki reference path, and `#fileID` / `#filePath` / `#file` coverage.
- Asserted old body metadata and process-only sections are absent.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `bash skills/sop-manager/scripts/sop-summaries.sh | rg -n "swift-api-design|SOP manager|Read the full SOP"`
- `git diff --check -- skills/sop-manager/sops/swift-api-design.md tasks/todo.md`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# Project Version SOP Completion Criteria

## Plan

- [x] Update `/Users/caishilin/.ssbun-skills/sops/project-version-update.md` to separate execution checks from completion criteria.
- [x] Remove the `Lessons` section and merge its intent into the SOP body.
- [x] Align frontmatter with lightweight SOP metadata.
- [x] Validate YAML, section structure, and SOP summary loading.
- [x] Audit the SOP change with `yao-meta-skill`.

## Review

- Updated `/Users/caishilin/.ssbun-skills/sops/project-version-update.md`.
- Replaced `owner` with `update_date` in frontmatter.
- Split the old mixed `Checklist` into `执行检查点` for process guidance and `完成标准` for final compliance checking.
- Removed `Lessons`; its intent is now covered by `执行检查点` and `完成标准`.
- Added completion criteria that require observable evidence: source of truth, synchronized files, changelog status, build number status, lockfile status, release metadata checks, validation commands, and no unconfirmed remote release actions.

Verification performed:

- Parsed YAML frontmatter and asserted only `name`, `description`, `version`, and `update_date`.
- Asserted required sections exist: `执行检查点`, `执行流程`, `异常处理`, `完成标准`.
- Asserted `Lessons` and `owner` are absent.
- `bash skills/sop-manager/scripts/sop-summaries.sh | rg -n "project-version-update|SOP manager|Read the full SOP"`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# SOP Manager Design Cleanup

## Plan

- [x] Rename the process SOP example from `good-sop-example.md` to `process-sop-example.md`.
- [x] Update `sop-manager/SKILL.md` so it no longer assumes every SOP is step-based.
- [x] Migrate `swift-api-design.md` to the rule SOP format.
- [x] Validate frontmatter, references, and SOP structures.
- [x] Audit the SOP changes with `yao-meta-skill`.

## Review

- Renamed the process example to `skills/sop-manager/references/process-sop-example.md`.
- Updated `skills/sop-manager/SKILL.md` so SOPs are described as agent behavior rules that are either executed as a flow or applied as judgment rules.
- Updated `sop-manager create` to collect either flow data or rule/judgment data, then choose the matching example.
- Migrated `skills/sop-manager/sops/swift-api-design.md` to the rule SOP structure:
  - `使用方式`
  - `规则分组`
  - `冲突处理`
  - checkbox `完成标准`
  - `参考资料`
- Removed old body metadata from `swift-api-design` and replaced `owner/scope` frontmatter with `update_date`.

Verification performed:

- Parsed frontmatter for `process-sop-example.md`, `rule-sop-example.md`, and `swift-api-design.md`.
- Asserted `swift-api-design.md` includes rule SOP sections and checkbox completion criteria.
- Asserted `sop-manager/SKILL.md` references `process-sop-example.md` and `rule-sop-example.md`, and no longer references `good-sop-example.md`.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "good-sop-example|owner: team-or-role|owner: \\{role-or-team\\}|## Lessons|companion lesson|process-sop-example|rule-sop-example|## 3\\. 使用方式|## 4\\. 规则分组|## 5\\. 冲突处理|## 6\\. 完成标准" skills/sop-manager`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# SOP Manager Two SOP Types

## Plan

- [x] Define process SOP and rule SOP guidance in `skills/sop-manager/SKILL.md`.
- [x] Keep `good-sop-example.md` as the process SOP example.
- [x] Add a concise rule SOP example under `skills/sop-manager/references/`.
- [x] Validate examples, skill metadata, and references.
- [x] Audit the SOP documentation change with `yao-meta-skill`.

## Review

- Updated `skills/sop-manager/SKILL.md` with two SOP types:
  - process SOP: ordered execution, confirmation points, error handling, completion criteria.
  - rule SOP: use instructions, grouped rules, conflict handling, completion criteria.
- Added `skills/sop-manager/references/rule-sop-example.md`.
- Kept `skills/sop-manager/references/good-sop-example.md` as the process SOP example.

Verification performed:

- Parsed both SOP example frontmatters and checked required fields.
- Asserted the rule SOP example includes `使用方式`, `规则分组`, `冲突处理`, and checkbox completion criteria.
- Asserted `skills/sop-manager/SKILL.md` references both examples and the two SOP types.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "rule-sop-example|规则型 SOP|流程型 SOP|使用方式|规则分组|冲突处理" skills/sop-manager`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# Restore Local AGENTS RTK Include

## Plan

- [x] Restore `@/Users/caishilin/.codex/RTK.md` only in `/Users/caishilin/.codex/AGENTS.md`.
- [x] Keep `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents/references/AGENTS.template.md` without the local include.
- [x] Correct the lesson so it applies to portable templates, not the local AGENTS file.
- [x] Re-run AGENTS/template checks and Yao audit.

## Review

- Restored `@/Users/caishilin/.codex/RTK.md` in `/Users/caishilin/.codex/AGENTS.md`.
- Kept `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents/references/AGENTS.template.md` free of the local RTK include.
- Corrected the lesson to say portable AGENTS templates must not contain local absolute-path includes, while the user's local AGENTS may.
- `scripts/check_codex_agents_contract.py` remains portable: it checks shared rule concepts, not local-only tooling includes.

Yao audit:

- `quick_validate.py` passed for `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents`.
- `yao.py validate` still reports the pre-existing `Missing agents/interface.yaml` metadata gap.
- Treating that metadata gap as a release-only gate; lint, governance check, and resource boundary check passed.

Verification performed:

- `rg -n "@/Users/caishilin/.codex/RTK.md" /Users/caishilin/.codex/AGENTS.md skills/inject-may-agents/references/AGENTS.template.md`
- `python3 -B scripts/check_codex_agents_contract.py /Users/caishilin/.codex/AGENTS.md`
- `python3 -B scripts/check_codex_agents_contract.py skills/inject-may-agents/references/AGENTS.template.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/inject-may-agents`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/inject-may-agents`

# Inject My Agents Template Refresh

## Plan

- [x] Read `/Users/caishilin/.codex/AGENTS.md` as the source template.
- [x] Replace `skills/inject-may-agents/references/AGENTS.template.md` with that source content.
- [x] Verify the copied template matches the source exactly.
- [x] Validate the updated skill and run a light Yao audit.
- [x] Record results and unresolved risks.

## Review

- Replaced `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents/references/AGENTS.template.md` with the current `/Users/caishilin/.codex/AGENTS.md`.
- Preserved existing dirty changes in `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents/SKILL.md` and `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents/agents/openai.yaml`.
- Verified the template copy is byte-for-byte identical to `/Users/caishilin/.codex/AGENTS.md`.
- Verified the copied template passes `/Users/caishilin/Desktop/personal/skills/scripts/check_codex_agents_contract.py`.

Yao audit:

- `quick_validate.py` passed for `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents`.
- `yao.py validate` still reports `Missing agents/interface.yaml`.
- Treating that metadata gap as a pre-existing release-only gate; lint, governance check, and resource boundary check passed.

Verification performed:

- `cmp -s /Users/caishilin/.codex/AGENTS.md skills/inject-may-agents/references/AGENTS.template.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/inject-may-agents`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/inject-may-agents`
- `python3 scripts/check_codex_agents_contract.py skills/inject-may-agents/references/AGENTS.template.md`
- `git diff --check -- skills/inject-may-agents/references/AGENTS.template.md tasks/todo.md`

# Remove RTK Include From AGENTS Template

## Plan

- [x] Remove `@/Users/caishilin/.codex/RTK.md` from `/Users/caishilin/.codex/AGENTS.md`.
- [x] Remove the same include from `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents/references/AGENTS.template.md`.
- [x] Update the AGENTS contract test so RTK include is not required.
- [x] Record the correction in `/Users/caishilin/Desktop/personal/skills/tasks/lessons.md`.
- [x] Run validation and Yao audit.

## Review

- Removed the local absolute-path RTK include from `/Users/caishilin/.codex/AGENTS.md`.
- Removed the same include from `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents/references/AGENTS.template.md`.
- Updated `/Users/caishilin/Desktop/personal/skills/scripts/check_codex_agents_contract.py` so RTK include is no longer part of the expected AGENTS contract.
- Recorded `/Users/...` include guidance in `/Users/caishilin/Desktop/personal/skills/tasks/lessons.md`.
- Verified the inject-may-agents template still matches `/Users/caishilin/.codex/AGENTS.md` exactly.

Yao audit:

- `quick_validate.py` passed for `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents`.
- `yao.py validate` still reports the pre-existing `Missing agents/interface.yaml` metadata gap.
- Treating that metadata gap as a release-only gate; lint, governance check, and resource boundary check passed.

Verification performed:

- `rg -n "@/Users/caishilin/.codex/RTK.md|RTK.md" /Users/caishilin/.codex/AGENTS.md skills/inject-may-agents/references/AGENTS.template.md scripts/check_codex_agents_contract.py`
- `cmp -s /Users/caishilin/.codex/AGENTS.md skills/inject-may-agents/references/AGENTS.template.md`
- `python3 -B scripts/check_codex_agents_contract.py /Users/caishilin/.codex/AGENTS.md`
- `python3 -B scripts/check_codex_agents_contract.py skills/inject-may-agents/references/AGENTS.template.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/inject-may-agents`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/inject-may-agents`

# SOP Lessons Section Removal

## Plan

- [x] Remove the `Lessons` section from the SOP example.
- [x] Remove `Lessons` from the SOP creation template and quality checklist.
- [x] Change `sop-manager learn` guidance so reusable corrections update the SOP directly.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the skill and audit with `yao-meta-skill`.

## Review

- Removed `## 7. Lessons` from `skills/sop-manager/references/good-sop-example.md`.
- Removed `Lessons` from the `sop-manager create` template and checklist.
- Rewrote `sop-manager learn` so reusable corrections update the matching SOP body directly instead of creating a separate lessons section or companion SOP.
- Added `2026-07-08 SOP No Lessons Section` to `tasks/lessons.md`.

Verification performed:

- Parsed example YAML and asserted frontmatter only contains `name`, `description`, `version`, and `update_date`.
- Asserted the example no longer contains `Lessons`.
- Asserted `skills/sop-manager/SKILL.md` no longer contains `## Lessons` or companion lesson guidance.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "Lessons|companion lesson|直接更新到对应 SOP 正文|完成标准使用 checkbox" skills/sop-manager/SKILL.md skills/sop-manager/references/good-sop-example.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# SOP Example Agent Behavior Shape

## Plan

- [x] Remove revision history from the SOP example.
- [x] Replace product-style sections with agent behavior guidance.
- [x] Keep confirmation gates, error handling, success criteria, and lessons.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the example and audit with `yao-meta-skill`.

## Review

- Rewrote `skills/sop-manager/references/good-sop-example.md` as a lightweight agent behavior SOP.
- Removed revision history, definitions, responsibilities, appendix, and command examples.
- Replaced product-style step detail with agent behavior rules, confirmation gates, execution flow, error handling, completion criteria, and lessons.
- Reduced frontmatter to `name`, `description`, `version`, and `update_date`.
- Updated `skills/sop-manager/SKILL.md` so the built-in creation template uses `version` and `update_date`.
- Converted `## 6. 完成标准` to a checkbox checklist.
- Updated `tasks/lessons.md` so future SOP examples keep `version` and `update_date`, without heavier governance fields.

Verification performed:

- Parsed example YAML and asserted frontmatter only contains `name`, `description`, `version`, and `update_date`.
- Asserted removed sections and metadata are absent from the example.
- Asserted `## 6. 完成标准` contains checkbox items.
- Asserted `skills/sop-manager/SKILL.md` no longer suggests `owner` in the creation template.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "^## 6\\. 完成标准|^- \\[ \\]" skills/sop-manager/references/good-sop-example.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# SOP Example Minimal Frontmatter

## Plan

- [x] Remove unneeded SOP example frontmatter fields: `id`, `created_by`, `reviewer`, and `approver`.
- [x] Keep the useful existing metadata and body revision history.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate frontmatter, skill metadata, and diff formatting.
- [x] Audit the SOP documentation change with `yao-meta-skill`.

## Review

- Removed `id`, `created_by`, `reviewer`, and `approver` from `skills/sop-manager/references/good-sop-example.md`.
- Kept `name`, `description`, `version`, `owner`, and `effective_date` in frontmatter.
- Preserved the body revision history.
- Added `2026-07-08 SOP Example Metadata Minimalism` to `tasks/lessons.md`.

Verification performed:

- Parsed YAML frontmatter and asserted removed fields are absent.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "^id:|^created_by:|^reviewer:|^approver:|^version:|^owner:|^effective_date:" skills/sop-manager/references/good-sop-example.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# SOP Example Frontmatter Basic Info

## Plan

- [x] Move basic SOP metadata from Markdown body into YAML frontmatter.
- [x] Renumber the remaining body sections so the document starts with purpose.
- [x] Keep revision history visible in the body.
- [x] Validate frontmatter and required SOP sections.
- [x] Audit the SOP documentation change with `yao-meta-skill`.

## Review

- Moved SOP ID, creator, reviewer, approver, and effective date into the YAML frontmatter of `skills/sop-manager/references/good-sop-example.md`.
- Removed the body `## 1. 基本信息` section.
- Kept `## 修订记录` in the body and renumbered the main SOP sections from `## 1. 目的` through `## 10. Lessons`.

Verification performed:

- Parsed frontmatter and asserted `name`, `description`, `id`, `version`, `owner`, `created_by`, `reviewer`, `approver`, and `effective_date`.
- Asserted `## 1. 基本信息` is absent and the renumbered SOP sections are present.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "^id:|^created_by:|^reviewer:|^approver:|^effective_date:|^## 1\\. 基本信息|^## 1\\. 目的|^## 修订记录" skills/sop-manager/references/good-sop-example.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.

# Pi Fast Mode Extension

## Plan

- [x] Move Pi-specific extension code into a dedicated `pi/` folder.
- [x] Add a Pi extension for OpenAI Codex Fast Mode with `/fast on|off|toggle|status` and `--fast` support.
- [x] Update the Pi package manifest and README so Pi loads extensions from the dedicated folder.
- [x] Verify JSON validity, extension loading, installer syntax, and package dry-run.
- [x] Review changed files and unresolved risks.

## Review

- Created `pi/extensions/` as the dedicated Pi-specific component folder.
- Moved the CSL skill alias extension to `pi/extensions/csl-skill-commands.ts`.
- Added `pi/extensions/openai-codex-fast.ts` with `--fast` and `/fast on|off|toggle|status`.
- Updated Fast Mode to persist in `~/.pi/agent/csl/openai-codex-fast.json` so new Pi sessions reuse the configured value.
- Updated Fast Mode status to render in the TUI footer's right side as `model • thinking • fast` when enabled, with a non-TUI fallback through Pi's footer status API.
- Updated `package.json` to load Pi extensions from `./pi/extensions`.
- Updated `README.md` with Pi-specific layout and Fast Mode usage.
- Verification performed:
  - `node -e "JSON.parse(...)"` for `package.json`
  - `bash -n scripts/install.sh`
  - `npm pack --dry-run --json`
  - Jiti-loaded both Pi extensions and simulated persistent config, custom footer rendering, and Fast Mode injection.
  - `git diff --check` for changed Pi package files.
  - `npm pack --dry-run --json` after the persistent footer update.
- Unresolved risk: Fast Mode effectiveness still depends on `openai-codex` provider authentication and account entitlement; the extension only injects `service_tier: "priority"` for eligible models.

# CSL Agent Kit Renaming Plan

## Assumptions

- 对外产品名采用 `CSL Agent Kit`。
- npm / Pi package 名采用 `csl-agent-kit`。
- 保留现有 skill 名称、`skills/` 目录和 `/CSL:<skill>` slash command 命名空间，避免无必要破坏已有用户习惯。
- 这次重命名重点是项目/包/插件描述层，不把每个具体 skill 改名，也不迁移用户数据目录，除非后续明确决定做 breaking migration。

## Plan

- [x] 盘点所有命名表面：`package.json`、README、各平台 plugin / marketplace manifest、安装脚本、Pi extension、文档和示例命令。
- [x] 更新 canonical metadata：把 `csl-skills` 改为 `csl-agent-kit`，把 `CSL Skills` 改为 `CSL Agent Kit`，并把描述从“skill collection”改为“agent toolkit”。
- [x] 更新平台 manifest：Claude Code、Cursor、Codex、Pi 的 display name、short / long description、keywords，确保覆盖 skills、plugins、commands、hooks、extensions、多客户端支持。
- [x] 更新安装文档：README 中的标题、定位语、repository clone path、`npx skills` 示例、Claude plugin install 示例、Pi install 示例，以及 `scripts/install.sh` 输出提示。
- [x] 明确兼容策略：保留 `/CSL:*` 命令名；若 GitHub repo 从 `SSBun/skills` 改名为新路径，文档中说明旧路径依赖 GitHub redirect 或保留旧 install 示例一段时间。
- [x] 处理本地状态命名：只在必要时新增 `~/.ssbun-agent-kit/` 之类路径；默认不迁移 `~/.ssbun-skills/`，避免破坏已有 SOP / tips 数据。
- [x] 运行验证：JSON manifest 校验、安装脚本语法检查、`npm pack --dry-run --json`、README stale-name grep、workspace diff check。
- [x] 做对抗性 review：确认没有误改标准 `skills/` 目录、没有破坏 plugin id、没有把历史分析文档中的旧名当作当前文档误改。

## Acceptance Criteria

- 当前对外品牌统一显示为 `CSL Agent Kit`。
- package 名统一为 `csl-agent-kit`，描述能准确覆盖 skills、plugins、commands、hooks、Pi extensions 和多 agent client 支持。
- README 首屏能让新用户理解：这是跨 Claude Code / Codex / Cursor / Pi 的个人 agent 工具包，不只是 skill 集合。
- 现有 skill 调用方式和安装后的运行路径保持兼容。
- 验证命令通过，且 `rg` 只在历史文档、兼容说明或 Agent Skills 标准语境中保留旧的 `CSL Skills` / `csl-skills` / `SSBun/skills` 引用。

## Verification Checklist

- [ ] `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`
- [ ] `jq . .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json`
- [ ] `bash -n scripts/install.sh`
- [ ] `npm pack --dry-run --json`
- [ ] `rg -n "CSL Skills|csl-skills|SSBun/skills|Agent skill collection" README.md package.json .claude-plugin .cursor-plugin .codex-plugin .agents scripts pi docs commands hooks`
- [ ] `git diff --check`
- [ ] `git status --short --untracked-files=all`

## Review

已由顶部任务 `CSL Agent Kit Renaming Execution` 执行。

执行结果：

- `package.json` 包名已改为 `csl-agent-kit`。
- README、plugin manifests、marketplace manifests、安装脚本提示已改为 `CSL Agent Kit` / toolkit 定位。
- 保留 `/CSL:*`、`CSL` / `csl` plugin id、`skills/` 目录和 `~/.ssbun-skills/` 用户数据路径，以降低兼容风险。

未决风险：

- GitHub 仓库是否真的从旧路径改为 `SSBun/agent-kit`，需要在代码库外单独完成；当前 README 已按目标新路径书写。
- 平台 marketplace 中已安装的旧入口可能需要用户重新安装或依赖平台 redirect。

# Dynamic Pi Skill Commands

## Plan

- [x] Replace the hard-coded CSL skill command list with dynamic discovery from `skills/*/SKILL.md`.
- [x] Parse each skill name from the folder name and description from `SKILL.md` frontmatter.
- [x] Keep the existing `/skill-name` alias behavior and busy-session follow-up behavior.
- [x] Verify extension loading, discovered command count, descriptions, package dry-run, and diff check.

## Review

- Rewrote `pi/extensions/csl-skill-commands.ts` to discover commands from `skills/*/SKILL.md` at extension load time.
- Source of truth follows the grilled decision: folder name is the command/skill name; frontmatter `description` is the command description.
- Added warnings for missing descriptions and mismatched frontmatter `name`, while still using the folder name.
- Preserved the previous behavior: commands send a skill-use request immediately when idle, or as `followUp` when the agent is busy.
- Updated `README.md` to document dynamic discovery.
- Verification performed:
  - Jiti-loaded `pi/extensions/csl-skill-commands.ts` and confirmed 17 commands.
  - Checked `/repo-map` description came from `skills/repo-map/SKILL.md` frontmatter.
  - Parsed `package.json`.
  - `npm pack --dry-run --json` includes Pi extension files.
  - `git diff --check` on changed Pi package files.
