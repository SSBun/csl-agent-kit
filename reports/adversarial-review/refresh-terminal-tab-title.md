---
created: 2026-07-27
task: refresh-terminal-tab-title
review_cycles: 2
---

# 快速模型终端标题 Hook 审查

Topic: 同一终端中异步标题结果的先后顺序

> **E1:** 初始实现使用每个 TTY 的最新 token 过滤旧 worker，但 token 检查与 OSC 写入之间仍有竞态窗口。
>
> **R1:** 旧 worker 理论上可能在通过检查后覆盖新标题，因此异步顺序保证不足。
>
> **E2:** 使用同一个原子目录锁串行化 token 发布，以及最新 token 检查与 OSC 写入；锁竞争和异常均 fail-open，不阻塞主 Agent。
>
> **R2:** 两种锁获取顺序下，旧 worker 要么在新 token 发布前完成，要么在新 token 发布后识别为过期并跳过；竞态已关闭。

**Conclusion:** 同一 TTY 只会接受符合当前 token 顺序的异步标题结果。

Topic: 快速模型和隔离边界

> **E1:** 标题调用仅接收最新用户 prompt，并关闭嵌套 Pi 的 session、tools、extensions、skills、context files 和 thinking；模型失败时回退本地摘要。
>
> **R1:** 隔离参数、控制字符过滤、TTY 限制、非阻塞 worker 和本地回退均满足要求。
>
> **E2:** 按用户选择将模型切换为 `deepseek/deepseek-v4-flash`，实测约 1.35 秒生成短标题，主 hook 启动约 10ms 返回。
>
> **R2:** 当前模型、隔离范围、失败路径和 Triggerify active 状态均符合最终请求。

**Conclusion:** Hook 只额外发送最新 prompt，并通过独立 DeepSeek V4 Flash 调用生成简短标题。

---

**Final decision:** `APPROVED`

**Outcome:** 全局 Triggerify hook 已通过独立审查，可使用 `deepseek/deepseek-v4-flash` 异步生成终端标签标题。

**Remaining:** none
