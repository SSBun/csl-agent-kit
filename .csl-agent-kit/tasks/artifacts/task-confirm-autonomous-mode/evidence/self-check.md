# 自检证据

## 原始需求与确认

用户原始请求：为当前 task confirm 增加无二次确认模式，输出 task 后尽可能直接执行到完成，覆盖各任务等级及发布等确认。

用户新增要求：状态必须持久化，支持会话级、项目级和全局级。

主会话展示了完整修订 Target：会话 > 项目 > 全局 > 默认确认；各层 autonomous／confirm／inherit，显示有效值及来源；免框架二次确认但保留任务记录、自动质量审查、验证、宿主审批、更高优先级安全限制和命令范围。用户回复“确认”。本次不自动开启任何真实用户配置，不发布。

## 实际检查

- 对新增两个 JavaScript 模块、Hook 注入脚本、新增测试源码执行 `node --check`；对修改的三个 TypeScript 模块执行 `node --experimental-strip-types --check`；对两个修改的 Pi 测试源码执行语法检查，均退出 0。
- 直接导入 Pi 设置扩展成功；Node 给出 MODULE_TYPELESS_PACKAGE_JSON 提示，项目已有 TS 模块依赖运行时解析，不修改整个包的模块类型。
- Skill Quality：agent-hooks 与 task 均无失败，分别有 1621 和 7896 估计 token 的预算警告。未删减核心契约来规避警告。共享 csl-tasks 是非 Skill 运行时组件，无 SKILL.md。
- Context validate 返回 valid=true；git diff --check 退出 0。
- 在临时目录中使用独立 CSL_AGENT_KIT_HOME，实际调用 CLI 多次（独立 Node 进程）：空配置为 confirm/default；写入 global autonomous、project confirm、session autonomous 后，有效值为 autonomous/session；更换 session ID 后为 confirm/project；另一项目为 autonomous/global；session inherit 后为 confirm/project。
- 同一临时配置下给真实 Contract 注入脚本传入标准 session payload，输出 autonomous/session；把全局 task.mode 写成 bad 后，即使已有 session autonomous，注入也降为 confirm/configuration-error。缺少宿主与会话 ID 的 session 写入返回退出码 1。
- 所有临时配置在检查后清除，没有修改用户实际设置。

## 逐目标证据与局限

| 目标 | 观察 | 局限 |
| --- | --- | --- |
| T1 | 共享协议明确 continue_autonomous 及完整 Target 后立即执行；CLI、设置面板和运行时注入均接入相同配置语义。 | 未进行真实模型自由生成、自动执行的回放；提示契约不保证任意模型都严格遵循。 |
| T2 | 协议与稳定契约覆盖命令范围内发布／部署的框架确认，并明确保留 host/tool approvals、上级规则与显式用户暂停。 | 未执行真实发布或危险操作。 |
| T3 | 缺省和错误配置均观察到 confirm；未改 Task core 的质量审查与终态验证门禁，未设置真实自主偏好。 | 单元测试和项目测试按用户规则未运行。 |
| T4 | 多进程 CLI 观察到持久化与三级优先级、inherit、项目和会话隔离；Pi 传递 getSessionId，已有原生 adapter 传递 native.session_id。 | 未在实际 TUI 点击或执行真实会话重启；会话恢复由同一稳定 ID 的读取路径支撑。 |

## 审查范围说明

工作区进入任务前已有大量修改。此次仅审查 snapshot.json 中列出的文件里与 Task 模式相关的实现及其直接消费者；其中既有的审查模型设置、Topic、iTermate 和 Task Review 基础实现不是本任务新增，不应将整份 git diff 归因本任务。版本由文件内容 SHA-256 固定，而不是只依赖 HEAD。测试新增／更新可读，禁止运行测试套件。允许只读源码检查和非测试的语法／结构检查。
