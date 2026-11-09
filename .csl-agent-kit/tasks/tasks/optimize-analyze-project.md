# 优化 analyze-project skill

Status: Completed (2026-08-10 19:22)
Kind: Plan

## Target
- [x] T1: analyze-project 只保留一个 need-driven 报告合同；develop/learn 仅作为 focus alias，调用解析、默认 need、active path 与歧义时零写入行为均有确定性定义。
- [x] T2: 报告只保留直接答案、need 范围内工作模型、关键证据链与验证锚点；learning focus 仅追加一个 Prediction 和至多一个当前源码 Transfer，不再生成课程化或宽泛 inventory。
- [x] T3: scope、证据、运行授权、secret redaction、freshness、替换确认和 Node 标准库发布流程满足 no-clobber/旧 bytes 保留边界，并明确不承诺并发隔离、hostile TOCTOU 或 fsync durability。
- [x] T4: contract/value/trigger/semantic fixtures、README、repo-map 路由边界及旧 PRD/任务状态与新合同一致；旧 docs/analysis/learning 历史报告保持不动。
- [x] T5: JSON 可解析且人工核对，两个冻结 value case 各至少有一个 accepted attempt；trigger eval、local quality gate 结构校验、npm test 与 git diff --check 通过，resource boundary check 除项目规则允许的初始加载 token 超限外无其他失败。
- [x] T6: analyze-project 的当前产品合同只生成一份系统化 project/component report；报告不以具体问题、Need 或单条行为链作为组织主轴。
- [x] T7: 报告以 Scope Summary、按需 Domain Glossary、Functional Module Map、Core Working Flows、按需 Cross-flow Invariants 组织，并以源码锚点证明主要职责、功能边界和核心流程，同时排除穷举 inventory、审计与实施建议。
- [x] T8: invocation、trigger/contract/semantic fixtures、README、repo-map 边界、PRD 状态、历史任务说明与 CTX-analyze-project 均反映系统化报告合同；旧 learning 报告与历史 eval artifacts 保持不动。
- [x] T9: 一个禁用 ambient skill 的 fresh-context 子 Agent 使用当前 skill snapshot，在 ZHShortStory 重新生成系统化 project report；父 Agent 确认它覆盖主要功能模块和多条核心工作流，而不是回答单一细节问题，并打开报告。
- [x] T10: JSON、trigger eval、local quality gate 结构/resource checks、npm test、Context 校验与 git diff --check 通过；除项目规则允许的 workflow 初始加载 token 超限外无阻塞失败。
- [x] T11: 每份系统化报告都包含一张功能架构图；每条跨多模块、异步/外部边界、关键分支或重要状态迁移的复杂核心流程均有对应流程图，简单流程不被迫生成冗余图。
- [x] T12: 图表按关系选择 architecture flowchart、sequence 或 state diagram；已有 Mermaid validator 时必须验证，无 validator 或验证失败时使用 ASCII 图而不是退化为纯文字，且图与职责表/步骤不重复同一信息。
- [x] T13: contract fixtures、README 与 CTX-analyze-project 同步图表合同；fresh-context 子 Agent 使用当前 snapshot 再次替换 ZHShortStory 报告，父 Agent确认架构和复杂流程均有图并打开报告。
- [x] T14: JSON、trigger eval、local quality gate/resource、npm test、Context 与 git diff --check 重新通过；除允许的初始加载 token 超限外无阻塞失败。
- [x] T15: 报告 Metadata 的 `Scope` 显示被分析对象的 canonical absolute path，不再以 `.` 或 repo-relative path 表示；contract fixture 与 ZHShortStory fresh-context 报告同步并通过相关校验。
- [x] T16: 所有必需架构与复杂流程图都以 Mermaid code fence 表达，不再生成或回退到 ASCII 字符图；skill、contract fixture、CTX-analyze-project 与 fresh-context ZHShortStory 报告同步并通过结构、证据和仓库校验。
- [x] T17: 报告正文、表格与流程步骤中的每个源码证据锚点都使用 Markdown inline code 标记；skill、contract fixture、CTX-analyze-project 与 fresh-context ZHShortStory 报告同步，且不存在裸露的 `path#symbol` / `path#line` 证据。
- [x] T18: 报告中的源码证据不再连续追加在正文或表格单元格内，而是就近显示为独立 Markdown 列表；每项只包含一个 inline-code `path#symbol` / `path#line` 锚点，skill、contract fixture、CTX-analyze-project 与 fresh-context ZHShortStory 报告同步。

## Scope

包含：将 `analyze-project` 从错误的 question-answer 合同恢复为单一系统化 project/component report，强制提供有信息价值的架构与复杂流程图，迁移当前路由与声明式 eval 资料，保留必要安全发布边界，并用 ZHShortStory 的 fresh-session 模拟验证实际输出。

不包含：不新增 runner、parser、filesystem helper、race fixture 或第二种报告产品；不修改旧 `docs/analysis/learning/**` 报告和 `reports/analyze-project-evals/**` 历史证据，也不运行 ZHShortStory build/test。

## Decisions

- 用户已明确否定 need-driven 产品。T1、T2 与其既有 Result 仅记录被推翻的上一轮迭代；当前验收以 T6–T14 为准。
- 产品只有一个：针对唯一 Git project、目录组件或文件组件，生成一份可长期复用、源码可证的系统化当前状态报告。
- 调用以 `/analyze-project [target]` 为主；缺省 target 为 cwd。可兼容无行为差异的 `develop` 位置参数，`learn` 与 `--need` 不再属于当前合同。
- 系统化不等于穷举：只保留解释 scope 主要价值所需的最高层功能职责、直接外部边界、核心工作流、必要领域词和跨流程不变量；utility 与内部细节并入所属职责。
- 报告固定以 Scope Summary、可选 Domain Glossary、Functional Module Map、Core Working Flows、可选 Cross-flow Invariants 组织；测试证据就地归属模块或流程，不生成独立全量清单。
- project scope 覆盖项目主要职责与核心流程；component scope 只覆盖组件内部、直接上下游和参与的核心流程，不重新分析全仓库。
- 每份报告必须有一张功能架构图；复杂核心流程必须各有一张最合适的 flowchart、sequence 或 state diagram，简单流程仍可只用文字步骤。图表达关系、时序、分支或状态，职责表和步骤表达语义与证据，不重复同一内容。
- 图表只使用 Mermaid：按关系选择 `flowchart`、`sequenceDiagram` 或 `stateDiagram-v2`；已有本地只读 validator 时必须验证并修正，validator 缺失时仍保留 Mermaid，验证后仍无效时阻止发布。不得生成 ASCII 字符图；图表数量由复杂流程决定，不设固定数量。
- scope、授权、freshness、secret redaction、existing-report Replace/Cancel 与 Node 标准库 no-clobber/rename 发布边界沿用；旧 question-answer 报告替换时按旧 metadata fallback 安全处理。
- ZHShortStory 复测使用 `context: fresh`、`skill:false` 和当前绝对路径 skill snapshot，以模拟新 session 首次加载；temp cwd 只用于把宿主 `.pi-glla` 元数据隔离在目标仓库外，不代表 Git worktree 隔离。
- skill runtime prose 继续使用英文；历史 eval artifacts 保留为被推翻迭代的审计证据，不冒充当前验收。
- Metadata 的 `Scope` 是被分析 target 的 canonical absolute path；它用于消除 `.` 在脱离仓库上下文后的歧义，不改变报告 active path 或源码证据继续使用 repo-relative anchors 的规则。
- 用户已纠正 T17 的展示方式：每组 repo-relative 源码证据必须放在相关正文、模块或步骤后的独立 Markdown bullet list 中；每个列表项只放一个 inline-code 锚点，例如 `Classes/Foo.swift#Foo.run` 独占一个 `-` 列表项，不得连续追加在正文或表格单元格内。

## Plan

1. 在 SKILL 与 report contract 中加入自适应强制图表合同：架构图必需，复杂流程图按关系类型生成，validator 不可用时保留 ASCII 图。
2. 同步声明式 contract cases、README 与 Context Pack，并重跑结构、路由、资源、仓库和 diff 校验。
3. 从仓库外 temp cwd 启动一个禁用 ambient skill 的 fresh-context 子 Agent，完整读取当前 snapshot 并获授权替换 ZHShortStory 旧报告。
4. 父 Agent 核对图表覆盖、非重复性、系统化内容、源码锚点和目标工作树，打开报告后记录 T11–T14 证据并完成任务。
5. 将 Metadata `Scope` 改为 canonical absolute target path，同步声明式 fixture，并用 fresh-context 子 Agent 重新生成、检查及打开 ZHShortStory 报告。
6. 将全部必需图表收敛为 Mermaid-only，同步 contract fixture 与 Context Pack，再用 fresh-context 子 Agent 重生成并打开无 ASCII 图的 ZHShortStory 报告。
7. 强制所有源码证据锚点使用 Markdown inline code，同步 fixture 与 Context Pack，再用 fresh-context 子 Agent 重生成并检查 ZHShortStory 报告不存在裸露锚点。
8. 将证据展示改为就近独立 Markdown 列表，同步 contract fixture 与 Context Pack，再用 fresh-context 子 Agent 重生成并检查 ZHShortStory 报告不存在正文尾随证据链或表格内证据锚点。

## Result

- T1: 人工核对最终 SKILL 与 report contract：单一 need-driven 合同、focus alias、默认 need、active path、歧义零写入均已定义；trigger eval 26/26 通过。
- T2: need-contract-v3 的 standard 与 learning 冻结报告分别为 31/233 与 54/361 行/词，均 accepted；learning 仅含一个 Prediction、一个 Transfer 与 Key。
- T3: 人工核对 37 个声明式 contract cases；两份 accepted transcript 均执行 owned open(wx) temp 后 link 发布，合同明确 replacement、redaction、freshness 与不承诺边界。
- T4: README、repo-map、两份旧 PRD、旧任务与 CTX-analyze-project 已同步；旧 docs/analysis/learning 的 git diff 为空，旧路径引用仅余明确历史/归档说明。
- T5: JSON 解析为 37 个 contract 与 2 个 value case且 ID 唯一；v3 两案 accepted；trigger 26/26、npm test 83/83、git diff --check、Context/Lessons 校验通过；两 skill 的 local quality gate 结构校验通过，唯一允许的资源失败为 analyze-project 初始加载 1120>1000，repo-map 为 950。
- T6: 最终 SKILL 只定义系统化 project/component report；主调用为 target 加可选无差异 develop alias，Need、detail-answer 与 Learn 模式均被排除。
- T7: report contract 固定 Scope Summary、可选 Glossary、6 列职责 Module Map、Core Working Flows 与可选 Invariants，并以系统覆盖门、就近源码锚点和 density gate 阻止单链问答与穷举 inventory。
- T8: 46 个声明式 contract cases、trigger/semantic fixtures、interface、README、repo-map、Develop/Learn PRD 状态、历史任务说明与 CTX-analyze-project 已同步；value case 文件删除，旧 learning 报告和历史 eval artifacts 未改。
- T9: fresh-context delegate a6424724 以 skill:false 读取当前 snapshot，在外部 temp cwd 获准安全替换 ZHShortStory 报告；最终 100 行/652 词，含 6 个功能模块、5 条核心流程、3 个跨流程不变量和 34 个有效 evidence files，已 open 打开。
- T10: JSON 与 ID 校验通过；trigger 26/26、npm test 83/83、Context validate、git diff --check 通过；analyze-project 与 repo-map 的 local quality gate 结构检查通过，唯一允许的资源失败为 analyze-project 初始加载 1187>1000，repo-map 为 950。
- T11: 父 Agent 核对最新 ZHShortStory 报告：Functional Module Map 前恰有 1 张功能架构图，7 条具备分支、外部协作、状态迁移或多模块顺序的核心流程各恰有 1 张图；52 个 contract cases 同时覆盖简单线性流程不强制图。
- T12: 目标环境无 mmdc/mermaid/mermaid-cli；fresh-context 输出按合同保留 8 张 ASCII 图（1 架构、7 流程），架构图位于职责表前且每张流程图位于编号步骤前；父 Agent核对图负责结构/时序/分支/状态，表格和步骤负责语义、证据及失败出口。
- T13: SKILL、report contract、52 个 contract cases、README 与 CTX-analyze-project 已同步；fresh-context delegate f9162f55 以 skill:false 读取当前 snapshot 并重新生成报告，父 Agent确认 6 个模块、7 条核心流程、8 张图、6 个跨流程不变量、35 个有效 evidence files，并已用 open 打开。
- T14: JSON 可解析且 52 个 case ID 唯一；trigger eval 26/26、npm test 83/83、Context/Lessons、task check、report/diff whitespace 检查通过；repo-map local quality gate/resource 950<1000 全通过，analyze-project validate/lint/governance 通过，唯一允许失败为 initial-load 1281>1000（skill body 1085）。
- T15: report contract 与第 53 个声明式 case 已要求 canonical absolute target path；fresh-context delegate 2902062e 从 symlink 调用解析到 canonical root 并完整重生成报告，首行精确为 /Users/caishilin/Desktop/work/zhihu_components/ZHShortStory，父 Agent确认 7 个模块、5 条核心流程、6 张图、41 个有效 evidence files、无尾随空白，并已 open 打开。
- T16: SKILL、report contract、README、第 54 个声明式 case 与 CTX-analyze-project 已改为 Mermaid-only；fresh-context pi-agent 32df0175 完整重分析并替换 ZHShortStory 报告，父 Agent确认 1 张 Mermaid 架构图与 7 张 Mermaid 复杂流程图、0 个 text fence/ASCII 图、39 个有效 evidence files、canonical absolute Scope 和无尾随空白，并已 open 打开。
- T17: SKILL、report contract、第 55 个声明式 case 与 CTX-analyze-project 已要求每个证据锚点单独使用 Markdown inline code；fresh-context run 在 transport abort 前安全发布完整报告，父 Agent确认 176/176 个 path#anchor 均分别包裹、0 裸露锚点、34 个 evidence files 全部存在，并已用 open 打开。
- T18: SKILL、report contract、第 55 个声明式 case 与 CTX-analyze-project 已改为就近 Markdown 证据列表；fresh-context pi-agent 70f9d819 完整重分析并替换 ZHShortStory 报告，父 Agent修正 1 个错误目录锚点后确认 274 个证据均为单锚点 bullet、0 个正文/表格锚点、56 个证据文件全部存在，并已打开报告。
- Review gate: Skipped — 用户未要求独立 adversarial review；按项目规则跳过。

## Verification

- Passed: 55 个 contract cases JSON/ID 通过；ZHShortStory 报告含 7 张 Mermaid、6 条核心流程、274 个独立 Markdown 证据 bullet、56 个有效证据文件；npm test 83/83、Context/Lessons/task 与 git diff --check 通过；local quality gate validate/lint/governance 通过，唯一资源失败为规则允许的 initial-load 1382>1000。
