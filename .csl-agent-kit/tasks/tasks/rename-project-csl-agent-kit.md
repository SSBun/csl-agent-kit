# 将当前项目重命名为 csl-agent-kit

| Field | Value |
| --- | --- |
| Status | Completed (2026-11-10 18:08) |
| Artifacts | [Artifacts](../artifacts/rename-project-csl-agent-kit/) |
| Kind | Task |

## Target
- [x] T1: 当前项目名称及本地项目目录统一为 csl-agent-kit，必要的项目标识与路径引用同步更新
- [x] T2: 原有代码、技能、任务及本地改动保留，完成可执行的路径与配置验证

## Scope

远程仓库、本地项目根目录以及必要的项目配置与安装路径引用。保留 skills/ 等功能目录、既有插件短标识及历史记录；不做通用词替换，不提交、推送或发布。

## Plan

1. 已核对远程及项目身份并完成目录移动和配置更新。
2. 已完成静态与入口验证；后续会话从新目录打开，旧兼容链接待无依赖时清理。

## Execution Log

### 001 — 范围确认与现场核对

用户在讨论名称后明确继续 csl-agent-kit 并授权执行。GitHub 返回 SSBun/csl-agent-kit，origin 及 npm 包名已正确，无需远程重命名。本地根目录仍为 skills，目标路径不存在。存在大量先前未提交改动，全部保留。发现 Pi、Codex、Claude、Cursor、npm 链接及云效 LaunchAgent 使用旧路径。Pi 官方包文档确认相对本地包路径以 settings.json 所在目录解析。

本会话宿主 cwd 固定在旧目录；为保持当前会话与已运行进程访问，目录移动后暂留旧路径兼容符号链接，实际项目根目录改为新路径。当前配置及有效链接将直接更新到新路径。历史材料、原本已经失效的遗留链接不改写。该兼容入口须在会话退出且无旧路径依赖后单独清理，不宣称旧路径已完全消失。

### 002 — 本地目录及当前入口已切换

已原子移动项目目录到 /Users/caishilin/Desktop/personal/csl-agent-kit，并创建旧路径兼容符号链接。移动前后根目录 inode、Git HEAD、暂存索引 SHA256 及完整 porcelain 状态逐字节一致，共 522 条原有状态记录，确认移动未改变原有 Git 改动。更新 Pi 设置与更新版本记录键、Codex 信任与 marketplace 路径、Claude marketplace 源与登记路径、云效 LaunchAgent 文件及 README 当前文档链接。Pi carrier、Cursor 插件入口和 npm 全局包符号链接已直接指向新路径。旧、新路径均无项目级 task-mode 配置，无需搬移偏好。

Memory 服务现场为空闲、无 active 作业；保留运行中服务及其旧 workspace 标识，通过兼容链接继续访问同一项目库，不直接改写后台数据库。该运行时身份尚未迁移，不宣称 Dashboard 或历史会话的名称全部已切换。未重启或触发云效 daemon，避免启动实际审批。

### 003 — 新入口验证完成

补充更新 Claude 项目登记及仓库路径映射、Codex 桌面端保存的工作区路径和显示名称，保留稳定项目 ID 与旧仓库映射别名。八份当前文件解析成功且均不含旧绝对路径，四个相关符号链接可达。全局 csl-agent-kit --help 正常显示 v5.2.0，新路径 Task check 和 git diff --check 均通过。证据保存在 ../artifacts/rename-project-csl-agent-kit/evidence/rename-checks.json，记录当前文件摘要与链接目标。未运行单元或项目测试，未重启宿主、Memory 或云效审批服务。历史记录与既有 csl 插件别名保留，不改名通用 skills 功能目录。

## Task Summary

**项目根目录**：原子移动到 /Users/caishilin/Desktop/personal/csl-agent-kit，保留旧路径兼容链接，更新 README 文档链接。

**本机宿主配置与安装入口**：同步 Pi、Codex、Claude 的当前配置与项目登记，以及 Cursor、Pi carrier、npm 链接和云效 LaunchAgent 文件中的项目路径。

## Self Assessment

| Dimension | Grade | Basis and evidence | Limitations |
| --- | --- | --- | --- |
| 简洁性 | S | 原子移动原目录并替换必要路径，未复制仓库、重构代码或全局替换通用词。 | 临时兼容链接需保留至旧进程不再依赖。 |
| 稳定性 | A | 移动时 inode、HEAD、索引摘要与522条Git状态一致；配置解析、链接可达性、CLI及Task读取通过。详见当前证据。 | 未重启宿主或云效服务；未运行测试；运行中Memory旧身份通过兼容链接继续使用。 |
| 完整性 | A | 实际目录、远程标识、包名及必要当前配置已统一，新配置无旧绝对路径。 | 旧会话、后台运行时身份与历史别名保留；不宣称旧路径完全消失或GUI已重载。 |

## Result

- T1: 实际项目目录已为csl-agent-kit，远程SSBun/csl-agent-kit及npm包名原已正确；必要当前配置、显示名与安装入口更新。旧路径仅保留兼容符号链接。
- T2: 原子移动时根inode、HEAD、Git索引SHA256与522条Git状态一致；8份文件解析、4个链接、CLI帮助、Task check及diff检查通过。
- Review gate: Skipped — See Review Assessment for the recorded exemption
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 同一工作区目录的原子移动及明确旧路径替换，不改变实现、权限或业务执行逻辑；兼容入口保留可恢复访问
- Snapshot: snapshot:.csl-agent-kit/tasks/artifacts/rename-project-csl-agent-kit/evidence/09a0fab1d1e176afd86e0fc501061664a53fb646beb3152f6b5097b44cbbe804.json#09a0fab1d1e176afd86e0fc501061664a53fb646beb3152f6b5097b44cbbe804
- Evidence: Execution Log 002-003及rename-checks.json；最终重新计算8份文件摘要并核对4个链接无漂移
- Result clarity: 用户确认csl-agent-kit并授权执行已展示完整目录及配置范围；远程与包名已符合无需变更
- Bounded impact: 原目录原子移动，当前配置仅路径/显示名替换；原有代码、短别名、历史与运行中服务保留
- Low risk: 保留旧路径兼容链接，不删除用户数据、不执行审批或发布；没有改变信任级别、权限或业务逻辑
- Sufficient verification: 直接检查配置解析和入口可达性、CLI与Task读取；移动前后Git状态与索引一致；未运行测试或GUI重载
- Task fingerprint: 98ea0d363911b7b9712367c3f5122aaa852ccb0c677b46e594891294a1fa1f13

## Verification

- Passed: 8份文件SHA256与4个链接目标在最终验收时均与当前证据一致；兼容链接、旧后台身份及未重载限制已披露
