# 调整 Shadowrocket fake-IP 以恢复文档抓取

Status: Blocked (2026-09-17 16:20)
Kind: Task

## Target

- [ ] T1: 解决 Shadowrocket fake-IP 引起的目标 ROBOTIS 文档抓取阻断，并以实际抓取结果验证。
- [ ] T2: 说明实际配置变更及恢复方法；需要用户界面操作而无法自动完成的步骤明确交接。

## Plan

1. 已只读确认系统将目标域名解析为 198.18.3.87，当前配置为 zhihu.db。
2. 用户通过 Shadowrocket 配置编辑界面，在现有 always-real-ip 列表追加 emanual.robotis.com 并重新连接。
3. 重新查询系统 DNS 并通过原抓取工具验证目标页面；记录实际结果及回退方式。

## Block

- Reason: 当前配置保存在应用 SQLite 数据库，同时存在共享容器编译缓存及 iCloud 副本；未发现可安全应用并重载配置的已验证自动化入口。不直接修改正在使用的内部数据库，需要用户在应用界面保存并重新连接。
- Unblock when: 用户确认在当前配置的 always-real-ip 中追加 emanual.robotis.com，保存并重新连接，或提供受支持的配置编辑及重载入口。

## Notes

- 只读检查：活动配置源库 general / always-real-ip 的当前值为 one.in.zhihu.com, *.in.zhihu.com, *.zhihu.com；共享运行配置包含相同列表。
- 尚未修改任何 Shadowrocket 配置或抓取工具安全设置，未运行测试。
