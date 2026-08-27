# 修复本地审计问题

## 假设与成功标准

- 假设本次修复覆盖审计发现的全部 5 个问题，不扩展 tips、SOP 或 Pi 的产品语义。
- 并发添加后仍严格满足 20 条、单条 120 字符和总计 2,000 字符限制，文件格式不损坏。
- 任一畸形 SOP、被其他 extension 消费的输入、排队输入或失败的设计工具调用，都不能污染下一轮上下文或阻断 tips 注入。
- `tips-doctor.sh` 在源码仓库和无 `.git` 的 npm 包目录中都能报告 hook 与 Pi lifecycle。

## 计划

- [x] 先补回归测试：并发 tips 写入、畸形用户 SOP、跨轮 prompt 残留、失败的设计工具结果，以及无 Git 元数据的 doctor 包目录。
- [x] 在 `tips-add.sh` 中用实际 tips 文件旁的可移植锁包住“读取—校验—初始化—追加”整个临界区；锁等待有上限并通过 `trap` 清理，避免并发越限、重复和部分初始化。
- [x] 在共享 SOP loader 中把 `name`、`when_to_use` 和 `globs` 规范为安全类型，并让单个不可读或畸形 SOP 降级而非破坏整批加载；Pi 候选匹配继续单独容错，确保 tips 始终可注入。
- [x] 删除 Pi 的单槽 `latestPrompt`/`input` 缓存，直接使用当前 `before_agent_start` 的 `event.prompt`，消除被消费输入和排队输入造成的串轮状态。
- [x] 仅在匹配的设计工具成功时追加 `figma-describe` 提醒，并覆盖成功、失败和重复提醒三种结果。
- [x] 让 doctor 从脚本物理位置解析 package root，不再依赖 `.git`；保持现有源码仓库输出格式。
- [x] 运行聚焦测试、`npm run check`、Bash/Node/JSON/TypeScript 检查、hook parity、npm pack 隔离验证和 `git diff --check`。
- [x] 做对抗性复核：强制终止后的锁清理、并发首次创建、畸形 SOP 与有效 SOP 共存、多条排队 prompt、失败工具结果，以及 npm 安装目录无 Git 元数据。

## 复核

- 新增并发回归后先复现 30 个写入全部成功，再用同文件锁把完整检查与追加临界区串行化；最终仅 20 个成功、文件保留单一标题且无重复，聚焦并发测试连续运行 3 次通过。
- SOP loader 现在逐文件容错并规范关键字段；Pi 候选匹配失败只清空候选，不再阻断 mandatory tips。畸形与有效 SOP 共存测试通过。
- Pi 删除原始输入单槽状态，连续 prompt 直接按当前 `event.prompt` 重算候选；失败和已提醒的设计工具结果不再追加提醒。
- doctor 改为从脚本物理路径定位 package root；临时无 Git 包目录测试和真实 `npm pack` 解包检查均能发现 UserPromptSubmit 与 before_agent_start lifecycle。
- `npm run check` 通过：6 个 CLI、10 个 tips、6 个 Pi 测试，共 22 个测试；Bash、Node、JSON、TypeScript、hook parity、signal lock cleanup、npm pack 隔离和 `git diff --check` 均通过。
- tips trigger eval 为 0 false positive、0 false negative；两个相关 skill 的 quick validation 通过。local quality gate 聚合审计的 lint、governance 和 resource boundary 通过，仅继续报告仓库既有的 `Missing agents/interface.yaml` 约定缺口。
- 已知边界：不可捕获的 `SIGKILL` 可能遗留 `.lock` 目录；命令会在 5 秒后失败并报告完整锁路径，不会绕过限制或损坏 tips 文件。
