# SOLO 实现自检

## 原始要求与接受边界

用户要求把 autonomous 命名为 SOLO，并跳过外部发布确认、X SOP 以及所谓安全暂停。主会话展示完整 Target：命令已授权范围内跳过 Task、外部发布与 X SOP 的框架二次确认；保留宿主／工具强制审批、更高优先级安全限制及用户明确暂停；本次只改机制、不恢复旧 X 批次。用户确认：“确定，在SOLO模式下，原来的task 二次确认分级将被完全跳过，Agent将被指定尽量完成最终的结果，而不需要在向用户询问操作”。

因此 SOLO 在分级前走独立路径，不以 L2 豁免冒充完全跳过；Agent 自行查证并决定目标内操作，不用 L3/L4 询问操作方案。真实缺失权限／身份／凭据等不得编造；完成不受影响部分后报告具体阻塞。R0/R1/R2 质量审查不是二次确认分级，保持不变。

## 逐目标观察

| Target | 实际结果与证据 | 局限 |
| --- | --- | --- |
| T1 | shared resolver／CLI、Pi 类型与菜单、Skill、README 统一 solo／SOLO。旧 autonomous 配置读取输出 solo；读取前后 SHA-256 完全相同。新 set solo 保存 canonical 值并保留 review 字段；set autonomous 返回 1。 | 旧存储兼容，旧写入参数不兼容，README 已说明；没有更改真实用户设置。 |
| T2 | 协议先 resolve mode，solo 不进入 L0–L4；runtime prompt 实际输出“bypass the entire L0-L4 second-confirmation grading path”。共享 SOP 应用边界和稳定契约明确 X／发布的 confirmation-only 步骤转为通知后执行，通用 SOP 要求询问不等于用户显式暂停。 | 行为由 Agent 遵循规则实现，不是工具拦截器。未做真实模型 replay、实际发布或 X 操作。 |
| T3 | prompt、协议、Skill 与 SOP 边界一致保留实质防护、宿主审批、真实用户暂停、账号／对象核对、防重复发送和平台限制；明确 mode 查询／切换不恢复旧批次。 | 仅静态场景检查与运行时注入文本观察，未尝试真实登录／审批／平台限制。 |

## 已执行检查

1. Node 语法检查：shared lib／CLI、Contract 注入脚本、task-mode 与 pi-settings 测试源码；TypeScript strip-types 语法检查：Pi lib／settings 扩展；全部退出 0。
2. Pi settings 扩展直接 import 成功；Node 的 MODULE_TYPELESS_PACKAGE_JSON 提示属于项目原有 TS 运行方式，没有为此修改整个包模块类型。
3. Skill Quality：task-mode、agent-hooks、agent-sops 均 0 failures；上下文预算 warning 分别为 1319、1621、2155 tokens，保留完整必要边界。
4. Context validate 返回 valid=true，git diff --check 退出 0。
5. 临时 CSL_AGENT_KIT_HOME／临时项目中实际执行多进程 CLI：空配置 confirm/default；global solo、project confirm、session solo 后输出 solo/session；更换 session ID 输出 confirm/project。清除覆盖后读取 legacy global autonomous 输出 solo/global。
6. legacy 文件读取前后 SHA-256 均为 `4d91909fbfb0f3658435c5ac662aaaec8070e53393e2885406fd3d668ea2e5cc`，证明读取没有改写。随后显式 set solo 保留 review.thinking=low 并写 task.mode=solo。
7. 给真实 Contract reader 传入 codex/session-start payload，输出 solo/session 及新的完整免确认策略；非法模式回退 confirm/configuration-error；旧 autonomous 写入参数退出 1 并提示 canonical 枚举。
8. npm pack --dry-run --ignore-scripts 实际清单包含 shared lib／CLI、task-mode Skill、trigger fixtures 和新 confirmation_cases.json。未发布。
9. 检索当前相关 runtime／文档／测试中的 autonomous，仅保留旧存储读取、拒绝旧写入测试、兼容说明及被替代旧 action 的说明；未重写历史任务记录和审查材料。

## 场景自审

`confirmation_cases.json` 的 10 个规范场景覆盖新任务、目标内操作选择、Plan 分配、X 已授权发布、仅草拟、用户显式暂停、宿主／登录阻塞、发送结果不明、模式查询及默认 confirm。逐项静态对照共享 SOLO 执行路径和 runtime prompt：确认步骤跳过，授权外操作／真实阻塞／防重复要求保留。场景文件不是模型执行通过证据。

## 范围与限制

- 未运行单元测试或项目测试套件，回归源码已更新但仅做语法／静态检查。
- 没有更新已安装 Codex 插件、重载实际 Pi、实测 TUI、执行真实发布或恢复旧 X 批次。
- 读取了用户级 x-timeline-engagement、x-post-comment-batch-replies、x-tweet-publishing SOP 以核对确认步骤与实质防护的区别，未修改这些外部文件。
- 工作区有大量先前未提交改动；本任务只拥有 SOLO 命名／配置兼容／确认规则和对应文档、用例变更，不把整份 Git diff 归因本任务。
