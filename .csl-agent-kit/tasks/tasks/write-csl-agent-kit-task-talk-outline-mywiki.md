# 编写 CSL Agent Kit Task 系统宣讲大纲 Wiki

Status: Completed (2026-09-11 13:33)
Kind: Task

## Scope

- 当前按用户指定的 tech-blog-style 原地优化已交付的 MyWiki 宣讲大纲；保留原意、事实、设计边界、来源和大纲用途。不修改 CSL Agent Kit 实现、不改邻近笔记、不制作幻灯片或扩写成逐字讲稿。
- 内容以当前本地源码和运行时契约为准，覆盖 Task 家族、Target 对齐、Context／Lessons、执行与恢复、Queue、自检与独立审查、设计取舍及演示建议。

## Target
- [x] T1: MyWiki 中有一份介绍当前 CSL Agent Kit 的中文宣讲大纲，重点讲清整套 Task 系统及其设计思想。
- [x] T2: 现有大纲符合用户指定的 tech-blog-style，以专业、自然、适合讲述的表达呈现判断与取舍，同时保留原意、事实、设计边界和来源。

## Decisions

- 使用当前 workspace 的一个 owning task 管理跨目录交付，不在 MyWiki 重复创建同一任务。
- 落点为 ["/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/CSL Agent Kit 宣讲大纲——Task 系统与设计思想.md"](<file:///Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/CSL Agent Kit 宣讲大纲——Task 系统与设计思想.md>)；该目录没有现有局部索引，本次不新建索引或整理邻近笔记。
- 讲述从实际协作问题切入，不罗列全部命令；以“可验收、可恢复、有证据的 Agent 工作”为主线。暂按使用过 Coding Agent 的开发者组织，建议 40 分钟主讲加 10 分钟问答，并标注这些是可调整的编排建议。
- 公开 README 已于 2026-09-11 联网核对；新 review 设计以本地工作区为准，不把本地改动宣称为已发布或所有宿主均支持。不写业务隐私、账号或私人项目实例；示例使用虚构导出功能。
- 本轮用户明确指定 tech-blog-style 并要求优化同一文件：原地改写，保留 YAML、created、技术事实、来源和宣讲大纲用途；第一人称只承载当下判断，不虚构作者经历。写前复核 MyWiki AGENTS 与路径归属，不另建一份用户交付物。
- 风格调整针对讲义式标签、密集对照表和对称列点；保留有导航价值的节奏表及附录速查，不把大纲扩写成整篇讲稿。既有 Skill 已承载该写作规范，不为本次偏好新增重复 Lesson。
- 改写前正文快照仅供事实保留比对与独立审查，存于 [基线证据](../artifacts/write-csl-agent-kit-task-talk-outline-mywiki/evidence/pre-style-outline.md)。

## Plan

1. 对照用户指定的 tech-blog-style 与改写前正文，识别讲义腔、机械列点和句式问题，保留原文作为比对证据。
2. 原地优化叙述与提纲表达：用场景、判断及取舍连接章节，保留原有知识覆盖、节奏建议、演示与来源。
3. 完整回读并逐项比较原意和事实，校验 YAML、路径、来源、禁用表达与章节节奏；刷新 T1/T2 当前证据，不运行测试。
4. 冻结改写后的 Wiki、原文和风格依据，派发 fresh 只读 task-review 检查风格落实及事实遗漏；主 Agent 核实反馈、完成终验后交付。

## Result

- T1: 已按本轮风格要求原地更新同一MyWiki大纲，完整回读并逐节与改写前基线比较：仍覆盖Task家族、Target/Plan与授权、Context/Lessons、恢复与Queue、新review职责/隔离/停滞/内容身份、设计成本和CSV演示；保留8主章节、40分钟主讲+10分钟问答、8分钟演示、FAQ与20分钟短版。YAML及整个来源附录逐字保持，13本地来源可达；原有15文件技术来源包哈希仍为30a59f56277ec30573a868ac646da5c1d4c3553eeca97d99e6434362a441a9bd，未新增产品事实。Node解析/realpath/链接/章节/节奏/空白检查通过。当前Wiki SHA-256=964a11cdaa0040de1790c0ee48951887dcec6d241caf179ef12ed363a39eabcf，23017 bytes、240行；原稿基线SHA-256=c334582e34c0576d992e8babf478a378abd96826b1efa249653cb31c92b5e6ae。未改变实现或邻近笔记、未更新索引；未测试、彩排或模型评测。
- T2: 按用户tech-blog-style全文优化开场、章节过渡、比较与收束：从CSV需求场景进入，以主讲口吻表达当下判断与取舍；将主体对照表改为自然短段落及必要提纲，表格由7处减至2处，只留节奏和附录速查。全文回读确认第一人称未编造经历、实测或成功案例，保留教学材料与未发布口径；禁用表达扫描无命中。原稿与当前正文、风格Skill可逐节复核；禁用词及表格计数仅证明结构观察，不代替主观风格和语义比较。固定支持包为原有15文件技术来源＋tech-blog-style SKILL＋Decisions链接的原稿基线，共17文件；路径排序，对每条“绝对路径+NUL+文件SHA-256十六进制+LF”拼接再SHA-256=8f33fe283220426cfe5e9eabc52dddd1ee3dea4f716dc1596ed7d1e11837798d。风格Skill SHA-256=2604972dcb02dca655d954de2873dde7a53622cba5cd448382002dadb20b1a0a。
- Review gate: Passed — fresh只读Reviewer run c9753000-09c5-4f8f-88b9-5b2918564811（workflow d5b197d5-b0d4-4927-90b1-8c38e695221b）已逐节比较用户风格全文、原稿与新稿，并核对相关契约，Findings none；无阻止T1/T2验证的风险。主Agent接收前实际复算Wiki及17个支持文件哈希均与Result匹配，无内容漂移。Reviewer未运行shell/哈希/联网/测试/彩排已披露，不将读取作者证据当作独立复跑。

## Verification

- Passed: Review Passed后重跑终验：YAML完整且与原稿一致、MyWiki realpath归属、标题日期、13个来源链接可达、来源附录原样保留、8章40分钟及8分钟演示、禁用表达和尾部空白检查均通过；Wiki SHA-256及17文件支持包SHA-256与Result和审查快照一致。Context validate与索引diff --check通过；task_focus实调用确认绑定当前记录。主Agent回读及独立Reviewer均确认风格落实且事实边界保留。只更新原Wiki与本任务生命周期/原稿证据，未更新MyWiki局部索引或项目事实；未运行测试、现场彩排或模型评测。
