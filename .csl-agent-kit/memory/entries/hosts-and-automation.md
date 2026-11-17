---
title: 宿主与自动化
summary: 宿主Hook接入、持久规则注入、信任及设置解析；区分安装、配置、实际加载与运行效果。
---

- [2026-11-05] Agent Hooks以稳定CLI facade接入，rule/store/runtime/CLI/native模块分别负责语义、存储、执行与适配；adapter经createEvent/runEvent。rule/config/event使用agent-hooks/v1、agent-hooks.config/v1、agent-hooks.event/v1，环境为AGENT_HOOKS_*；schema、路径、inner覆盖、Rules来源、宿主能力或生命周期映射变化时 MUST 复核。
- [2026-11-05] 用户Hook规则/配置/脚本在<data-root>/hooks/，项目在.agents/hooks/；旧Triggerify根仅一次性迁移输入，成功后不再读。内置inner hooks随包、默认启用且源只读，用户通过config.json的disabledHooks/hookSettings控制状态。
- [2026-11-05] inner:agent-rules合并内置、用户、项目三个同格式agent-rules.md；AGENTS.md/CLAUDE.md不属于该系统，禁用会停止三层注入。诊断全局指令 MUST 核对harness实际来源及~/.agents/AGENTS.md，MUST NOT 把~/AGENTS.md、历史软链接或默认路径当成当前已加载证据；不同客户端可用不同来源。
- [2026-11-05] 常驻Contract由Agent Hooks注入，不再分发独立super-agent规则：稳定触发、强制动作及边界留常驻层，易变字段/循环/输出归Skill或共享协议；MUST NOT 压缩到只剩技能名。SessionStart覆盖startup/resume/compact，Pi每轮before_agent_start重建prompt，不由manifest重复cat。Contract用真实宿主/workspace/session解析Task模式，错误降回confirm并报错，不替换用户指令文件；无Hook场景仍 MUST 能判断何时加载和执行。
- [2026-11-05] Codex manifest组合共享hooks与专属codex-lifecycle.json，后者只补非阻塞Interrupt/SessionEnd，MUST NOT 放入Claude/Pi共享声明。iTermate adapter按宿主过滤，只有显式启用标记才向已装reporter转发原生payload，不安装/改写原生hooks或注入上下文；eligible、App opt-in、插件版本/信任与实际Socket投递分别验证。
- [2026-11-07] Codex、Claude、Pi支持session prompt，Cursor在能传injected context前为unsupported，不作文件替换回退。Codex非managed command hook逐定义hash保存trust，PostToolUse dispatcher MUST 先在/hooks信任。安装、配置及测试存在不证明实际注入，MUST 核对当前host的agent-hooks show及加载效果。
- [2026-11-05] 全局notify-todo-changed规则：Pi凭edit/write的changed_files，Codex保留apply_patch header fallback；脚本规范化真实路径并限制在workspace的tasks/tasks目录，通过terminal-notifier发可点击通知。当前路径兼容性 MUST 核对用户规则及脚本，不从历史实现推断已支持新Task根。
- [2026-11-05] 持久指令只在明确要求跨会话保存时创建，每条为用户数据根下独立global:directive-<subject> session-start/inject-prompt规则，不按prompt关键词匹配，不进入可分发Contract。Codex/Claude通过SessionStart注入，Pi每轮重建；hook-only UserPromptSubmit仅跑SOP candidates。仍保留高优先级指令及当前请求优先。
- [2026-11-05] /csl-settings的review.model/thinking保存于CSL用户settings.json，支持CSL_AGENT_KIT_HOME，不改Pi或pi-subagents配置。Task模式优先级session>project>global>confirm，新值solo/confirm/inherit，旧autonomous只读归一；项目按realpath摘要、会话按宿主/工作区/真实ID隔离，不构成仓库授权。Pi每轮重读，Codex/Claude在SessionStart读；无效配置降回confirm并诊断，无真实会话身份只解析项目/全局。task-mode复用共享解析器，Pi扩展独占/task-mode，/skill:task-mode仍可用，保存值与生效值分开报告。
- [2026-11-05] Pi jiti的moduleCache=false不清原生CommonJS缓存；设置扩展重载只清无状态task-mode直接依赖，不清无关模块或改配置，需同进程升级后重载验证。csl_review_config只读解析，主Agent MUST 把launch.model传入Reviewer；未设置项继承当时父会话值，不拦截全部subagent、不覆盖Editor或已有子Agent恢复契约。
- [2026-11-05] Hook运行指导随包自包含，以bundled CLI为行为权威，语言服从现行指令，项目RFC仅背景。Pi adapter以ctx.cwd构建事件，按toolCallId记write/edit前状态：成功返回工作区相对changed_files，失败/工作区外为空，其他工具unknown。validate-rules复用V1解析器校验候选frontmatter及语义；脚本可执行性和宿主effective状态仍查agent-hooks show。
- [2026-11-10] CSL Reviewer的用户指定默认模型为gpt-6.1-sol、思考强度low；会话报告的完整解析值为magpie/codex/gpt-6.1-sol:low，适用于后续新启动的Reviewer，已有子代理保持原配置。本批未独立读取实际配置；此设置不表示Memory后台或前台主模型也已变更。
- [2026-11-10] 已读取内置及用户级Agent Rules，两处路径条款现一致：聊天用纯文本绝对路径，Markdown文件用标准链接，网页不变。会话报告注入合并及差异检查通过，未测试或改Codex模型缓存；本批未验注入及会话加载。此前只读研究报告read-agent-rules.js拼接非空层且不检测冲突，Pi的csl-context-hooks.ts追加Hook上下文至event.systemPrompt；这不证明当时禁止URI的developer消息来自CSL，仓库未定位原文来源。MUST NOT 将文件一致等同实际加载、全规则无冲突或高优先级限制已消除。
