# 根据当前对话刷新终端标签标题

Status: Completed (2026-07-28 12:07)

## Scope

- 包含：把 Pi 当前活跃会话分支的文本对话与最新用户请求发送给独立、无会话、无工具的快速模型生成短标题。
- 包含：确认、继续、提交、推送、测试、重试等不改变主任务的跟进请求保持原标题。
- 包含：标题模型失败或没有返回有效决定时保持原标题。
- 不包含：发送工具调用与工具结果、根据实际工具调用判断标题，或为其他宿主新增独立模型认证配置。

## Target

- [x] T1: 提交会改变当前主任务的用户 prompt 后，根据项目名与当前会话主任务生成简短、安全的终端标题。
- [x] T2: 内置 Triggerify hook 在 Pi 上显示为 valid、supported、active，并使用可执行脚本。
- [x] T3: 无可写祖先 TTY 时静默跳过，不阻断 Agent；动态标题中的控制字符不会进入 OSC 序列。
- [x] T4: 使用本机可用的 `deepseek/deepseek-v4-flash` 独立分析可用会话上下文，并仅返回简短标题。
- [x] T5: 标题生成不阻塞主 Agent；并发请求完成顺序颠倒时，旧结果不会覆盖新标题。
- [x] T6: 模型失败时保持当前标题，规则继续在 Pi 上保持 active。
- [x] T7: 模型明确判定最新请求仅为确认、继续或例行操作时不写 OSC 标题。
- [x] T8: 标题模型失败或未返回有效标题决定时不写 OSC，保持当前标题。
- [x] T9: Pi 标题模型基于当前活跃会话分支的用户与助手文本以及最新用户请求选择最能代表会话主任务的标题，而不是只概括最后一个 prompt。
- [x] T10: 会话上下文不包含工具调用或工具结果，并受确定性长度上限约束；既有标题清洗、并发防旧结果覆盖和无 TTY fail-open 行为保持不变。

## Plan

1. 从 Pi 当前活跃分支提取有界的用户与助手文本，并连同最新 prompt 传给标题 hook。
2. 让标题 worker 只在模型返回有效新标题时写入 OSC，失败或保持决定均不写入。
3. 用回归测试覆盖上下文提取、失败保持、会话级命名及既有安全和并发行为。

## Result

- T1: 会话上下文模型实测把新会话 `Build authentication cache invalidation` 命名为 `Authentication cache invalidation`，并把主任务切换识别为 `research terminal tab title hook`；`buildTitle` 回归测试确认有效模型标题仍生成 `app · Build Authentication`。
- T2: `show inner:refresh-tab-title --host pi` 显示 `enabled`、`valid`、`supported`、`active`，脚本保持可执行。
- T3: 当前链路找到 `/dev/ttys019` 并成功执行 OSC 0 写入（退出码 0）；从 PID 1 开始查找返回 `null`，脚本对无 TTY 和运行异常均 fail-open。
- T4: `deepseek/deepseek-v4-flash` 隔离调用继续启用 `--no-session --no-tools --no-extensions --no-skills --no-context-files --thinking off`；四个会话上下文样例均在 1.1–1.4 秒返回有效标题或 `KEEP_CURRENT_TITLE`。
- T5: 后台 worker 启动耗时 10ms；每个 TTY 的 token 发布与最新 token 检查、OSC 写入由同一原子目录锁串行化，相关 self-test 通过。
- T6: 空模型结果现在由 `buildTitle` 解析为 `null` 并跳过 OSC；Triggerify CLI 显示规则 `enabled`、`valid`、`supported`、`active`。
- T7: 实际模型调用对 commit/push 型跟进和不改变主任务的解释请求返回 `KEEP_CURRENT_TITLE`，worker 将其解析为 `null` 并跳过 OSC 写入。
- Review gate: Required — 全局 `prompt-submit` hook 会把最新用户任务额外发送给模型 provider，涉及隐私和全局 Agent 生命周期行为。
- Review: `SUPERSEDED` — [快速模型终端标题 Hook 审查](../../reports/adversarial-review/refresh-terminal-tab-title.md)
- Follow-up review gate: Skipped — 仅调整既有模型输出协议和单脚本分支，隐私边界未变，且新标题与保持原标题均有确定性回归测试和实际模型样例。
- T8: 脚本 self-test 与 Triggerify 回归测试确认模型返回空字符串时 `buildTitle` 返回 `null`，不再使用本地 prompt 摘要。
- T9: Pi adapter 使用 `buildContextEntries()` 提取当前 compaction-aware 活跃分支；四个实际模型样例证明例行跟进保持原标题、主任务切换生成新标题。
- T10: 新回归测试确认 12,000 字符上限同时保留会话开头和最新请求，并排除 assistant tool call、tool result、thinking 与 image 内容；`npm run test:all` 全部通过。
- Current review gate: Required — Pi 会把最多 12,000 字符的活跃会话文本发送给独立标题模型，扩大了隐私边界并影响全局 Agent 生命周期行为。
- Current review: `APPROVED` — [快速模型终端标题 Hook 审查](../../reports/adversarial-review/refresh-terminal-tab-title.md)。
