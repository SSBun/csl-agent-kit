---
schema: csl-memory/v2
id: legacy-context-c9e1b7a7d7d8266238aa
revision: 5
type: reference
title: 项目约定与多 Agent 审查职责
summary: 稳定规则与易变流程分层；语言依当前指令，角色匹配工作阶段，审查按Required Outcome而非建议方案关闭。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#Decisions and Conventions:1
  - legacy:tasks/context.md;
    sha256:4342ff6b26b3f64b977205e94729ace7acf9ccec5441fbf312ea915e916098ad;
    unit:tasks/context.md#Decisions and Conventions:1
  - "skills/dev/adversarial-review/SKILL.md#Gate Contract; #Roles; #Workflow"
  - skills/meta/task/SKILL.md#Record Contract
  - skills/meta/agent-hooks/references/csl-agent-kit-contract.md#Contract
    Boundary
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-08-07 Skill packages use English:1
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-13 Separate Todo Planning From Plan Mode And
    Subagents:1
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-21 将易变工作流留在 Skill 中:1
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-20 让多 Agent 角色名匹配工作阶段:1
  - /Users/caishilin/AGENTS.md#Language Protocol
updated: 2026-11-05T11:35:20.147Z
deleted: false
retrieval:
  aliases:
    - 项目约定与审查职责边界
    - Required Outcome
    - Suggested Remedy
    - adversarial-review
    - Skill packages use English
    - plan mode
    - subagent
    - AGENTS.md
    - 多 Agent 角色名匹配工作阶段
  situations:
    - 区分审查问题与建议实现
    - 维护Skill语言或常驻规则边界
    - 精简规则时保留工作流触发条件
    - 区分任务计划与宿主执行能力
  topics:
    - 项目约定
    - 审查/职责边界
    - Skill/语言与规则分层
    - Task/计划与权限
  links:
    - kind: related
      scope: project
      id: legacy-context-4a9856c5741870ed4527
---

## 项目约定与审查职责边界

- 语言以当前实际注入的指令为准。本机 /Users/caishilin/AGENTS.md 要求文档、报告与回复使用中文，AGENTS.md、CLAUDE.md及规则文件例外；代码和标识符保持原语言。历史 Skill 包英文约定不能覆盖当前要求；故意测试其他语言的 fixture 保留，局部修改不授权批量翻译。
- 常驻 Contract 随 Agent Hooks 分发，不再分发独立 super-agent 规则。稳定触发、强制动作、顺序、跳过边界留常驻规则；易变字段、循环、输出归 Skill/共享协议。依赖 AGENTS.md 主动触发的流程，脱离 Hook 仍须能判断何时加载、实施前读写什么、何时可跳过，不能压缩到仅剩 Skill 名称。入口：`skills/meta/agent-hooks/references/csl-agent-kit-contract.md`。
- Task 中的可检查计划是持久控制/验证记录；不因此强制宿主 plan mode 或 subagent。能力按需要选择，具体权限和显式工作流要求仍取当前用户及适用指令。任务路径由活动存储根解析。
- Task 记录与审查门禁查关联 Task chip 及其权威 Skill：索引仅导航；只改所属记录及精确索引项，不重写其他任务或批量迁移历史。
- `skills/dev/adversarial-review/SKILL.md` 仅显式请求进入；R2 先完成 mandatory task-review。Finding 是证据化问题；Required Outcome 是必须达到的结果；Suggested Remedy 可接受、缩小或拒绝。关闭依据为结果满足或 finding 被证伪。
- BLOCKER 须有违反的要求/原则、可观察证据、实际风险、Required Outcome；QUESTION 只问缺失信息；NOTE 非阻塞，确认即可关闭。省略纯偏好、顺手重构、推测需求。Editor 审计当前充分性、最小修复、影响范围、比例性；满足要求的方案选范围更小、已证成本更低、假设更少者，以可观察证据判定。
- 完整 scope 和既有 finding 逐轮覆盖，不故意分轮释放；新 finding 须说明新证据或此前不可行动原因。不设总轮次上限；用户决定或客观停滞按状态暂停，不能用普通复审绕过。账本走 handoff，中间不写报告；结束/暂停写唯一 owning-task 报告，登记最终决定和链接。细节查该 Skill 的 `references/review-loop.md`、`review-lenses.md`、`final-review-report.md`。
- Swift 风格：`skills/meta/agent-sops/references/code-style/swift-style.md` 按主题收具体规则，仅精确语法/布局附最小代码例；适用边界及顺序归 `skills/meta/agent-sops/sops/code-style.md`。

## 多 Agent 角色名匹配工作阶段

## 2026-07-20 让多 Agent 角色名匹配工作阶段

- **Trigger:** 为答案形成、方案讨论或最终交付物检查设计多 Agent 工作流。
  - **Rule:** 答案形成阶段使用能表达综合与挑战职责的角色名，例如 Synthesizer / Challenger；Editor / Reviewer 只用于成稿后的修改与验收。不要因通信拓扑相似而复用阶段语义不符的角色名。
  - **Why:** 角色名会向用户和 Agent 暗示流程目标；混用会让讨论误读为批准门禁，并模糊 `deliberate` 与 `adversarial-review` 的边界。
