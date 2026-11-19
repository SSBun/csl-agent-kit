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
- [2026-11-12] CSL Agent Kit的Pi集成 MUST NOT 因自身异常导致Pi崩溃退出；MAY 抛出错误以提示用户，但 MUST 保持Pi可继续交互。任务存储异常曾沿 `task-storage.layout` → `renderIndexHeading` → `renderTopicLines` → `TaskWidget.render` 进入TUI定时绘制并成为 `uncaughtException`。遇到 `Task target exists without a completed storage migration` 时，SHOULD 核对 `.csl-agent-kit/tasks` 是否已存在且读取 `.csl-agent-kit/task-storage.json` 是否返回ENOENT；该错误不足以判断任务损坏、数据丢失或责任方。任务面板的诊断 SHOULD 覆盖实际绘制与完整定时刷新中的存储读取及格式化；仅保护初始检查无法隔离后续异常。验查应覆盖具体错误提示、存储恢复后任务及Topics自动恢复、正常显示，以及提示更新失败时回退到控制台且定时器不抛出未捕获异常。模块冒烟无法证明宿主已加载或真实终端交互通过。
- [2026-11-18] 判断行为是否存在、生效、已修复或缺失时，搜索命中只提供候选。MUST 按 [Contract 的 Execution Evidence](../../../skills/meta/agent-hooks/references/csl-agent-kit-contract.md#execution-evidence) 从用户场景的当前版本和实际入口追到关键阻断、替代路径及结果消费；后续操作依赖旧结论时 MUST 复核决定性前提，明确用户确认目标、任务完成或记忆摘要的证据边界。决定性链路未知时 MUST 在主结论中说明已知与未知。追踪范围 MUST 与声明相称，MUST NOT 将普通调查一律升级为全仓审计、独立审查、新报告或内部思维链记录。[场景执行证据评估](../../../evals/execution-evidence/README.md) 的初始标注在人工复核前为 report-only；案例结构、质量检查和 Hook 输出无法证明宿主实际加载或真实 Agent 行为改善。
