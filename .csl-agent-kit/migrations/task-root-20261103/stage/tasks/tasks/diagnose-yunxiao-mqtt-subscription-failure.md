# 诊断云效 MQTT 订阅失败

Status: Completed (2026-09-02 13:40)
Kind: Plan

## Scope

- 包含：保留已完成的只读诊断与永久修复，并将当前任务的全部相关本地改动提交为一个聚焦 Git commit。
- 不包含：重装守护进程，手动执行任何远端审批、合并及元数据写入，或暂存、提交其他任务及无关工作树改动。

## Target
- [x] T1: 以守护进程状态、日志或运行配置证据定位 MQTT subscription-failed 的具体根因。
- [x] T2: 给出与根因对应的最小恢复步骤，并明确调查中未执行重启、重装或远端审批。
- [x] T3: MQTT 订阅出现 error、空 grant 或 QoS 128 时不会永久停留在 subscription-failed；连接仍可用时按现有 30 秒周期重新订阅，成功后恢复 connected 并执行现有通知补扫。
- [x] T4: Dashboard 可观察到最近一次订阅失败的时间及实际 error/grant 详情，且现有审批资格复核、去重、写后验证和通知行为保持不变。
- [x] T5: 当前任务的全部且仅相关改动经 status 和 diff 检查后，使用简洁的 conventional-style message 提交为一个聚焦 Git commit。
- [x] T6: 提交后相关路径无遗留改动，所有无关本地改动保持未暂存且未进入该 commit。

## Decisions

- LaunchAgent 正常加载且进程持续运行，但 Dashboard 报告 `mqtt=subscription-failed`、`lastError=MQTT Topic 订阅被拒绝`；进程到 broker 的 TCP 连接仍为 `ESTABLISHED`，因此这不是进程退出或当前网络断连。
- 当前 One 登录仍是用户 `6833`，与守护进程启动账号一致。使用同一 Node.js 22.22.2、MQTT 5.15.2、broker 和 `zhihu/egon/prod/private/6833/` Topic 的独立只读探测当前获得 QoS 0，因此 Topic、账号权限、DNS、TLS 或 broker 当前状态不存在持续性故障。
- 持续失效的直接根因是订阅恢复逻辑缺失：一次连接或重连收到订阅错误、空 grant 或 QoS 128 后，代码只写入 `subscription-failed` 并返回；现存 TCP 连接不会触发 `reconnectPeriod`，代码也没有重新订阅计时器，所以一次瞬时拒绝会让监听永久卡住，直到连接再次断开或进程重启。
- 该次瞬时拒绝的上游诱因无法从现有证据还原：实现没有记录拒绝发生时间或 SUBACK/grant 详情，stderr 为空。不得把睡眠唤醒、网络切换或 broker 短暂异常中的任一项表述为已确认原因。
- 用户选择永久修复：订阅失败后按现有 30 秒周期重新订阅，并在成功后执行现有补扫；同时补充失败时间和 error/grant 诊断信息，不新增依赖或重装流程。
- 源码修改完成后，用户通过独立安全确认授权重启；新进程已加载修复并恢复无人值守自动审批，启动补扫未产生新的审批记录。

## Plan

1. 检查完整 Git status、未暂存／已暂存 diff 和当前分支，划分当前任务与无关改动。
2. 仅暂存 Yunxiao MQTT 修复及其 canonical task 记录和精确索引更新，复核 staged diff。
3. 使用一个简洁 conventional-style message 创建 commit，再检查 commit 内容和工作树，确认无关改动仍未暂存。

## Result

- T1: Dashboard、launchd、TCP 与同 Topic QoS 0 探测共同确认：瞬时 SUBACK 拒绝后源码未重试，是监听持续卡住的直接根因。
- T2: 调查阶段保持只读；恢复步骤记录为安全确认后的 stop/start，未重装且未手动执行远端审批或合并。
- T3: 源码已覆盖 error、空 grant、QoS 128 的 30 秒单计时器重订阅，成功后复用补扫；新进程 PID 48024 加载修复并持续报告 connected。
- T4: Dashboard API 已暴露最近订阅失败时间、error 与 grants 字段；源码 diff 未触及审批资格、去重、写后验证或通知路径，启动补扫未新增记录。
- T5: 检查完整 status、未暂存与 staged diff 后，仅将 Yunxiao 源码、当前 canonical task 记录及其索引条目提交，message 为 fix(yunxiao): retry failed MQTT subscriptions。
- T6: 提交内容仅含 3 个当前任务路径；Yunxiao 源码与当前 task record 无遗留 diff，CLI 帮助源码、测试、任务记录及其索引 hunk 保持未暂存。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: git diff --cached --check、git show、diff-tree 和提交后 status 证明 commit 聚焦且无关改动未进入；本提交未运行单元测试。
