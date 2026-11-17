---
title: 通用经验
summary: 跨任务复用的质量检查、格式变更、证据判断、协作及Pi异常处理要求；提交保护细节见提交保护与命令检测主题。
---

- [2026-11-05] Skill质量门禁逐包或--all递归检查共享及项目叶子；共享发现递归，Claude manifest显式枚举，项目包不共享分发。检查frontmatter、JSON/YAML、已有agents/openai.yaml、资源和1000-token初载warning，两个routing配置同时存在才跑确定性路由。失败退出2、仅warning为0、调用错误1；不执行包脚本、项目测试、构建、打包、telemetry或非Skill规则检查。
- [2026-11-05] 修改Skill时 MUST 逐包检查，failure阻止完成；MUST 按语义评估warning。流程准确完整优先于预算warning，MUST NOT 为消警告删除或失真压缩核心判断、步骤、异常及完成条件；主SKILL MUST 能提供必要契约。结构通过不证明真实行为、宿主发现或安装效果。
- [2026-11-05] 共享格式变化时 MUST 先找全部生产者、运行消费者和fixture；规则、校验器及消费者 MUST 同步；同一候选 MUST 通过写入和运行解析，旧格式 MUST 只作有意历史/负向样例。兼容旧记录时，新建/重开/更新 MUST 仍按现规检查并拒绝不一致；未触及旧兄弟不阻塞，MUST NOT 顺带批迁。
- [2026-11-05] push受保护分支、打tag或发布后，最终CI的headSha MUST 等于远端目标HEAD且success；MUST NOT 用本地、dry-run、registry成功或旧commit结果替代。失败时 MUST 重开所属任务；修复后 MUST 验新run并记录ID/URL。
- [2026-11-06] evals仅本仓库，MUST NOT 进入共享skills、npm、全局安装或Pi共享命令；跨suite工具、suite案例和评测Skill MUST 各守目录，.agents入口仅相对软链接。生成结果默认ignored，持久产物 MUST 另获许可；布局查evals/README，Task Target v6语义/命令查专用评测技能与脚本。
- [2026-11-06] Task Target标签人工裁定前为provisional/report-only；prepare不含oracle，仅比较同一v6数据hash。固定候选、索引匹配和确定性检查不证明语义蕴含、自由生成或真实工具等待。付费模型、行为检查、self-test及项目测试 MUST 按当前明确授权执行；MUST NOT 伪造结果或保存隐藏推理、凭据、未脱敏会话。
- [2026-11-06] code-inline-review MUST 仅在显式请求时调用，为授权任务维护当前源码说明，任意编辑器可读；MUST 按逻辑组组织；机械变更 MAY 集中，整模块删除无需注释，关闭只停新增、讨论留聊天。commit-guard独立管理提交检查，agent-hooks只负责发现/调度/适配；MUST 保留历史规则ID和启停设置，保护默认开启，不依赖显式调用说明技能。
- [2026-11-09] Task重要事实明确后 MUST 先落盘再做依赖步骤；阶段切换、进展播报、委派交接或主动暂停前 MUST 检查漏记，按Execution Log契约更新并sync/check；无新事实 MUST NOT 制造日志。MUST 保留审查冻结和证据失效边界，MUST NOT 提前勾选未验证Target或用聊天代替记录；保存失败 MUST 披露并在恢复依赖工作前补记检查。提示词检查通过不证明自动保存或真实Agent遵循。
- [2026-11-12] 用户要求CSL Agent Kit的Pi集成 MUST NOT 因自身异常导致Pi崩溃退出；MAY 抛出错误以提示用户，但 MUST 保持Pi可继续交互。该要求适用于任务面板遇到任务存储错误的场景；错误提示不表示异常已修复。用户提供的崩溃堆栈显示 `Task target exists without a completed storage migration` 从task-storage.layout经renderIndexHeading、renderTopicLines及TaskWidget.render进入TUI定时绘制并成为uncaughtException。会话诊断将触发条件解释为 `.csl-agent-kit/tasks` 已存在，但读取 `.csl-agent-kit/task-storage.json` 返回ENOENT；这不证明任务损坏、数据丢失或目录与标记变化的责任方，本批未独立核查文件系统。会话诊断指出，csl-task-overlay的Topics在TUI实际绘制时重新读取存储，刷新函数后续读取与格式化也可能抛错；仅保护最初的存储检查不足以隔离绘制及定时刷新异常。会话报告的处理覆盖实际绘制及完整刷新，保留存储检查、具体错误和定时刷新，使存储恢复后任务与Topics可自动恢复；错误提示更新失败时退回控制台输出，避免定时器抛出未捕获异常。报告真实模块冒烟验证了异常隔离、恢复和正常显示，但未跑单元或项目测试，也未验证重新加载后的真实交互终端；本批未独立核验，MUST NOT 据此认定宿主已加载或通过交互验收。
