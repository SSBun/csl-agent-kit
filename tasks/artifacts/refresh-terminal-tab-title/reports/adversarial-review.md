---
created: 2026-07-27
task: refresh-terminal-tab-title
review_cycles: 4
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

**Conclusion:** 标题模型保持无 session、tools、extensions、skills、context files 和 thinking 的隔离边界；Pi adapter 只额外提供有界的会话文本。

Topic: 会话级命名与模型失败行为

> **E3:** Pi adapter 从 compaction-aware 活跃分支提取用户、助手及会话摘要文本，排除工具调用、工具结果、thinking 和 image，并以 12,000 个 Unicode 码点保留开头与最新上下文；空模型结果不再回退到最后一个 prompt。
>
> **R3:** 新行为满足会话级命名和失败保持要求；去重、worker 环境、非标题 side-effect 路径及简短描述只有非阻塞观察，没有正确性或隐私阻塞项。
>
> **E4:** 证据确认 latest prompt 与最后用户文本在比较前均已 trim，worker 不读取继承的 hook input 且嵌套模型环境会移除它，未使用的 side-effect input 不做推测性扩展；隐私边界已记录在任务与审查材料中。
>
> **R4:** 完整 diff、72 项回归测试、脚本自检、规则校验及四个实际模型样例均证明失败时保持原标题、例行跟进保持主任务标题、主任务切换才生成新标题。

**Conclusion:** Pi 标签标题由当前会话主任务决定；标题模型失败或无法给出有效决定时不写 OSC，当前标题保持不变。

---

**Final decision:** `SUPERSEDED`

**Outcome:** 用户实测发现已批准版本仍可能复制模型元标签，并把 commit 操作误作会话主任务。

**Remaining:** 后续修复由所属任务记录继续跟踪。
