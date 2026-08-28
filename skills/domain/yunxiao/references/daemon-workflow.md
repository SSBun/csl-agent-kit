# 云效 MR 自动审批守护进程

该流程仅用于用户明确要求无人值守批准所有由当前账号负责审批的云效 MR。守护进程不会合并 MR，也不会修改 MR 元数据。

## 运行模型

- 仅支持 macOS，使用当前用户的 `launchd` LaunchAgent。
- 作为 MQTT 客户端连接 `wss://mqtt-internal.in.zhihu.com/ws`，仅订阅当前用户私有 Topic。
- 启动及 MQTT 重连时，通过 One GET 补扫可能遗漏的 category-15 通知。
- 每次写入前重新读取 MR，确认其仍处于打开状态、当前用户仍有审批资格、审批需求尚未满足且当前用户尚未批准。
- 审批 POST 不自动重试；写入后重新读取 MR 验证结果。中断或模糊写入只做只读恢复检查。
- 仅在远端复核为完整 `approved` 后通过 `terminal-notifier` 发送 macOS 通知，标题和正文包含仓库、MR 编号与标题；点击通知会用默认浏览器打开经过同源校验的 MR URL，其他状态不发送成功通知。
- Dashboard 仅绑定 `127.0.0.1:4319`，不提供写操作。

## 安装与管理

npm 安装该工具包后可直接使用 `yunxiao`；Skill 内部也可使用下列脚本路径。安装 daemon 前需确保 `terminal-notifier` 位于当前 `PATH`，其解析后的绝对路径会写入 LaunchAgent。先运行不会写文件或启动进程的预览：

```text
node <skill-dir>/scripts/yunxiao.mjs daemon install --dry-run
```

展示该计划，并说明安装后会对全部合资格 MR 自动审批，不再逐条请求确认。只有用户明确确认该持久行为后，才能运行：

```text
node <skill-dir>/scripts/yunxiao.mjs daemon install --yes
```

管理命令：

```text
node <skill-dir>/scripts/yunxiao.mjs daemon status
node <skill-dir>/scripts/yunxiao.mjs daemon stop
node <skill-dir>/scripts/yunxiao.mjs daemon start --yes
node <skill-dir>/scripts/yunxiao.mjs daemon uninstall
```

`start --yes` 会恢复无人值守审批，因此同样需要本次明确确认。`uninstall` 保留历史记录。

Dashboard 地址：`http://127.0.0.1:4319`。

## 本地状态与安全边界

- LaunchAgent plist、审批历史和日志均使用当前用户私有权限。
- LaunchAgent 仅持久化 `terminal-notifier` 的绝对路径，不持久化 shell 环境中的 `YUNXIAO_TOKEN`；后台运行依赖当前用户已登录 One 的 Chrome Local Storage，只读发现的 Token 不写入 plist、历史或日志。
- 历史以 JSONL 保存，Dashboard 展示最近 500 次操作的最终状态和 macOS 通知失败原因。
- 状态包括 `approved`、需人工复核的 `partial`、`skipped`、`failed` 和尚待恢复核验的 `approving`；SHA 在批准期间变化时不得报告为完整成功。通知发送失败只记录 `macNotificationSent=false` 和错误，不改变已验证的审批状态。
- 监听到相同通知、MR SHA 和通知 ID 时不会重复执行写请求。
- `daemon run` 是 LaunchAgent 内部入口，不应由 Agent 或用户直接启动。
