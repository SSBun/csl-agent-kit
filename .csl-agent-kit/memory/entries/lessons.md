---
title: 通用经验
summary: 跨任务复用的质量检查、格式变更、证据判断及提交保护经验；保留适用条件和验证边界。
---

- [2026-11-05] Skill质量门禁逐包或--all递归检查共享及项目叶子；共享发现递归，Claude manifest显式枚举，项目包不共享分发。检查frontmatter、JSON/YAML、已有agents/openai.yaml、资源和1000-token初载warning，两个routing配置同时存在才跑确定性路由。失败退出2、仅warning为0、调用错误1；不执行包脚本、项目测试、构建、打包、telemetry或非Skill规则检查。
- [2026-11-05] 修改Skill时 MUST 逐包检查，failure阻止完成；MUST 按语义评估warning。流程准确完整优先于预算warning，MUST NOT 为消警告删除或失真压缩核心判断、步骤、异常及完成条件；主SKILL MUST 能提供必要契约。结构通过不证明真实行为、宿主发现或安装效果。
- [2026-11-05] 共享格式变化时 MUST 先找全部生产者、运行消费者和fixture；规则、校验器及消费者 MUST 同步；同一候选 MUST 通过写入和运行解析，旧格式 MUST 只作有意历史/负向样例。兼容旧记录时，新建/重开/更新 MUST 仍按现规检查并拒绝不一致；未触及旧兄弟不阻塞，MUST NOT 顺带批迁。
- [2026-11-05] push受保护分支、打tag或发布后，最终CI的headSha MUST 等于远端目标HEAD且success；MUST NOT 用本地、dry-run、registry成功或旧commit结果替代。失败时 MUST 重开所属任务；修复后 MUST 验新run并记录ID/URL。
- [2026-11-06] evals仅本仓库，MUST NOT 进入共享skills、npm、全局安装或Pi共享命令；跨suite工具、suite案例和评测Skill MUST 各守目录，.agents入口仅相对软链接。生成结果默认ignored，持久产物 MUST 另获许可；布局查evals/README，Task Target v6语义/命令查专用评测技能与脚本。
- [2026-11-06] Task Target标签人工裁定前为provisional/report-only；prepare不含oracle，仅比较同一v6数据hash。固定候选、索引匹配和确定性检查不证明语义蕴含、自由生成或真实工具等待。付费模型、行为检查、self-test及项目测试 MUST 按当前明确授权执行；MUST NOT 伪造结果或保存隐藏推理、凭据、未脱敏会话。
- [2026-11-06] code-inline-review MUST 仅在显式请求时调用，为授权任务维护当前源码说明，任意编辑器可读；MUST 按逻辑组组织；机械变更 MAY 集中，整模块删除无需注释，关闭只停新增、讨论留聊天。commit-guard独立管理提交检查，agent-hooks只负责发现/调度/适配；MUST 保留历史规则ID和启停设置，保护默认开启，不依赖显式调用说明技能。
- [2026-11-10] 提交保护只读扫描暂存index的完整文件及二进制，区分大小写匹配由@code与-review拼接的保留子串；用户要求本仓库 `.csl-agent-kit/` 的全部内容（含所有子目录）MUST 豁免于审查标记检查，取代此前无文件豁免的要求；本批尚无实现或验证结果。目录外标记仍阻断，字符串或示例不单独豁免；协议实现 MUST 用拆分/转义，MUST NOT 借此夹带说明。不识别无标记或编码变形；仅工作区/未跟踪文件有说明不阻提交。MUST NOT 清理或重暂存；失败时 MUST 修复或获得清理授权；隐式暂存、路径提交、复合提交等无法可靠检查形式 MUST 拒绝。不提供push历史、密钥或通用质量扫描。
- [2026-11-06] shell检测 MUST 覆盖赋值、if/then、here-document后续、双引号内命令替换、反引号、前置重定向和time；MUST 保留单引号/普通文本非误报。不支持的可见执行结构 MUST 拒绝；MUST NOT 首词放行、把双引号全当文本或遇<<停止。sh/bash/zsh/eval在正常与解析失败回退路径的语义 MUST 一致；MUST NOT 把包装字符串当普通文本；MUST 识别git bisect run git commit；MUST NOT 按外层非commit放行。
- [2026-11-06] Pi提交阻断 MUST 通过tool_call返回block/reason，异常也 MUST 阻断，且 MUST 实际加载对应版本并启用规则；仅覆盖可见Agent shell调用，不覆盖外部终端、GUI或任意脚本，不安装原生Git hooks。检查与提交无跨进程锁，不保证并发index/原生Hook修改；跨客户端强制需Git/CI且本地Hook可绕过。preview-clean只预览，删除前 MUST 核实注释语法、原文和任务归属；MUST 保留业务代码、普通注释及部分暂存；保留解释时 MUST 先存任务产物；发布 MUST 另获授权；标记为保留前缀加:begin/end及组/块ID，无安全注释形式时 MUST 用关联说明或聊天/PR。
- [2026-11-09] Task重要事实明确后 MUST 先落盘再做依赖步骤；阶段切换、进展播报、委派交接或主动暂停前 MUST 检查漏记，按Execution Log契约更新并sync/check；无新事实 MUST NOT 制造日志。MUST 保留审查冻结和证据失效边界，MUST NOT 提前勾选未验证Target或用聊天代替记录；保存失败 MUST 披露并在恢复依赖工作前补记检查。提示词检查通过不证明自动保存或真实Agent遵循。
