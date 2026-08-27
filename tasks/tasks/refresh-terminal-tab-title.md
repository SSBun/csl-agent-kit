# 根据当前对话刷新终端标签标题

Status (2026-07-29 16:11): Completed

## Scope

- 包含：自动刷新把 Pi 当前活跃会话分支中最近的用户与 Assistant 文本连同最新用户请求发送给独立、无会话、无工具的快速模型，总上下文最多 12,000 个字符。
- 包含：每次符合条件的自动或手动刷新都由模型根据可用对话重新生成标题，不再比较当前主题、返回 `KEEP_CURRENT_TITLE` 或跳过例行跟进请求。
- 包含：模型失败或输出无效时不写标题；有效标题继续以项目名为前缀，核心意图最多 24 个 Unicode 码点，完整标题少于 8 个自然语言单词。
- 包含：手动 `/title` 刷新在后台任务完成后显示成功或失败 toast，不把请求发起提示当作最终结果。
- 不包含：发送工具调用、工具结果、thinking、图片或项目文件，根据实际工具调用判断标题，或为其他宿主新增独立模型认证配置。

## Target

- [x] T1: 提交会改变当前主任务的用户 prompt 后，根据项目名与当前会话主任务生成简短、安全的终端标题。
- [x] T2: 内置 Triggerify hook 在 Pi 上显示为 valid、supported、active，并使用可执行脚本。
- [x] T3: 无可写祖先 TTY 时静默跳过，不阻断 Agent；动态标题中的控制字符不会进入 OSC 序列。
- [x] T4: 使用本机可用的 `deepseek/deepseek-v4-flash` 独立分析可用会话上下文，并仅返回简短标题。
- [x] T5: 标题生成不阻塞主 Agent；并发请求完成顺序颠倒时，旧结果不会覆盖新标题。
- [x] T6: 模型失败时保持当前标题，规则继续在 Pi 上保持 active。
- [x] T7: 模型明确判定最新请求仅为确认、继续或例行操作时不写 OSC 标题。
- [x] T8: 标题模型失败或未返回有效标题决定时不写 OSC，保持当前标题。
- [x] T9: Pi 标题模型基于当前活跃会话分支的全部用户文本、会话摘要与最新用户请求选择最能代表会话主任务的标题，而不是使用可能含审查协议或执行过程的 assistant 回复。
- [x] T10: 会话上下文不包含工具调用或工具结果，并受确定性长度上限约束；既有标题清洗、并发防旧结果覆盖和无 TTY fail-open 行为保持不变。
- [x] T11: Hook 写入的标题以项目名为前缀，后接不含 `stable main task:` 等模型元标签的核心意图；核心意图不超过 24 个 Unicode 码点。
- [x] T12: 最新 prompt 仅要求 commit、push、stage、测试、重试或继续当前工作时，确定性地保持原标题，不依赖模型自行遵守提示。
- [x] T13: 模型返回 `R1: NOTE:` 等审查协议标记或其他无实质内容的流程标签时保持原标题。
- [x] T14: Pi 或终端生命周期覆盖 OSC 标题后，纯操作型跟进或模型的保持决定会重新写入该 TTY 上次成功生成的 `<project> · <core intent>`；尚无成功标题时写入项目名，模型调用失败仍不写标题。
- [x] T15: 标题模型能看到该 TTY/workspace 当前保存的标题；只要会话主任务未实质变化，就保持并恢复该标题，而不是因新的同任务 prompt 改写措辞。
- [x] T16: Hook 生成的完整标题少于 8 个自然语言单词，同时保留项目名前缀与 24 个 Unicode 码点的核心意图上限。
- [x] T17: 手动 `/title` 刷新仅在后台任务完成后显示成功或失败 toast；成功保持原标题时也能明确报告“未改变”，超时或失败不能伪装成成功。
- [x] T18: 自动刷新向标题模型提供有界的最近用户与 Assistant 文本，并排除工具调用、工具结果、thinking、图片和项目文件。
- [x] T19: 自动与手动刷新均不再使用当前主题、`KEEP_CURRENT_TITLE` 或例行操作短路；每次有效请求都调用模型并应用其有效标题。
- [x] T20: 上下文扩展和重新生成不破坏标题长度、安全清洗、失败不写入、并发防旧结果覆盖及手动结果通知。
- [x] T21: `/title` 与自动刷新复用同一有界对话上下文；命令参数如有，仅作为最新用户请求追加，不能替换已有对话。

## Plan

1. 让 `/title` 的有参数与无参数路径统一调用自动模式的上下文构建。
2. 运行聚焦回归与任务记录检查。

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
- T9: Pi adapter 继续使用 `buildContextEntries()` 获取 compaction-aware 活跃分支，但只序列化全部 user 文本和 compaction/branch summary；回归测试确认普通 assistant 文本、assistant tool call、tool result、thinking 与 image 均不进入标题上下文。
- T10: 新回归测试确认 12,000 字符上限同时保留会话开头和最新请求，并排除 assistant tool call、tool result、thinking 与 image 内容；`npm run test:all` 全部通过。
- Current review gate: Required — Pi 会把最多 12,000 字符的活跃会话文本发送给独立标题模型，扩大了隐私边界并影响全局 Agent 生命周期行为。
- Current review: `SUPERSEDED` — [快速模型终端标题 Hook 审查](../../reports/adversarial-review/refresh-terminal-tab-title.md)；用户报告现有标题仍会复制模型元标签并把 commit 操作误作主任务。
- T11: `buildTitle()` 恢复 `<project> · <core intent>` 格式，同时仍由 `cleanModelTitle()` 把核心意图限制在 24 个 Unicode 码点内；回归测试确认 `/tmp/app` 与 `Concise tab titles` 生成 `app · Concise tab titles`。
- T12: `isRoutineFollowUp()` 在模型调用前识别截图中的完整 commit prompt，以及 push、stage、测试、重试、继续等纯操作型跟进；聚焦回归测试、脚本 self-test 与 `npm run test:all` 全部通过。
- T13: 截图中的实际坏输出 `R1: NOTE:` 已加入脚本 self-test 与 Triggerify 回归测试；`cleanModelTitle()` 将纯 `R<n>: NOTE/BLOCKER/QUESTION` 标记视为 `KEEP_CURRENT_TITLE`，不会写入 OSC。
- T14: 每个 TTY 在 `triggerify/.tab-title/<tty>.title.json` 中按 workspace 保存最后一次成功标题；保持路径在既有 TTY 锁和 latest-token 检查内恢复它，无匹配记录时写项目名。`generatedTitleAction()` 回归测试确认空模型结果返回 `null` 而不写，`KEEP_CURRENT_TITLE` 恢复保存值；`npm run test:all` 72/72 通过。
- Latest review gate: Skipped — 新状态仅保存已显示的非敏感标题，复用既有每 TTY 锁和 workspace 匹配，没有扩大会话数据、模型或宿主边界；保持、初始化、失败和 workspace 隔离均有确定性测试。local quality gate syntax/lint/governance 通过，仅保留既有的初始加载 token 预算告警。
- T15: `titleModelInput()` 把已保存标题作为 existing main-task anchor 提供给模型；`generatedTitleAction()` 对相同完整标题返回 `remember: false`。实际 DeepSeek 样例对同一标签标题任务的跟进返回 `KEEP_CURRENT_TITLE`，对显式切换到认证缓存任务返回 `Authentication cache`。
- T16: `buildTitle()` 按项目前缀占用的词数裁剪核心意图，使完整标题最多 7 个自然语言单词；回归样例把九词核心压缩为 `app · a b c d e f`，同时保留 24 个 Unicode 码点上限。`npm run test:all` 72/72 通过。
- Newest review gate: Skipped — 只收紧标题稳定性和已有输出长度，没有新增状态类别、隐私数据或宿主集成；同任务保持、主任务切换和词数边界均有确定性或实际模型证据。
- T17: detached worker 现在按手动 request ID 写入 `{ok, changed, title, reason}` 结果；Pi `/title` 删除立即成功提示，改为轮询并分别 toast `refreshed`、`unchanged`、`failed` 或 `timed out`。缺少 prompt、DeepSeek 失败和真实模型成功探测均已验证；`npm run test:all` 通过，Pi 测试 7/7 通过。
- Current review gate: Skipped — 仅增加手动刷新结果的本地状态文件与 Pi UI 通知，自动刷新仍保持 detached、非阻塞且不新增逐轮 toast；未扩大会话模型或宿主边界。
- T18: `buildTitleContext()` 现在从 Pi 活跃分支提取最近的 `User:` 与 `Assistant:` 文本，保留最新 prompt，按 Unicode 字符从尾部限制为 12,000 字符；Pi 回归测试确认 tool call、tool result 与被截断的旧内容不进入模型上下文。
- T19: 标题模型 prompt 和 worker 已删除当前主题输入、`KEEP_CURRENT_TITLE` 协议及模型调用前的例行操作短路；真实 `deepseek/deepseek-v4-flash` 样例对“构建登录缓存 → Assistant 完成 → commit”重新生成 `login token cache`。
- T20: 脚本 self-test、`npm run test:all`、`git diff --check` 与 Triggerify `show inner:refresh-tab-title --host pi` 均通过，规则保持 valid、supported、active。local quality gate 的 syntax、lint、governance 通过；未修改的 `skills/triggerify/SKILL.md` 仍有既存的初始加载预算结果 `1372 > 1000`。
- Latest follow-up review gate: Skipped — 用户未明确要求 adversarial review 或独立 Reviewer 批准。
- T21: `/title` 的有参数与无参数路径现在都直接调用 `buildTitleContext(entries, prompt)`；现有回归覆盖已有对话与最新请求同时保留，`npm run test:pi` 7/7 通过。
- `/title` parity follow-up review gate: Skipped — 用户未明确要求 adversarial review 或独立 Reviewer 批准。
