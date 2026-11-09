# Standing Orders 迁移修复审查

- Task: [Rename conventions to standing-orders and harden the skill](../../../tasks/rename-conventions-to-standing-orders.md)

## R1：旧测试与默认验证入口失效

- **Reviewer position:**
  - 默认测试仍执行已删除的 tips 脚本，Pi 与 CLI hook 测试也验证旧协议。
- **Editor response:**
  - 用 standing-orders 契约测试替换旧测试，更新 Pi 测试和 CLI hook 选择逻辑。
- **Decision:** 已解决。

## R2：旧 tips 数据缺少安全迁移路径

- **Reviewer position:**
  - 升级会让旧数据静默失效，部分迁移后也必须继续提示剩余数据。
- **Editor response:**
  - Hook 与 Pi 持续检测 legacy JSON/Markdown，保留原文件并提示逐条显式确认；不把关键词限定的 tips 自动扩大为 always-on 指令。
- **Decision:** 已解决。

## R3：缺少指令优先级边界

- **Reviewer position:**
  - Standing orders 不能覆盖更高优先级规则，也不能压制用户当轮更具体的要求。
- **Editor response:**
  - 在 agents、skill、Claude/Cursor hook 与 Pi 注入中统一加入两项边界，并拒绝持久化权限或安全层级覆盖指令。
- **Decision:** 已解决。

## R4：首次创建不可执行

- **Reviewer position:**
  - 新用户没有目标文件时，单纯使用 edit 无法保存第一条指令。
- **Editor response:**
  - 确认后创建父目录和完整初始 Markdown；后续仍只做局部编辑。
- **Decision:** 已解决。

## R5：数据目录解析不一致

- **Reviewer position:**
  - CLI/Pi 支持 `CSL_AGENT_KIT_HOME`，但 hooks、skill 和文档固定使用默认目录。
- **Editor response:**
  - 所有运行面统一为优先使用 `CSL_AGENT_KIT_HOME`，否则回退 `~/.csl-agent-kit`。
- **Decision:** 已解决。

## R6：显式持久化偏好可能被路由拒绝

- **Reviewer position:**
  - `i prefer` 排他负向信号会错误拦截明确要求永久保存的回答偏好。
- **Editor response:**
  - 仅排除没有持久化请求的普通偏好，删除冲突负向词并增加混合正反例。
- **Decision:** 已解决。

## R7：Pi 生命周期与文档不一致

- **Reviewer position:**
  - 文档声称 session-start 一次性注入，实际 Pi 在每个 agent turn 重建 context。
- **Editor response:**
  - 明确 Claude/Cursor 使用 SessionStart/PostCompact，Pi 使用 before_agent_start，并同步 skill、README 与测试。
- **Decision:** 已解决。

## R8：新工作流缺少有效行为覆盖

- **Reviewer position:**
  - 首次创建、确认、安全边界、目录覆盖、生命周期和部分迁移状态没有回归保护。
- **Editor response:**
  - 增加最小契约与运行时测试，覆盖 legacy-only、standing+legacy、两个 shell 生命周期和 Pi 每回合重建。
- **Decision:** 已解决。

## 最终决定

`APPROVED`
