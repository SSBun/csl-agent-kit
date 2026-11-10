# CSL Agent Kit 统一存储规范

## 状态与适用范围

本文件定义目标布局，不表示所有工作区和组件已经完成切换。当前Task运行时通过显式存储标记支持旧根到统一根的交接，详见[Task根迁移](task-storage-migration.md)；只有实际迁移完成后才使用新根。其他组件仍逐一核对安装版本及读写能力，不能由Task支持推断全部就绪。未切换的工作区保留原工作流，不直接创建第二份权威记录。运行时支持与某工作区已迁移是两个不同结果。已存在的Memory旧库默认只读；显式转换按指定scope执行，并永久移除旧历史、来源与恢复资料，不创建备份。用户明确要求Memory转换时，agent-migration协调预检、调用运行时及验证，不重复实现升级器，也不授权整体迁移Task、SOP等载体。下述通用迁移的备份、清单及恢复要求不适用于Memory当前内容转换，不得通过通用迁移目录转存Memory历史。

本规范约束 CSL Agent Kit 创建和管理的持久数据，包括 Task、Topic、归档、SOP、Rules、Hooks、Memory、配置及恢复材料。项目级数据统一位于 `<workspace>/.csl-agent-kit/`；用户级数据统一位于 `$CSL_AGENT_KIT_HOME/`，未设置时为 `~/.csl-agent-kit/`。环境变量是用户数据根的显式覆盖，不改变项目数据根。

## 目标布局

| 数据 | 项目级目标位置（相对工作区） | 用户级位置（相对用户数据根） |
| --- | --- | --- |
| Task 索引 | `.csl-agent-kit/tasks/tasks.md` | 不新增用户级 Task 副本 |
| Task 权威记录 | `.csl-agent-kit/tasks/tasks/<id>.md` | 同上 |
| Task 产物及审查证据 | `.csl-agent-kit/tasks/artifacts/<id>/` | 同上 |
| 对话归档 | `.csl-agent-kit/tasks/conversations/` | 同上 |
| Topic 索引及记录 | `.csl-agent-kit/tasks/topics.md`、`.csl-agent-kit/tasks/topics/` | 不新增用户级 Topic 副本 |
| Topic 关联恢复状态 | `.csl-agent-kit/tasks/topic-transactions/` | 同上 |
| SOP | `.csl-agent-kit/sops/` | `sops/` |
| Agent Rules | `.csl-agent-kit/agent-rules.md` | `agent-rules.md` |
| Hooks 规则及脚本 | `.csl-agent-kit/hooks/` | `hooks/` |
| Memory | `.csl-agent-kit/memory/` | `memory/` |
| 迁移清单、日志及恢复材料 | `.csl-agent-kit/migrations/<migration-id>/` | `migrations/<migration-id>/` |

保留 Task 子树的内部层次，避免不必要的链接改写。用户本机的项目及会话偏好继续位于用户数据根的 `projects/`、`sessions/`；不得改成仓库可控的授权设置。项目 Hooks 的位置变更不授予运行权限，不能把 metadata-only 升级为可执行。

## 所属权与例外

“全部内容”指 Kit 所属数据，而非整个工作区或整个 `.agents` 目录。第三方工具的数据、项目源码、构建产物和宿主配置不得因路径相近而迁移。

以下是分发或宿主发现入口，不属于 Kit 运行时数据：包内 `skills/`、随包 SOP 与规则、插件清单、宿主要求的 `AGENTS.md` / `CLAUDE.md`、`.agents/skills/` 技能安装或项目源码、`.agents/plugins/` 等宿主入口。保留它们的必要位置，不将本仓库所有文件搬入数据目录。Kit 后续新增持久数据必须落在上述两类数据根中，不得再自行使用工作区根部 `tasks/` 或 `.agents/` 保存 Kit 数据。

## 过渡与迁移契约

1. 旧项目仍可能以 `tasks/`、`.agents/sops/`、`.agents/agent-rules.md`、`.agents/hooks/` 为实际来源。这些是迁移输入，不是新的默认布局。
2. 读写双方必须就绪后才允许切换：至少检查 Task 核心、Topic、SOP 发现、Rules 注入、Hooks、归档、宿主任务面板及正在运行的后台服务中与本项目有关的读写方。文档更新、目录存在或命令成功本身都不能证明支持新布局。
3. 目标布局不改变 SOP 的项目 > 用户 > 内置优先级、Rules 的合并顺序或现有权限边界。同时出现新旧内容时不按时间戳猜权威源、不自动合并、不双写。识别当前运行时及记录关联，列明冲突，由用户决定实质冲突的处理。
4. 旧项目迁移交给 `agent-migration`，必须先生成精确清单、确认所属权和目标冲突、保存恢复材料，再执行已批准的范围。迁移不能成为普通任务启动的隐式副作用。
5. 迁移保持内容、关联、历史证据和权限；验证引用及完整性后才能清理已验证的源。不可变证据不做批量文本替换；受路径绑定影响的摘要或快照必须通过所属组件的显式迁移机制处理，机制缺失则阻止该项迁移。
6. 当前仓库的活动任务在运行时切换前继续使用已存在的旧存储。不得为遵从新文档而手工绕过任务 CLI、重写历史记录或搬移并发任务。

## 验收边界

- Skill 和规范使用一致目标路径，并明确当前运行时状态。
- 源码与宿主入口保持原位；旧记录仅作为迁移输入，不批量改写。
- 迁移可预览、可中断恢复，冲突不覆盖，失败可回滚。
- 完成声明区分“规范更新”“运行时支持”“某项目已迁移”，三者不能互相代替。
