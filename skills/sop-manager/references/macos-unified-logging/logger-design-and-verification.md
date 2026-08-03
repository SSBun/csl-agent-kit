# macOS Logger Design 与 Verification

仅在任务需要新增、审查或验证 `Logger`/OSLog event、privacy、level、category、predicate 或 signpost 时读取。

## 1. 最小 Logger Pattern

```swift
import OSLog

private let logger = Logger(
  subsystem: Bundle.main.bundleIdentifier ?? "com.example.SampleApp",
  category: "Sidebar"
)

@MainActor
func selectItem(_ item: SidebarItem) {
  logger.info("Selected sidebar item: \(item.id, privacy: .public)")
  selection = item.id
}
```

只有 `item.id` 已确认不包含个人信息、secret 或可识别用户内容时才使用 `.public`。不确定时省略 privacy annotation，让 interpolated string/custom object 默认 redacted。

## 2. Subsystem 与 Category

| 字段 | 规则 | 例子 |
| --- | --- | --- |
| Subsystem | 稳定功能域；app 通常使用 bundle identifier | `com.example.SampleApp` |
| Category | 具体 feature/type，短、稳定、可过滤 | `Windowing`、`Commands`、`MenuBar`、`Sidebar`、`Sync`、`Import` |

不要：

- 使用 document title、account、URL、用户输入或随机 ID 作为 category；
- 为每个 method 创建 logger；
- 在同一 feature 混用多套 subsystem naming；
- 为本 SOP 新建大型 logging wrapper。

## 3. Level 选择

| Level | 默认用途 |
| --- | --- |
| `debug` | 开发期细节、高频或短期诊断状态。 |
| `info` | 正常动作边界、生命周期和重要里程碑。 |
| `notice` | 值得长期突出显示的重要正常事件。 |
| `error` | 操作失败、降级、已处理但需要诊断的问题。 |
| `fault` | app bug、不变量破坏或严重不可恢复状态。 |

Apple unified logging 会根据 level 决定 memory/disk persistence。不要把所有事件提升为 error 以求“更容易看到”；这会破坏信号语义。

## 4. Privacy Review

Apple `Logger` 对 interpolated string 和 custom object 默认 redaction。`.public` 是显式例外，逐字段审核。

禁止记录：

- password、token、private key、credential、session/cookie；
- email、姓名、精确位置、账号、设备或其他个人数据；
- raw document、clipboard、prompt、message、query、server response；
- 未清理的绝对路径、URL query/body 或 error payload。

优先替代：

- enum/status/failure category；
- count、duration、boolean outcome；
- 已确认非敏感的内部 action name；
- 仅当跨事件关联确实需要时，使用经过隐私评估的稳定摘要。

## 5. 放置 Event

```text
用户/系统触发
      ↓  accepted event（需要时）
真实 side effect 开始
      ↓
service / operation
      ↓  success 或 classified failure
state/UI 回写
```

- button tap 只证明触发，不证明 service 成功。
- 对同步动作，一条 result event 往往足够。
- 对异步动作，最多保留有明确关联的 start/result 小型序列。
- event 重复时优先检查重复 lifecycle/observer/task/command registration，不只做 dedup workaround。

## 6. Live Verification

项目已有 build/run loop 时优先使用：

```bash
./script/build_and_run.sh --telemetry
./script/build_and_run.sh --logs
```

直接过滤示例：

```bash
/usr/bin/log stream --info --style compact \
  --predicate 'process == "AppName"'

/usr/bin/log stream --info --style compact \
  --predicate 'subsystem == "com.example.app" && category == "Sidebar"'
```

验证步骤：

1. 先启动 stream，再执行一个确定动作。
2. 确认恰好出现一条目标 event 或预期的小型序列。
3. 改用 subsystem/category predicate，确认事件可独立过滤。
4. 检查实际输出未公开敏感字段。
5. 重复动作一次，检查频率和 duplication。
6. 删除临时 dump，保留稳定诊断 event。

Console.app 可用于同样的 process/subsystem/category 筛选。日志出现只证明执行路径，不证明窗口可见、焦点、布局或最终业务状态。

## 7. Signpost 边界

- 只为 duration/interval/performance span 添加 signpost。
- start/end 使用稳定名称和正确 pairing；异常/取消路径也必须闭合或明确标记。
- 不为普通 button、selection 或 error event 同时写重复 signpost。
- performance 结论使用 Instruments/实际测量，不用普通日志时间戳替代 profiling。

## 8. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/telemetry/SKILL.md
- https://developer.apple.com/documentation/os/logger
- https://developer.apple.com/documentation/os/logging
