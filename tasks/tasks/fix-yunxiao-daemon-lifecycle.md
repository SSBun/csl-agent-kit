# 修复 Yunxiao 守护进程生命周期

Status: Completed (2026-09-02 17:47)
Kind: Task

## Scope

- 包含：修复 Yunxiao 守护进程的 MQTT 订阅所有权、停止期间写入边界和 SUBACK 诊断，并增加最小可复现验证。
- 不包含：启动或重装守护进程、连接真实 MQTT broker、执行远端审批，或修改当前工作区中的无关改动。

## Target
- [x] T1: MQTT 重连后仅有一个订阅所有者，成功订阅会恢复 connected 并执行补扫，失败重试不会因重复订阅空 grants 永久卡住。
- [x] T2: daemon stop 后不会启动尚未发出的审批写入，已发出的模糊写入会完成只读核验后再结束。
- [x] T3: SUBACK 拒绝诊断记录 broker 实际返回的 reason code，而不是请求 QoS。
- [x] T4: 现有首次连接、串行审批、去重、写后验证、Dashboard 与安全边界保持不变。

## Decisions

- 关闭 MQTT.js 的自动重订阅，由脚本现有 `connect` 处理器和单一失败计时器独占订阅生命周期。
- `stopping` 状态作为远端写入屏障；信号处理覆盖启动补扫，停止时拒绝新队列项并等待当前 `work` 链完成，使已发出的写入继续完成只读核验。
- SUBACK 诊断通过独立纯函数优先读取 `packet.granted`，同时保留成功回调第二参数的兼容回退。

## Plan

1. 统一显式订阅所有权，并从实际 SUBACK packet 构造诊断 grants。
2. 将启动补扫与运行队列纳入同一停止边界，阻止未发出的写入并等待已发出写入的核验。
3. 逐项运行依赖行为探针、语法、Skill 质量、发布面与差异检查，发现回归则回到对应修复步骤。

## Result

- T1: MQTT.js 5.15.2 行为探针确认 resubscribe=false 时同 Topic 两次显式订阅均发送 packet 且不写入自动重订阅表；成功路径仍恢复 connected 并入队补扫。
- T2: 信号处理现覆盖启动补扫；停止队列探针观测 queuedWritesAfterStop=0、inFlightVerified=true，源码在 POST 前复查 running 并等待 work 与 Dashboard 关闭。
- T3: MQTT.js SUBACK 128 探针确认诊断从 packet.granted 记录 reason code 128，而非回调 grants 中的请求 QoS 0。
- T4: 最终差异仅改变订阅配置、停止屏障、grant 归一化及同文件自检覆盖；语法、Skill Quality、npm pack 发布面和只读复核均未发现现有边界回归。
- Review gate: Skipped — 用户未请求 adversarial review 或独立批准；普通只读 Reviewer 复核三个修复目标后未发现缺陷。

## Verification

- Passed: 行为探针输出 explicitSubscribePackets=2、rejectedReasonCode=128、queuedWritesAfterStop=0、inFlightVerified=true；node --check、git diff --check、skill-quality（1 passed/0 warnings）及 npm pack dry-run 均通过。未运行单元测试或项目测试套件。
