# 移除 Yunxiao Zip 并审查脚本设计

Status: Completed (2026-09-02 17:11)
Kind: Task

## Scope

- 包含：删除仓库中的 Yunxiao zip 副本，并审查源脚本的 MQTT 连接、订阅、重试、停止、状态与诊断设计。
- 不包含：修改 Yunxiao 源脚本、运行远端审批、重启守护进程或连接真实 MQTT broker。

## Target
- [x] T1: Yunxiao zip 分发副本已从仓库移除，源 Skill 目录继续作为唯一受审查与分发来源。
- [x] T2: Yunxiao 脚本的 MQTT 订阅生命周期设计已完成证据化审查，确认的问题、影响与最小修正方向清楚可复现。

## Decisions

- MQTT.js 默认自动重订阅与脚本显式订阅形成两个订阅所有者；重连后的重复订阅返回空 grants，使状态永久停在 `subscription-failed`。最小修正是关闭 MQTT.js 自动重订阅，保留脚本现有显式订阅与重试流程。
- `daemon stop` 未阻止或等待已有 Promise 队列，尚未开始写入的审批可能在停止信号后继续执行；停止流程应拒绝新工作、在写入前检查运行状态，并等待已发出的模糊写入完成只读核验。
- MQTT.js 在 SUBACK 拒绝时不会把实际 reason code 写回回调第二参数；诊断应读取第三参数的 `packet.granted`，否则 QoS 128 会被显示成请求值 QoS 0。

## Plan

1. 解析 Yunxiao zip 的当前消费者并删除无消费者的归档副本。
2. 沿 MQTT.js 自动重订阅、脚本显式订阅、失败重试和守护进程停止路径验证状态机与诊断数据。
3. 运行语法、Skill 质量、差异与仓库状态检查，并记录删除证据和设计审查结论。

## Result

- T1: 文件系统与 npm pack dry-run 均确认 yunxiao.zip 缺失；全仓消费者搜索无引用，package bin 与 manifest 继续指向源 Skill 目录。
- T2: MQTT.js 5.15.2 源码追踪、重复订阅与 SUBACK 128 探针及停止队列审查确认三项设计缺陷，并记录了各自最小修正方向。
- Review gate: Skipped — 用户请求普通脚本设计审查；未请求 adversarial review 或独立批准门禁。

## Verification

- Passed: node --check、Yunxiao skill-quality（1 passed/0 warnings）、npm pack dry-run 发布面与 git diff --check 均通过；未运行单元测试或项目测试套件。
