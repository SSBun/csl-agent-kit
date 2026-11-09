# Review round 01

- Schema: task-review-report/v1
- Task: extend-fast-plugin-ultrafast
- Round: 01
- Snapshot: snapshot:tasks/artifacts/extend-fast-plugin-ultrafast/evidence/fa4a08501089e9d94ae5613728e499b1bb16304dd6c7ce11411f8142e9b1c0c6.json#fa4a08501089e9d94ae5613728e499b1bb16304dd6c7ce11411f8142e9b1c0c6
- Task fingerprint: 57758d7bed0f57d5fcb8142bc829d1ec8822dabb5718136e1476a9b5ed237214
- Outcome: no blocking findings
- Mode: independent subagent
- Run: 51aedf2c-307b-4b2b-a154-7635653eee36

## Reviewer feedback

## 审查模式与范围

独立、只读静态审查；仅反馈，不授予批准。范围为现有插件及 README 对应说明，快照标识为 `fa4a08501089e9d94ae5613728e499b1bb16304dd6c7ce11411f8142e9b1c0c6`。

## Findings: none

No issues found.

- **T1**：显式命令及启动参数均可选择 Ultrafast；仅对指定 provider 和两个适用模型注入 `service_tier: "ultrafast"`。
- **T2**：保留 Fast 的 `priority`、旧布尔配置迁移及关闭行为；默认及非法配置不会开启 Ultrafast，`toggle` 也不会升级至该档位。
- **T3**：区分额度与 credits 倍率，使用 `requested` 表达请求状态；未知倍率显示 `?x`，不适用显示 `n/a`，没有修改原始 token 累计。

源码依据：["/Users/caishilin/Desktop/personal/skills/pi/extensions/openai-codex-fast.ts"](file:///Users/caishilin/Desktop/personal/skills/pi/extensions/openai-codex-fast.ts) 第 18–110、186–190、243–264 行。

## Unverified risks

- **快照字节一致性尚未独立验证**：已读取 manifest，范围恰为两个指定文件；结束时复查了差异统计，但统计不能证明内容哈希未变。T1–T3 的最终证据绑定仍须父会话按约定复核 hash；不构成已确认代码缺陷，若不匹配则阻塞当前快照核验。
- **未进行实际 TUI、模型请求或账号验证**：无法证明实际渲染、服务端接受及真实扣费。对本次限定的客户端请求能力与公开倍率展示，**不阻塞 T1–T3**，但不能据此声称实际权益或账单已验证。

## 实际检查

- 完整读取审查契约；对照原始请求、追加需求及 T1–T3。
- 阅读完整插件源码及两个限定文件的当前差异。
- 检查命令分支、持久化顺序、非法配置、模型过滤、payload 保留、未知倍率及关闭恢复路径。
- 阅读 Pi 请求事件调用方与 runner，确认返回 payload 会继续传递；检查 OAuth 判定实现。
- 未写文件、改状态、委派、运行测试或发起付费请求。

## 继承证据与覆盖边界

已检查 owning task 的 Result、Verification Notes、Review Assessment。其中严格 TypeScript 检查通过及官方文档抓取属于**作者提供的证据，本轮未重跑或重新抓取**；源码中的倍率、模型范围与所提供文档摘录一致。

无既有 findings，本轮未分配 TR-ID。
