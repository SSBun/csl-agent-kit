# Swift 代码风格规则

## 类型与状态

1. 类型主体放存储状态、静态常量和初始化；只有职责清晰的成员组才拆到 extension。
2. 只读需求优先暴露真实状态为 `private(set)`，不要新增只转发同一值的 readonly wrapper。
3. 属性、`static let` 和 `static var` 使用 lowerCamelCase；类型名使用 UpperCamelCase。
4. 默认使用 `T?` 表示可空值；`T!` 只可位于 `IBOutlet`、ObjC 互操作、受控生命周期或测试边界，并将范围限制到最小。
5. 集合和可选类型使用 `[Element]`、`[Key: Value]` 和 `T?` 简写，不写等价的 `Array<Element>`、`Dictionary<Key, Value>` 或 `Optional<T>`。

## 可选值与失败路径

1. 不要无说明地使用 `!`、`as!` 或 `try!`；只有当前作用域可证明不变量时才可使用，并在该处说明原因。
2. 只需判断值是否存在时使用 `value != nil`；需要取得值时使用 `if let` 或 `guard let`。
3. 失败条件会退出当前作用域时，使用 `guard` 尽早返回，避免嵌套的条件金字塔。

```swift
guard let retryCount = Int(text) else {
    return
}
```

## 控制流

1. 循环体只有一层筛选条件时，使用 `for ... where`，不要在循环体内包一层 `if`。

```swift
for request in requests where request.isRetryable {
    retry(request)
}
```

2. 合并具有相同行为的 `switch` case 或范围；不要用只包含 `fallthrough` 的 case 串联控制流。
3. 对来自 ObjC 或系统框架、未来可能增加 case 的 enum，如需兜底，使用 `@unknown default`，不要用普通 `default` 掩盖已知 case 的遗漏。

```swift
switch status {
case .ready, .running:
    start()
@unknown default:
    reportUnsupportedStatus()
}
```

## enum 与 MARK

1. 对表示状态、行为或带有关联值的 enum case，在 case 正上方使用 `///` 描述语义或结果，不要只重复 case 名称。

```swift
enum RetryDecision {
    /// Allows another retry attempt.
    case retry
}
```

2. 在职责分组或 extension 前使用 `// MARK: - <分组名>`；不要写成 `//MARK:` 或 `// MARK:-`。

```swift
// MARK: - Retry Actions
```

## extension 组织

1. 多个方法按功能模块拆分 extension，例如“派生状态”“重试操作”“报告”；同一职责的成员留在同一个 extension。

```swift
// MARK: - Retry Actions

extension RetryState {
    func recordRetry() {
        retryCount += 1
    }
}
```

2. 不要为单个小方法创建独立 extension，也不要为了整齐把相关状态和行为分散到远处。
3. 每个 protocol conformance 使用一个独立 extension，并以 protocol 名称作为 MARK；不要把无关协议合并到同一个 extension。

```swift
// MARK: - CustomStringConvertible

extension RetryState: CustomStringConvertible {
    var description: String { "RetryState" }
}

// MARK: - Equatable

extension RetryState: Equatable {
    static func == (lhs: RetryState, rhs: RetryState) -> Bool {
        lhs.retryCount == rhs.retryCount
    }
}
```

## 方法布局

1. 多参数方法声明在一行内无法清楚阅读时，开括号后换行，每个参数独占一行，闭括号和返回类型单独对齐。

```swift
func retrySummary(
    requestIdentifier: String,
    retryPolicyName: String,
    sourceName: String
) -> String {
    "..."
}
```

2. 不要用固定字符数强制所有短方法换行。
3. 只读计算属性省略 `get`；不返回值的方法省略 `-> Void`；直接构造对象时省略 `Type.init(...)` 中冗余的 `.init`。

## 文档注释

1. 跨模块或公开使用的声明使用 `///` 写一条说明其语义的简短 summary；不要只重复类型、方法或 case 名称。

## 改动边界与验证

1. 项目已有稳定的分组、MARK 或成员排列时，采用项目风格。
2. 不新增单一用途的 wrapper、helper、抽象或重复状态；无关成员不移动、不重命名、不格式化。
3. 移动成员会影响 `override`、访问控制或兼容 API 时，不移动实现；readonly wrapper 已是外部 API 时，不在纯风格改动中删除。
4. 运行 `git diff --check`；Swift 文件可独立解析时运行 `swiftc -parse`，否则说明原因。
