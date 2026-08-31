---
created: 2026-07-22
task: implement-triggerify-skill
review_cycles: 4
---

# Triggerify 实现审查

Topic: Workspace trust 与恢复控制面

> **E1:** 初版运行时只加载全局规则，但项目 `list` 仍会读取正文，invalid 与冲突规则的恢复能力不完整，local create 也未原子维护 ignore 状态。
>
> **R1:** 未信任项目必须保持 metadata-only；恢复 CLI 必须覆盖 invalid、自锁和同 ID 冲突；私有规则创建不得留下未忽略文件。
>
> **E2:** 项目列表改为 metadata-only，显式操作只读取目标；新增 recovery-disabled 与 `update --from`，冲突 disable 同时停用全部文件；`.gitignore` 改为拒绝 symlink 的原子先行写入。
>
> **R2:** 复审确认 trust、恢复路径和 local 生命周期均满足 RFC。

**Conclusion:** 项目规则在缺少宿主 trust verdict 时不会进入运行时读取；外部 CLI 可以恢复 invalid、冲突和自锁规则。

Topic: Codex capability 与原生协议

> **E1:** 初版用统一 exit code 2 表达所有可阻止事件，协议证据只存在于实现常量。
>
> **R1:** 每个 `block=true` 事件必须有当前官方协议证据和可执行映射，不能用内部 fixture 自证。
>
> **E2:** 新增带官方来源和核对日期的十事件 fixture；`PermissionRequest` 输出原生 deny JSON，`PreCompact` 输出 `continue:false`，其余事件仅保留已证明的 exit-2 映射。
>
> **R2:** 原生 JSON 测试和精确 capability fixture 证明了当前 Codex adapter 的声明范围。

**Conclusion:** 十个标准事件均有固定 payload/capability 基线，未验证的 Claude Code 与 Pi runtime 继续保持 unsupported。

Topic: 资源预算与脚本安全

> **E1:** 初版缺少可中断 regex、完整事件 deadline、shebang 校验和异常路径 payload 清理。
>
> **R1:** 单规则预算不足以保护串行事件；加载、条件、Prompt 和脚本都必须受同一 deadline 约束，敏感 payload 不能因异常留在磁盘。
>
> **E2:** Regex 改为输入受限且由可强制终止的子进程执行；deadline 覆盖 discovery 到动作；增加规则数、文件大小、路径、shebang 和总执行预算；payload 使用打开后立即 unlink 的匿名临时 fd，并统一清理。
>
> **R2:** 复审确认预算、退出协议、symlink escape 和清理路径均有确定性测试。

**Conclusion:** 运行时在宿主 timeout 前有界结束，脚本无法越出 scope，原始事件 payload 不被默认持久化。

Topic: 诊断与验收证据

> **E1:** 初版测试只覆盖基础 DSL 与 CRUD，invalid/unknown 运行时状态缺乏可解释诊断。
>
> **R1:** RFC 的冻结语义、十事件、退出类别、短路、恢复及两个用户示例必须形成可失败的证据。
>
> **E2:** 聚焦测试扩展到 14 项，覆盖三值逻辑、Pointer、glob/regex、冲突、恢复、原生 block、退出/timeout/signal/spawn、诊断去重及 Swift/commit 端到端用例。
>
> **R2:** 全部测试、Skill validator 与 local quality gate 审计通过，未发现剩余阻塞项。

**Conclusion:** 当前证据覆盖 RFC V1 的共享核心、Codex adapter 和恢复 CLI。

---

**Final decision:** `APPROVED`

**Outcome:** Triggerify V1 的 Skill、共享核心、Codex hooks 与恢复 CLI 满足当前 RFC 范围。

**Remaining:** none
