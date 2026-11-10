# 启用已审查的 ISO Memory 提示词

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-10 11:54) |
| Artifacts | [Artifacts](../artifacts/activate-iso-memory-prompt/) |
| Kind | Task |

## Scope

将已通过独立对抗审查的英文提示词接入现行Memory后台，并在空闲边界重载本机服务。沿用当前agent-memory作为操作契约，不修改存储格式、权限、保留策略或现有记忆；不处理链接打开问题、不发布包、不运行项目测试。

## Plan

1. 已将批准文本作为技能随包引用，替换后台内联旧提示词。
2. 已核对字节一致性、实际SDK系统提示加载、包内容与技能质量。
3. 已在空闲边界重载后台并确认新进程在线；核对最终内容身份后交付。

## Execution Log

### 001 — 加载路径与范围

现行agent.js将SYSTEM_PROMPT与当前SKILL.md及动态Memory roots组合；工具列表、scope校验和temp日期检查独立于该文本。采用技能references下的随包文件替换内联文字，保留其余运行逻辑。package.json已有skills/与bin/打包范围，无需修改发布配置。工作区存在其他任务修改，只修改本任务相关位置。

### 002 — 接入与验证

已将批准文本逐字节复制到skills/meta/agent-memory/references/recording-prompt.md，SHA256保持05fbf6e392677609bfc652be14fd530365148aece647ef015b2b32e4d44e1681。agent.js仅将SYSTEM_PROMPT常量改为读取该随包文件，其余代码摘要a107902ae9c71de0af13e50b2a6beb2b481b41214ed945334b07afb9c853bb37保持一致。Skill新增配套指导入口，无存储或权限规则改动。

node --check、定向git diff --check及npm pack --dry-run --json --ignore-scripts通过；发布清单包含JS、Skill和提示词。Skill Quality无failure，初载估算1529 token警告保留。实际SDK内存会话创建成功，系统提示前14790字符完整等于批准提示词+实际roots+当前Skill；SDK另外附加55字符cwd信息。第一次严格全字符串比较因该SDK附加信息失败，随后定位并确认不是正文缺失；未更改提示词来迎合断言。未发送模型请求或要求记忆写入，未运行项目测试。

### 003 — 等待安全重载

本机运行进程PID92317使用本工作区daemon.js，protocol=5；首次检查activeCount=1。当前批次未中断，服务重载等待其自然结束。

### 004 — 激活完成

等待旧批次结束后，service.restart在空闲条件下成功启动PID81353。复查running=true、protocol=5、activeCount=0，进程命令仍指向本工作区bin/memory/daemon.js。未关闭前台、未要求额外模型批次、未主动改写用户/项目记忆；原有后台任务正常运行不作为本任务写入。当前服务新进程已读取随包提示词，后续内存会话加载新版。

## Task Summary

**Memory后台**（[bin/memory](../../../bin/memory/)）：将内联旧SYSTEM_PROMPT改为读取技能包中的批准英文文本，保持工具、存储、调度和会话其他逻辑不变；本机后台已空闲重载。

**Memory技能**（[agent-memory](../../../skills/meta/agent-memory/)）：新增原样批准的ISO配套提示词及主Skill引用入口，操作契约继续由主Skill提供。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 仅三份产品文件变化，复用fs和已有打包路径；删除内联旧提示词，没有新增配置、依赖或抽象。 | 批准提示词保留任务原件作为审查证据，运行时只用技能随包文件。 |
| 稳定性 | A | 非提示词代码摘要不变，批准文本字节一致；语法、Skill质量、打包清单、真实SDK加载及后台重载检查通过。 | 未运行项目测试或实际模型维护批次；主Skill初载1529 token预算警告，不等于行为验证。 |
| 完整性 | S | 五项ISO提示词实际接入并随包，SDK组合当前Skill与roots，服务新进程在线；不依赖任务路径。 | 后续模型是否持续遵循全部指导仍需运行观察，不承诺语义合规。 |

## Target
- [x] T1: Memory运行时加载已审查英文提示词与当前agent-memory技能，五项ISO指导实际接入且不依赖任务产物路径
- [x] T2: 完成相关静态和加载检查，在服务空闲边界使本机后台加载新版，保留存储协议、工具权限和现有记忆内容

## Result

- T1: 运行时读取skills/meta/agent-memory/references/recording-prompt.md，其SHA256等于批准文本05fbf6e392677609bfc652be14fd530365148aece647ef015b2b32e4d44e1681；实际SDK系统提示完整包含文本+roots+当前Skill，另有正常cwd附加信息。打包dry-run确认三份相关文件随包，不依赖任务目录。
- T2: 非提示词运行代码摘要与修改前一致，node语法、git diff检查、Skill Quality无failure（1529 token warning）及包清单通过。旧批次结束后重载，PID92317→81353，running=true/protocol5/active0；未主动改写记忆或关闭前台，未运行项目测试及额外模型批次。
- Review gate: Skipped — 当前R1四项依据充分；本次仅启用原批准文本，无新增显式或既有独立审查义务。此前文本审批不冒充本次运行行为验证。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 将已审查文本按原字节接入现有加载点，工具及存储逻辑完全不变；直接加载和随包验证覆盖新增文件依赖。
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/activate-iso-memory-prompt/evidence/e63d7f62c2b2736b7eb18e80ff0dd0f2783235e22229b902eb781ff9c99ebe04.json#e63d7f62c2b2736b7eb18e80ff0dd0f2783235e22229b902eb781ff9c99ebe04
- Evidence: Result T1/T2及Execution Log 002/004。
- Result clarity: 明确启用批准文本并继续使用当前技能契约；不修改存储、权限、保留策略或记忆条目。
- Bounded impact: 三份产品文件，已有fs读取机制和skills打包路径；其余运行代码摘要相同。
- Low risk: 本地可逆加载点替换；无新增权限或数据操作，缺少文件将加载失败而不静默降级，实际打包及SDK加载已确认资源存在。
- Sufficient verification: 原文SHA256、非提示词代码摘要、node语法、Skill Quality、npm pack dry-run、真实SDK系统提示及服务重载检查通过；未运行项目测试和额外模型批次。
- Task fingerprint: c2e0eb154c9dba73134dfc8a0899d875756a6d8fe6c86c67c32f191d2cac83f7

## Verification

- Passed: 最终五文件快照身份一致，随包提示词仍与批准文本同hash，服务重载和SDK加载证据适用；自评无变化。项目测试及真实维护模型批次未运行。
