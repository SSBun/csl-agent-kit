# 状态转换统一验证记录

本记录是主 Agent 的实际检查观察，不是独立审查反馈。最终源文件身份由本任务 managed snapshot 固定。

## 静态状态及指引核对

从当前 task-core.js 提取普通允许转换、pause 来源、完成来源，并单列 reopen，与共享状态规范的表格展开对照：两侧均为21条异状态转换，无遗漏或额外转换，保持七状态。图示中的 In Progress → Pending 仍保留，不作为暂停的替代。

三个任务族技能均引用新共享协议。新协议及暂停恢复说明的实际相对链接有效；核对消费者引用时只检查本次相关链接，没有把既有文档里的任务路径示例当作真实文件。首次通用链接扫描遇到示例占位路径而失败，改为检查实际新增链接后通过，不改写示例。

共享对齐协议、task入口和全局合约均有仅维护已有任务的停止分支：不先resume/reopen、不创建替代任务，不接受旧目标或清除原有确认/授权门禁。仅停止模型运行不隐含任务状态变更；要求实现/修复后暂停仍保留实施对齐门禁。已有Paused、Blocked、Cancelled、Completed按当前状态处理。

## 临时工作区真实 CLI 流程

在系统临时目录创建诊断记录，通过独立 Node CLI 进程执行，结束后清除目录。没有对其他真实任务做批量修改。

- suspend 缺少恢复摘要时拒绝，任务及索引字节不变。
- stash 按完整任务名称调用原pause入口，回读state=paused、八项resumeContext与本次输入一致，check确认索引一致。
- Paused无法直接退回Pending、进入审查、阻断或完成；重复suspend被拒绝，没有自动resume，失败后任务与索引保持不变。
- 从In Progress退回Pending仍被允许；Pending可以通过suspend加完整摘要进入Paused。
- In Review通过stash暂停时，保留Required、清除Verification并使assessment过期。恢复后Required仍在，没有恢复旧验证。
- Blocked拒绝suspend，原任务与索引不变；Cancelled不因stash自动恢复。
- 临时Completed记录拒绝suspend及普通resume，任务与索引不变；专用reopen仍可进入In Progress。
- status的suspended/stashed参数拒绝写入并提示使用pause，没有新增Suspended状态。
- 临时工作区validate通过。全部运行属于隔离CLI流程观察，没有调用单元测试或项目测试套件，也没有执行Git stash。

## Hook 输出与加载范围

实际运行runEvent，仅选择inner:csl-agent-kit-contract，分别使用pi、codex、claude-code宿主能力视图。三次均返回含新Task State Semantics、无Suspended、pause/suspend/stash统一意图、原记录不resume/reopen及写入后回读要求的提示，diagnostics为空，文本长度均21040字符。

Pi使用工具环境提供的实际会话ID；Codex和Claude Code未编造会话身份，其模式读取仅覆盖项目/全局配置。三个宿主的Hook show均显示该内置规则valid、supported、effective=active，源路径指向本工作区。该观察证明规则资格及真实脚本返回新内容，不等于相应宿主实例已启动或实际模型输入已加载。

现有Pi适配器在before_agent_start调度session-start钩子，每轮读取脚本输出；本次未修改或重载适配器，没有重启服务，也没有停止其他任务。未直接观察下一轮模型系统提示，未宣称所有旧会话、其他电脑或宿主已加载。

## 质量及限制

核心与CLI的node --check通过；task、task-plan、task-queue、agent-hooks的skill-quality均无failure，有既有上下文预算警告，task另有篇幅警告。git diff --check通过。仅规则指引及两个有界CLI入口行为发生变化，没有改动状态转换集合、名称身份、存储根或历史记录。

未运行单元测试、项目套件、全新Agent自然语言回放或真实多机接续。运行时的全部21条转换以静态集合对照覆盖；真实CLI流程只覆盖上面列明的路径和拒绝边界，不冒称每个门禁组合均有动态验证。注入提示不保证模型必然遵循；当前模型会话与其他宿主的实际加载是明确的覆盖限制。

工作区在本任务开始时已有前序任务及其他会话的dirty改动，包括暂停功能、按名称查找、面板错误处理、目标确认文案等。本次scoped diff可能包含这些既有差异；它们不自动属于本任务。审查需关注新增共享状态规范、仅停止分支、暂停意图及回读要求、两个命令别名和错误引导，并检查相关原有调用路径。
