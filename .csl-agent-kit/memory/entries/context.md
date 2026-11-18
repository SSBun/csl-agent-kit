---
title: 项目基础信息
summary: 项目定位、组件职责、命名、语言及本机数据边界；专题细节按当前索引读取。
---

- [2026-11-05] CSL Agent Kit为Codex、Claude Code、Cursor、Pi分发共享skills、rules、hooks与extensions；产品定位和发布边界以package.json、README及实际宿主能力为准。
- [2026-11-10] CSL来自用户姓名；用户最终确认继续使用 `csl-agent-kit`，取代名称待定及候选讨论。当前项目目录为 `/Users/caishilin/Desktop/personal/csl-agent-kit`；本地Git origin指向 `https://github.com/SSBun/csl-agent-kit.git`，package.json包名为 `@ssbun/csl-agent-kit`。这些本地配置已核对，不证明远端实时状态。更名时，GitHub、npm、CLI和本机数据路径 SHOULD 优先使用一致的独特基础名称，平台约束除外。
- [2026-11-05] 共享能力放skills/，项目专用入口放.agents/skills/；SKILL.md是运行契约。Agent Hooks注入稳定契约，具体流程归Skill或共享协议；pi/负责Pi集成，bin/、安装脚本和宿主manifest负责分发发现。
- [2026-11-05] Task/Plan/Queue管理可验收工作，Task正文权威、索引导航；Topic承载跨任务共享规格，Memory承载长期知识。Task路径由task-storage.js解析至唯一活动根，MUST NOT 从旧示例推断。
- [2026-11-05] Memory替代Context/Lessons，分用户级与项目级、不设Core/Normal；前台按需读取，独立Memory Agent维护两级。会话自动维护首版接入Pi；当前激活与迁移状态 MUST 现场核对。
- [2026-11-05] MUST NOT 用记忆替代正式规范、源码、验证证据或授权；MUST NOT 收录秘密、隐藏推理、推测和临时进度。语言 MUST 服从当前实际指令：本机文档、报告及回复用中文，AGENTS.md、CLAUDE.md和规则文件例外，代码标识符 MUST 保持原语言；MUST NOT 用历史英文约定覆盖现行要求；MUST 保留外语fixture，局部修改不授权批量翻译。独立对抗审查 MUST 仅在显式请求时执行；Task的R2普通审查义务 MUST 保留。
- [2026-11-09] 内置规则 MUST 用英文编写；ASD-STE100规则文本本身 MUST 按该标准编写；路径与英文回复规则的权威入口为skills/meta/agent-rules/agent-rules.md。英文回复采用STE不等于所有回复改用英文；非英文适用边界及字面内容保护以规则正文为准，未经指定版次核验 MUST NOT 声称正式合规。
- [2026-11-05] 本机数据根统一为~/.csl-agent-kit/，存用户经验、记忆、配置、审计和服务状态；MUST NOT 放仓库镜像或Skill源码软链接。安装发现入口与用户数据分开；修改SOP、Hook、安装和文档路径时 MUST 保持这一边界。
- [2026-11-05] 用户明确取消兼容要求的项目重命名，MUST 移除旧回退路径、环境变量和调用示例；MUST NOT 擅自保留兼容层；该例外不推广到未获同样要求的迁移。
- [2026-11-05] 产品名、插件名和marketplace名分别表达产品与分发来源，SHOULD 避免机械复制导致<plugin>@<marketplace>重复。当前组合为csl-agent-kit@csl-agent-market；更名时 MUST 先展示最终组合供确认。
- [2026-11-12] 用户要求Task系统 MUST 支持明确的Paused状态与主动暂停恢复；MUST 保存已完成工作、部分成果位置、验证、未完成事项、决策和下一步，以支持全新Agent会话或其他电脑恢复，MUST NOT 依赖旧聊天。恢复时 MUST 核对实际产物，必要依赖缺失时 MUST 明确阻断；跨电脑 MUST 保留记录、产物及依赖的取得线索，MUST NOT 因旧绝对路径失效而丢失线索。MUST 保留原任务与完成门禁，MUST NOT 自动Git stash或配置上传/云同步；跨电脑恢复以取得所需记录、产物和依赖为前提。保存恢复摘要不等于工作文件已同步，此需求本身不证明实现或验收完成。会话随后报告机制已完成，暂停保存停止点和环境依赖，暂停恢复保留未解决问题与必需审查，旧验证不作为当前结果；报告暂停、摘要完整回读、跨目录新进程恢复及状态边界验证通过。未运行单元或项目套件，真实第二台电脑、全新Agent完整接续及运行中Pi界面未回放；本批未独立核验实现或验证结果，MUST NOT 据此认定宿主已加载或真实跨机端到端已通过。
- [2026-11-12] 会话报告Task已支持按名称查看、暂停、恢复及关键词查找，ID入口保留，内部仍按原ID保存进度。完整名称唯一时直接定位；同名或部分名称返回候选，由用户选择，可用序号回答，不自动暂停或恢复；候选展示名称、状态和「状态时间」，该时间不是文件最后更新时间。名称查找先读标题，再完整解析匹配任务，因此不匹配标题的状态格式错误不阻断查找；匹配任务损坏或标题无法读取仍明确报错，不静默跳过。报告已验证唯一完整名称暂停/恢复及摘要回读，同名、部分名称和未找到时不改写记录；语法、技能质量和工作区检查通过，仍有既有篇幅警告。未运行单元、项目套件或全新Agent会话回放；本批未独立核验源码或行为，MUST NOT 据此认定宿主已加载或新Agent完整接续已通过。
- [2026-11-18] 会话报告本机 Orca 已登记 Git 项目 `csl-agent-kit`，目录为 `/Users/caishilin/Desktop/personal/csl-agent-kit`，工作区关联现有 `main` 分支，并已通过 Orca CLI 回读项目和工作区入口；未创建新的 Git worktree，未进行 GUI 检查或运行测试。本批未独立核验 Orca 登记，MUST NOT 将该报告视为 GUI 验证或后续创建 worktree 的授权。
- [2026-11-18] 用户明确要求 CSL Agent Kit 管理的项目内容 MUST 按统一文件结构保存在 `.csl-agent-kit/`，并进一步明确 Agent Rules 的统一目录规范 MUST 适用于所有全局规则和项目规则：全局规则保存于 `$CSL_AGENT_KIT_HOME/agent-rules.md`（默认 `~/.csl-agent-kit/agent-rules.md`），项目规则保存于 `<项目根目录>/.csl-agent-kit/agent-rules.md`；随包分发的内置默认规则仍保留在技能源码目录。会话报告全局规则原已位于正确目录并保留原位，发现的3份旧项目规则已迁移，加载顺序为内置→全局→项目；本批未独立核验文件、迁移或加载。既有 `.agents/skills/`、`.agents/hooks/` 等路径记忆描述原有布局，MUST NOT 据此否定统一目录要求，也 MUST NOT 仅凭要求或该迁移报告推断其他组件已切换、所有存储位置已覆盖或自动扩大搬迁范围。
