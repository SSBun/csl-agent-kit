# 根据当前对话刷新终端标签标题

Status: Completed (2026-07-27 19:57)

## Scope

- 包含：把最新用户任务发送给独立、无会话、无工具的快速模型生成短标题。
- 包含：确认、继续、提交、推送、测试、重试等不改变主任务的跟进请求保持原标题。
- 不包含：发送完整对话历史、根据实际工具调用判断标题，或为其他宿主新增独立模型认证配置。

## Target

- [x] T1: 提交会改变当前主任务的用户 prompt 后，根据项目名与最新请求生成简短、安全的终端标题。
- [x] T2: 内置 Triggerify hook 在 Pi 上显示为 valid、supported、active，并使用可执行脚本。
- [x] T3: 无可写祖先 TTY 时静默跳过，不阻断 Agent；动态标题中的控制字符不会进入 OSC 序列。
- [x] T4: 使用本机可用的 `deepseek/deepseek-v4-flash` 独立分析最新用户任务，并仅返回简短标题。
- [x] T5: 标题生成不阻塞主 Agent；并发请求完成顺序颠倒时，旧结果不会覆盖新标题。
- [x] T6: 模型失败时回退到本地摘要，规则继续在 Pi 上保持 active。
- [x] T7: 模型明确判定最新请求仅为确认、继续或例行操作时不写 OSC 标题；模型失败仍走原本的本地回退。

## Plan

1. 让模型输出区分“新标题”和“保持原标题”。
2. 仅在模型明确要求保持时跳过 OSC 写入，保留模型失败时的本地回退。
3. 验证有意义请求、确认和例行操作的分支行为。

## Result

- T1: 实际模型调用把“优化标签标题脚本”识别为新任务并返回 `improve title-keeping logic`；`buildTitle` 回归测试确认有意义请求仍生成 `app · Build Authentication`。
- T2: `show inner:refresh-tab-title --host pi` 显示 `enabled`、`valid`、`supported`、`active`，脚本保持可执行。
- T3: 当前链路找到 `/dev/ttys019` 并成功执行 OSC 0 写入（退出码 0）；从 PID 1 开始查找返回 `null`，脚本对无 TTY 和运行异常均 fail-open。
- T4: `pi --list-models deepseek-v4-flash` 确认 `deepseek/deepseek-v4-flash` 可用；隔离调用启用 `--no-session --no-tools --no-extensions --no-skills --no-context-files --thinking off`，实测英文任务返回 `Authentication race fix`，耗时 1.35 秒。
- T5: 后台 worker 启动耗时 10ms；每个 TTY 的 token 发布与最新 token 检查、OSC 写入由同一原子目录锁串行化，相关 self-test 通过。
- T6: 从 PATH 移除 `pi` 后模型结果为空，并正确回退为 `app · Fallback title request`；脚本语法与 self-test 通过，Triggerify CLI 显示规则 `enabled`、`valid`、`supported`、`active`。
- T7: 实际模型调用对中英文确认、继续、commit、test、push 和 retry 请求均返回 `KEEP_CURRENT_TITLE`，而中英文具体优化请求仍生成新标题；worker 将 keep 值解析为 `null` 并跳过 OSC 写入。Triggerify 测试 28/28 与脚本 self-test 通过，普通模型失败仍返回空结果并进入 T6 的本地摘要分支。
- Review gate: Required — 全局 `prompt-submit` hook 会把最新用户任务额外发送给模型 provider，涉及隐私和全局 Agent 生命周期行为。
- Review: `SUPERSEDED` — [快速模型终端标题 Hook 审查](../../reports/adversarial-review/refresh-terminal-tab-title.md)
- Follow-up review gate: Skipped — 仅调整既有模型输出协议和单脚本分支，隐私边界未变，且新标题与保持原标题均有确定性回归测试和实际模型样例。
