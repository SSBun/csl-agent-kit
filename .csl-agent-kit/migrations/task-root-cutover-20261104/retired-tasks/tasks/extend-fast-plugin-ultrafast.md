# 扩展现有 Fast 插件以支持 Ultrafast

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-29 15:07) |
| Artifacts | [Artifacts](../artifacts/extend-fast-plugin-ultrafast/) |
| Kind | Task |

## Target
- [x] T1: 现有 Fast 插件可选择 Ultrafast 并向适用模型请求传递对应服务档位。
- [x] T2: 保留现有 Fast 模式及关闭加速的行为，不自动启用 Ultrafast。
- [x] T3: 显示当前速度档位对应的用量消耗倍率（如 1.5x）；数值依据适用的计费或额度规则，未知时明确标注，不将示例值当作固定倍率。

## Plan

1. 在现有速度档位命令、配置和请求注入中支持 Ultrafast，兼容旧布尔配置。
2. 在现有状态展示中区分请求档位、模型适用性和订阅额度／credits 消耗倍率；同步使用说明。
3. 执行允许的静态检查与差异核对，不运行测试套件、不发起付费模型调用；完成风险分级和最终验证。

## Decisions

- 官方速度说明（https://learn.chatgpt.com/docs/agent-configuration/speed，2026-10-29 读取）区分订阅内额度与 credits：Fast 为 2.5x／2x，Ultrafast 为 8x／6x；1.5x 是 GPT-5.6 的速度提升，不是额度消耗。
- 插件不能获知账号权益或实际扣费来源，显示请求状态及两种明确标注的官方倍率，不冒充服务端已确认档位或实测账单。
- 保留旧模型 Fast 注入；旧型号或 API 计费无法确认适用倍率时显示未知。
- 本次不更新 Context：相关边界已在插件及 README 集中说明，现有 Pack 未覆盖该组件；不缓存易变倍率。Context 校验的既有未索引章节警告与本次改动无关。

## Task Summary

**Pi 速度扩展**（[pi/extensions](../../pi/extensions/)）：在原有 Fast 插件内增加显式 Ultrafast 档位、启动参数、持久化及旧配置兼容，按模型限制请求注入，并在独立页脚行及状态通知显示请求档位与分类用量倍率。

**使用说明**（[README.md](../../README.md)）：同步切换方式、配置迁移、模型范围、倍率来源与账号权益及未知值边界。

## Verification Notes

- 已逐分支核对：未配置／非法配置为 off；旧 enabled=true 为 fast；显式 mode 优先；on 为 fast、ultrafast 为 ultrafast、off 关闭、toggle 从任一开启档位关闭；status 不写配置；保存成功才更新内存状态。
- 已核对 provider 与模型过滤、对象 payload 检查、原字段保留和 service_tier 映射；Ultrafast 仅适用于两个明确型号。
- 已核对 quota／credits 标签区分、OAuth 与未知倍率路径、unsupported 显示及关闭恢复页脚。独立状态行避免用量统计挤占倍率；没有修改累计 token 计算。
- 已通过 tsc --noEmit --skipLibCheck --strict --target ES2022 --module ESNext --moduleResolution Bundler pi/extensions/openai-codex-fast.ts。先前 NodeNext 模式因仓库未声明 ESM 报 TS1479，随后改用符合 Pi Jiti 加载方式的 ESNext/Bundler 检查通过；未修改 package.json。
- 未运行测试、实际 TUI 交互或付费调用；未验证账号权益、服务端接受情况、实际扣费或 Pi 原有金额估算的准确性。

## Result

- T1: 逐分支静态核对 /fast ultrafast、--ultrafast、两模型 allowlist 和 service_tier=ultrafast；严格 TypeScript ESNext/Bundler 检查通过。未发送实际模型请求。
- T2: 逐分支对比原实现：旧 enabled=true 仍为 Fast/priority，未配置为 off，on/off/toggle/status 与旧 provider/model 边界保留；新 Ultrafast 只由显式选择或保存的同名档位启用。类型检查通过，未运行测试。
- T3: 核对官方 speed 文档及 speedLabel 全部分支：当前 OAuth Fast quota2.5x/credits2x，Ultrafast quota8x/credits6x；旧模型/API 未知显示?x，不适用显示n/a；页脚独立行与status共用标签且标明requested，token总数不乘倍率。未实测扣费。
- Review gate: Passed — fresh只读Reviewer 51aedf2c-307b-4b2b-a154-7635653eee36 无确认发现或Target阻塞风险；round-01已持久化。主Agent通过check-evidence逐文件hash复核，审查前后快照一致；未实测TUI/服务端/账单限制保留。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: 新增显式高消耗服务档位与持久化，涉及用量成本边界，需要独立核对；不以静态类型通过代替行为审查。
- Snapshot: snapshot:tasks/artifacts/extend-fast-plugin-ultrafast/evidence/fa4a08501089e9d94ae5613728e499b1bb16304dd6c7ce11411f8142e9b1c0c6.json#fa4a08501089e9d94ae5613728e499b1bb16304dd6c7ce11411f8142e9b1c0c6
- Evidence: Result T1-T3 与 Verification Notes：逐分支源码核对、官方规则比对、严格类型检查通过；未跑测试或付费调用。
- Task fingerprint: 57758d7bed0f57d5fcb8142bc829d1ec8822dabb5718136e1476a9b5ed237214

## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/extend-fast-plugin-ultrafast/reviews/round-01.md) | snapshot:tasks/artifacts/extend-fast-plugin-ultrafast/evidence/fa4a08501089e9d94ae5613728e499b1bb16304dd6c7ce11411f8142e9b1c0c6.json#fa4a08501089e9d94ae5613728e499b1bb16304dd6c7ce11411f8142e9b1c0c6 | no blocking findings | 38ef16a7f8eedc704380ab72e444e0fdbeac7e431eefc6a246d0bf9dbc33faec |

## Verification

- Passed: 独立审查后重跑严格ESNext/Bundler类型检查、git diff --check均通过；check-evidence确认两文件快照及round-01报告hash一致。未运行测试或付费模型调用；实际账号权益和账单未验证。
