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
