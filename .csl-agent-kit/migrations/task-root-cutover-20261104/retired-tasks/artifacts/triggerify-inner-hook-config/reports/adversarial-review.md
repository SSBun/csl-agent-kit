---
created: 2026-07-27
task: triggerify-inner-hook-config
review_cycles: 2
---

# Triggerify inner hook 用户配置审查

Topic: Inner hook 状态与专属设置的数据边界

> **E1:** Inner hooks 默认启用，用户禁用列表由统一配置持久化；配置无效时仅 inner hooks fail-closed，标题 hook 迁移后可独立禁用。
>
> **R1:** 禁用状态、CLI 展示、源文件只读和标题 hook 迁移均满足既定边界。
>
> **E2:** 配置新增按 qualified ID 分组的 `hookSettings`；Triggerify 只把当前 hook 的对象通过 `TRIGGERIFY_HOOK_CONFIG` 传给脚本，stdin event payload 不变，标题脚本从中选择模型。
>
> **R2:** 每-hook 隔离、toggle 设置保留、模型格式回退、detached worker 继承和嵌套模型进程清理均已验证，没有跨 hook 泄漏或未解决问题。

**Conclusion:** Inner hook 的启用状态和专属设置共享一个持久化配置，但运行时只向对应脚本暴露其自身设置。

---

**Final decision:** `APPROVED`

**Outcome:** 用户可在统一配置中指定终端标题模型，Triggerify 会隔离传递给对应 inner hook。

**Remaining:** none
