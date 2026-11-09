# 为 Task 确认机制添加自主执行模式

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-14 11:42) |
| Artifacts | [Artifacts](../artifacts/task-confirm-autonomous-mode/) |
| Kind | Task |

## Target
- [x] T1: 提供可显式启用和关闭的自主执行模式，启用后展示 Task Target 即继续执行，不等待框架级二次确认。
- [x] T2: 自主模式覆盖各任务等级及用户命令范围内发布等操作的框架级确认，不能越过宿主权限与更高优先级安全限制。
- [x] T3: 未启用时保留现有确认行为，自主执行保留任务记录、自动质量审查、结果验证及真实阻塞说明。
- [x] T4: 支持会话级、项目级和全局级持久化配置，可查看当前有效模式与来源；会话恢复、项目重开及新会话分别按对应作用域恢复配置。
- [x] T5: task-mode 作为共享 Skill 可被 Codex 等受支持宿主发现并调用，复用现有三层配置，提供查询、切换及恢复继承操作，并明确当前会话生效状态与宿主限制。

## Decisions

- 用户纠正：task-mode 必须作为可分发 Skill 被 Codex 检索和调用，不能只有 Pi slash 命令。用户已明确“确认执行”完整修订 Target；重开同一任务补齐 T5。保留已接受的配置语义与安全边界，不自动修改真实模式。

- 用户已确认完整修订 Target：会话 > 项目 > 全局 > 默认；各层允许 autonomous、confirm 或 inherit，默认保持现有确认行为。同一会话恢复保留状态，新会话不继承会话覆盖；关闭自主与清除覆盖是不同操作。
- 配置保存在用户数据目录；项目覆盖按规范化工作区路径隔离，避免仓库内容直接授予自主权限；会话覆盖按宿主、工作区和会话 ID 隔离。复用 Pi 设置面板，并提供跨宿主 CLI。
- 当前任务不启用任何真实自主配置、不执行发布，不运行单元测试或项目测试套件。验证采用语法、结构和隔离环境 CLI 行为检查，并保留 R2 独立审查。

## Plan

1. 实现三层配置存储、解析和可观察来源，保持现有审查设置。
2. 接入 Pi 设置面板与会话身份，以及共享 Hook 运行时配置注入。
3. 更新确认协议、稳定契约、使用说明及对应回归用例，保留质量审查和宿主权限边界。
4. 运行允许的检查，完成自检、独立审查和最终验证。

## Task Summary

**Task Mode Skill**（[共享 Skill](../../skills/meta/task-mode/)）：新增跨宿主可发现的配置入口，复用原 CLI；明确作用域、身份来源、保存后重读及生效限制。Claude manifest 增加发现条目，Pi 别名跳过同名直接命令；补充发现与冲突回归用例和使用说明。

**Task 确认配置**（[共享 Task 组件](../../skills/meta/csl-tasks/shared/)）：新增三层用户本地配置解析、原子保存及 CLI，扩展共享对齐协议以区分确认和自主执行，保留授权、宿主审批、质量审查及验证边界。

**Pi 设置与上下文注入**（[Pi 集成](../../pi/)）：设置面板新增 Task 模式入口和快捷命令，Contract Hook 获得真实会话 ID，复用跨宿主解析器。

**Agent Hooks**（[Agent Hooks 组件](../../skills/meta/agent-hooks/)）：稳定契约明确自主模式的行为与限制，注入脚本追加当前有效模式或配置错误降级诊断。

**使用说明与回归用例**（[README](../../README.md)、[测试目录](../../tests/)）：说明作用域、存储和生效边界，补充配置回归用例并更新已有 Pi 用例及测试入口；未执行测试套件。

## Result

- T1: 共享协议与配置入口完成；CLI 和 Hook 隔离检查见 evidence/self-check.md，未做模型自由执行回放。
- T2: 共享协议和稳定契约覆盖请求内发布确认，明确保留宿主审批及上级规则；未执行真实发布。
- T3: 隔离 CLI 和 Hook 观察到默认及损坏配置返回 confirm；任务审查和验证核心未变，未改真实配置。
- T4: 多进程 CLI 验证三级持久化、优先级、继承和身份隔离；Pi 真实 session ID 接入已检查，TUI 点击与重启未实测。
- T5: 共享 task-mode Skill 已创建，manifest 与 npm pack dry-run 确认分发入口及 CLI；Pi alias 冲突已消除。self-check-02.md 记录限制：未更新或实测已安装 Codex 插件。
- Review gate: Passed — fresh 只读 reviewer b8edcdb1-c5e0-43c8-94ad-434bf52dc90b 无发现，round-02.md 已保存；主会话逐项复算22文件和清单身份一致，补齐本轮版本绑定。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 重开补齐跨宿主 Skill 入口，保留既有 R2 必需独立审查；核对分发与身份边界。
- Snapshot: sha256:86f7745d18732eaed9ebc25fc5f3aa6613831dfbd489fc380bc6070c037d024b; tasks/artifacts/task-confirm-autonomous-mode/evidence/snapshot-02.json
- Evidence: tasks/artifacts/task-confirm-autonomous-mode/evidence/self-check-02.md；原配置检查见 self-check.md。
- Task fingerprint: 728b379125b4c50820e0252428e018bd827fa5fd1e8cc7ad76216b89820f883a
## Review Reports

| Round | Report | Snapshot | Outcome |
| --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/task-confirm-autonomous-mode/reviews/round-01.md) | sha256:014394d5b40e5095a7f275c55766caa74e9a2556e3dd42019b1e56d6de1d3913 | no blocking findings；主会话补齐 15 文件哈希复核，无漂移。 |
| 02 | [Round 02](../artifacts/task-confirm-autonomous-mode/reviews/round-02.md) | sha256:86f7745d18732eaed9ebc25fc5f3aa6613831dfbd489fc380bc6070c037d024b | no blocking findings；主会话补齐本轮 22 文件哈希复核，无漂移。 |

## Verification

- Passed: 本轮 Skill Quality 无失败（1151 token预算警告）、语法、Context、diff检查通过；22/22文件与复审快照一致，round-02报告身份匹配。包清单包含Skill和依赖；未运行测试或更新实际Codex插件。
