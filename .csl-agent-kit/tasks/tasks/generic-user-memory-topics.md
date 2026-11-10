# 用户记忆通用主题归并与持续约束

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-10 14:58) |
| Artifacts | [Artifacts](../artifacts/generic-user-memory-topics/) |
| Kind | Task |

## Target
- [x] T1: 当前用户级记忆归并为记忆管理偏好、Agent 环境与模型配置、工具使用与交互三个通用主题，保留有效知识、原有日期与必要适用条件。
- [x] T2: Memory Agent 持续加载的规范明确要求用户级主题通用、跨项目组织，优先复用宽主题，项目专属知识归属项目级，并核实规范加载路径。

## Plan

1. 更新后台实际加载的 agent-memory 规范，区分宽主题与案例适用条件。
2. 通过当前 writer 将六份用户记忆归并为三个通用主题，逐条保留原文日期和条件，回读后才删除替代源。
3. 核对索引与正文、规范加载和后台新会话，运行技能质量检查及独立只读复核。

## Execution Log

### 001 — 确认约束加载与迁移边界

用户已确认目标。agent.js 在创建 SDK Memory 会话时把 agent-memory/SKILL.md 拼入 system prompt，但会话可跨批复用；已运行会话不会自动更新规范，需服务空闲后安全重启以清空旧会话。当前用户格式为5，六份正文与先前索引一致，迁移只做当前格式归并，不运行 upgrade 或转换其他库。已按 memory read 获取六份完整hash。源正文的日期、条件与内容将在归并中逐行保留；新增用户主题偏好单独记录当日case。

源映射：memory-persistent-only → memory-management-preferences；claude-code-local-diagnostics、pi-magpie-model-overrides → agent-environment-and-models；pi-agent-desktop-integration、pi-ego-browser-entry、yunxiao-personal-skill-entry → tool-usage-and-interaction。当前 bin、pi、docs、skills、.agents 与用户当前正文中未检出这些稳定ID的引用，后续删除前复查。不会保留原文副本、迁移恢复文件或历史。工作区已有其他任务改动，本任务仅定点修改规范。

### 002 — 规范更新

agent-memory 增加用户级主题组织要求：跨项目通用领域、保留具体案例条件、优先检索已有宽主题、项目知识保持项目归属、不创建空分类、不把入口存在推导为使用偏好。三个主题为示例，非封闭清单。尚待质量检查、记忆归并与后台重新加载。

### 003 — 质量检查与并发准备

agent-memory 质量门禁通过（0 failure），接受 context-budget 警告：估算1699 tokens，保留必要约束。限定规范文件的 diff 检查通过。六个待替代ID已在运行时代码、技能、文档及登记工作区的当前记忆正文中检索，无引用命中；未知未登记消费者不在覆盖内。一次性归并执行器只使用 memory CLI writer，目标内容回读一致、源与目标hash再次一致且逐案例hash全部保留后才删除源；运行输入用后清理，证据只存hash与检查结果，不保存原文恢复副本。后台仍有活动批次，空闲停止尚未成功，记忆尚未修改。

### 004 — 改为受控维护暂停

多次空闲停止检查期间，后台持续接入其他工作区批次，无法获得自然空闲窗口。为完成用户授权的归并与规范重新加载，改用服务现有停止接口受控暂停，等待所有活动写入退出及进程锁释放，不删锁、不发送kill、不删除队列。活动批次将由现有流程记为 interrupted 或 exhausted（依既有尝试次数），恢复后遵守原重试上限，不重置计数。将核对实际停止和当前文件后才归并，完成后恢复后台。

### 005 — 采用后台已完成的等价归并

现有停止接口成功退出原 PID 37371，并核实服务 stopped；随后一次性执行器因 claude-code-local-diagnostics 已不存在而在任何 put/delete 前退出，临时输入与执行器已清理。回读发现后台在等待期间（06:46–06:47 UTC）已完成等价归并：保留 memory-persistent-only 身份并改标题为记忆管理偏好，另两份为 agent-environment-and-models 与 tool-use-and-interaction。该结果取代001中的拟定身份映射，不为匹配计划回滚有效更新。

主Agent对照本轮此前CLI完整读取，确认10条原case语义、日期与独有条件保留，新增1条用户级通用主题偏好，当前3份共11条case；部分文字被后台补全作用域，并非逐字复制。索引published，generation为 a058ce83069bf4a7c7128d4ccf1da3933d75329ab2f3740b0ce4ba24c7429e49。原文件已删除，独立Reviewer无法再从磁盘读取原文；该完整性对照属于作者证据，不冒称独立重验。未创建原文备份或恢复副本。

### 006 — 核实新会话加载与服务恢复

创建实际 SDK Memory 会话并检查 session.systemPrompt，确认包含当前完整 agent-memory Skill 和用户级主题组织章节；未调用模型生成。当前规范SHA256为62a82135213ed59f1db7014c4aba443362308d688519bcc4ec8aec26decc3f67。后台随后由现有机制自动恢复为 PID 13937，启动时间06:51:07.378 UTC，当前协议5；不是主Agent手工恢复的效果。新进程的会话从已更新Skill创建，原进程内旧缓存会话已退出。未建立永久或持续无写入隔离；送审与交付前必须复核当前三份hash，漂移则刷新证据和复核。

## Task Summary

**Memory 维护规范**：[/Users/caishilin/Desktop/personal/skills/skills/meta/agent-memory](/Users/caishilin/Desktop/personal/skills/skills/meta/agent-memory) 增加用户级通用主题组织要求，明确主题、案例条件、作用域与新建主题边界。

**用户记忆**：[/Users/caishilin/.csl-agent-kit/memory](/Users/caishilin/.csl-agent-kit/memory) 已由后台归并为三个通用主题；前台核对并采用此结果，未重复覆盖。记忆管理偏好保留原有稳定ID，三份保留有效知识和日期，并补充通用主题偏好。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 仅给既有Skill增加一节规范，复用现有writer与后台prompt加载，无新schema或调度机制；采用等价归并而不重复写入。 | 三主题不是封闭分类。 |
| 稳定性 | A | 对照归并前CLI完整读取与现正文，10条知识和日期保留；当前索引published；实际SDK prompt含完整新版Skill；质量与diff检查通过。 | 原文已由后台删除，独立复核不能从磁盘重新读取；后台恢复后无持续隔离，需最终hash检查；未运行测试。 |
| 完整性 | A | 三份通用主题与持续加载的约束均具备，当前有效身份、hash与加载结果记录在current-verification.json。 | 主题语义由模型遵守，不是存储层硬编码分类；未用模型生成回放证明长期遵循。 |

## Result

- T1: 当前用户索引published且仅三主题，11条case包含10条原知识及日期和1条新主题偏好；依据此前CLI完整读取作语义对照。采用后台等价归并，前台执行器因源已替代在写入前退出。完整性为作者对照证据，原文件已不存在。current-verification.json记录当前hash及范围。
- T2: agent-memory/SKILL.md新增用户级主题组织章节；实际创建SDK会话检查systemPrompt包含完整当前Skill及该节，未调用模型生成；服务已恢复新PID13937，旧进程会话退出。Skill质量0错误、1项1699-token长度警告，限定diff检查通过。语义约束非schema硬编码，未运行测试或模型遵循回放。
- Review gate: Passed — fresh只读Reviewer 72501e68-8842-418c-9b87-b8a5b5be7eac无finding或阻断风险，round-01已保存并索引；主Agent check-evidence通过，外部三份正文hash及索引generation与送审一致。原文语义对照为作者证据、未运行未来遵循回放等限制保留。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 用户级持久知识归并移除旧文件，涉及数据保真和后台持续提示词约束；需独立复核当前内容、保留条件和加载证据。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/generic-user-memory-topics/evidence/ef7d000a482c0b0cb86bd6dc1c08f0c6fc8afffc2771191d0d7a14edbc42337a.json#ef7d000a482c0b0cb86bd6dc1c08f0c6fc8afffc2771191d0d7a14edbc42337a
- Evidence: T1、T2 Result及current-verification.json；外部用户三份当前hash另由作者现场检查，非托管快照自动覆盖。
- Task fingerprint: acdec0649e9904028131e7d57679af6dc460a962461fc5066010e777de3f8c38

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/generic-user-memory-topics/reviews/round-01.md) | snapshot:.csl-agent-kit/tasks/artifacts/generic-user-memory-topics/evidence/ef7d000a482c0b0cb86bd6dc1c08f0c6fc8afffc2771191d0d7a14edbc42337a.json#ef7d000a482c0b0cb86bd6dc1c08f0c6fc8afffc2771191d0d7a14edbc42337a | no blocking findings | 6d7583d8d06695e8ae531a333567a13f927d21d28df35755c39f35bde89cfb49 |

## Verification

- Passed: 终态复查：托管快照与审查报告check-evidence通过；三份用户正文hash、文件数3及index generation与送审一致，published；Skill hash与实际SDK加载证据一致；后台PID13937在线。Self Assessment的依据与限制仍适用。未运行测试或模型遵循回放。
