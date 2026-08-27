# macOS Test Triage

仅在 Xcode 或 SwiftPM macOS test build/execution 失败时读取。通用 bug diagnosis 仍服从项目测试规则和 `bug-fix` skill；本 reference 只补充 macOS harness、host app、entitlement 与 simulator assumption 边界。

## 1. 先确认 Harness

| 项目形态 | 默认入口 |
| --- | --- |
| Xcode workspace/project + shared test scheme | `xcodebuild test` |
| package-first / `Package.swift` test product | `swift test` |
| 项目已有 wrapper/Make/CI command | 优先已有入口 |

Xcode 示例：

```bash
xcodebuild \
  -workspace '<App>.xcworkspace' \
  -scheme '<Scheme>' \
  -destination 'platform=macOS' \
  test
```

SwiftPM 示例：

```bash
swift test
swift test --filter '<TargetOrCase>'
```

Xcode narrow scope 使用项目支持的 `-only-testing:<TestBundle>/<TestClass>/<TestMethod>`；不要凭记忆猜 module/class 名，先从 scheme/test bundle 或失败输出确认。

## 2. 从最小 Scope 开始

1. 用户给出 target/case/filter 时先跑该 scope。
2. 没有 filter 时，优先最可能失败的 test target，不先运行所有 platform/scheme。
3. 单 case 能稳定复现后，才修改 source。
4. 修复后顺序：原 case → 同 class/target → 相关 suite；只有风险需要时才到全 suite。
5. 每次 rerun 必须验证一个新理论；无新信息时不重复整套测试。

## 3. Failure Taxonomy

| 类别 | 判断证据 | 注意点 |
| --- | --- | --- |
| Test build | compiler/linker 在任何 test 执行前失败 | 不报告为 failing assertion。 |
| Assertion | case 实际执行并得到 expected/actual mismatch | 找最小输入和 assertion owner。 |
| Crash/signal | exception、abort、segfault、uncaught signal | 取 backtrace/crash log，不靠重复跑。 |
| Async/flake | timing/order dependent，focused rerun 结果不稳定 | 记录频率和时序，不直接宣称回归。 |
| Fixture/environment | missing file、locale、timezone、permission、network/service | 区分 hermetic contract 与机器配置。 |
| Host app | bundle/resource/application lifecycle 不存在或错误 | UI-hosted/AppKit test 常见。 |
| Entitlement/sandbox | permission/trust 系统拒绝而非 assertion | 切换 signing SOP 验证 artifact。 |
| Platform assumption | test 依赖 UIKit/simulator/touch/device-only behavior | 不把 iOS test recipe 强套到 macOS。 |

## 4. macOS 特有检查

- test 是否需要 host app、main bundle resource、`NSApplication` lifecycle 或 main actor。
- test 是否假设 simulator URL、UIKit class、touch event、mobile path、device orientation 或 iOS-only availability。
- App Sandbox/test host entitlement 是否与 production target 不同。
- UI-hosted test 的窗口创建失败是否来自 process/activation，而非业务 assertion。
- file URL、temporary directory、locale、timezone 与 keychain 是否来自测试可控环境。

## 5. 汇报 Contract

必须报告：

- 实际命令和最小失败 scope；
- build 失败还是 case 已执行；
- failure category 与最小关键输出；
- 当前结论的 confidence；疑似 flake 明确标注；
- 下一次 focused rerun 或根因修复；
- 未运行的更大 scope 与原因。

## 6. 来源

- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/skills/test-triage/SKILL.md
- https://github.com/openai/plugins/blob/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9/plugins/build-macos-apps/commands/test-macos-app.md
- https://developer.apple.com/library/archive/technotes/tn2339/_index.html
