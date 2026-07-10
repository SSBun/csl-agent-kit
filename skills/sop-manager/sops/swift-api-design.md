---
name: swift-api-design
description: Review Swift API design, naming, argument labels, protocols, and documentation comments.
when_to_use: Use when designing, naming, or reviewing Swift APIs, including public/internal declarations, methods, properties, argument labels, protocols, associated types, and documentation comments.
version: 1.2
update_date: 2026-07-09
globs:
  - "**/*.swift"
do_not_use_when:
  - Only formatting Swift files, sorting imports, organizing files, or adjusting access-control style.
  - Only organizing Swift file structure, properties, or methods.
  - The task is mainly about concurrency models, error handling strategy, or performance implementation details.
alwaysApply: false
---

# SOP: Swift API Design

## 1. 目的

按本地 wiki 保存的 Swift.org 官方 API Design Guidelines 设计和审查 Swift API。目标是让调用点清晰、一致、符合 Swift 生态惯用法；简短只在不损害清晰性时才有价值。

## 2. 适用范围

适用：

- 设计、命名或审查 Swift API declaration。
- 审查方法、属性、subscript、initializer、参数名、参数标签、协议、关联类型、closure 参数、tuple member、文档注释和 overload set。
- 判断 Swift API 是否符合官方命名和调用点惯例。

不适用：

- 纯格式化、import 排序、文件组织、访问控制风格。
- 并发模型、错误处理策略、性能实现细节。
- 团队私有 style 与官方 API design 无关的规则；这些应交给 Swift style SOP。

## 3. 使用方式

1. 找到本次新增或修改的 Swift API declaration。
2. 找到至少一个真实调用点；没有调用点时，先构造最小调用示例。
3. 写出或检查文档 summary；如果 summary 很难简短说明 API，优先重新设计 API。
4. 只检查与本次变更相关的规则分组。
5. 如果规则冲突，按“调用点清晰度 > 官方 Swift 惯例 > 项目局部风格 > 简短性”处理。
6. 最后用完成标准 checklist 验收。

## 4. 规则分组

### 4.1 基本原则

- 调用点清晰是最重要目标；只看 declaration 不够，必须检查 use case。
- 清晰性优先于简短性；Swift 的简洁应来自类型系统和语言特性，不应来自省略语义。
- 每个 declaration 都应能写出文档注释；写文档时暴露的解释困难通常说明 API 设计有问题。

### 4.2 文档注释

- 每个 declaration 都应有 documentation comment。
- summary 是最重要部分；优先使用一个句子片段，并以句号结尾。
- function/method summary 说明它做什么、返回什么；省略无效副作用和 `Void` 返回。
- subscript summary 说明它访问什么。
- initializer summary 说明它创建什么。
- 其他 declaration summary 说明它是什么。
- 需要补充信息时，再加段落、列表和 Swift symbol documentation markup。
- 使用 Xcode 能识别的 symbol command，例如 `Parameter`、`Returns`、`Throws`、`Complexity`、`Note`、`Warning`、`SeeAlso`。

### 4.3 清晰使用

- 包含所有避免歧义所需的词。
  ```swift
  employees.remove(at: position)
  ```
- 省略不会在调用点增加信息的词；不要重复调用点已知的类型信息。
  ```swift
  allViews.remove(cancelButton)
  ```
- 变量、参数和 associated type 按角色命名，不按类型命名。
  ```swift
  var greeting = "Hello"
  func restock(from supplier: WidgetFactory)
  ```
- 如果 associated type 与 protocol constraint 绑定太紧并造成命名冲突，用 `Protocol` 后缀区分 constraint。
- 对弱类型信息补偿角色名。弱类型包括 `Any`、`AnyObject`、`NSObject`、`Int`、`String` 等。
  ```swift
  func addObserver(_ observer: NSObject, forKeyPath path: String)
  ```

### 4.4 流畅调用点

- 方法和函数名应让主要调用点形成自然英文短语。
  ```swift
  x.insert(y, at: z)
  x.subviews(havingColor: color)
  ```
- 不要强迫所有参数都参与流畅短语；核心一两个参数之后，流畅性可以下降。
- factory method 以 `make` 开头。
  ```swift
  x.makeIterator()
  ```
- initializer 和 factory method 的第一个参数通常不要与 base name 组成连续短语。
  ```swift
  Color(red: 32, green: 64, blue: 128)
  factory.makeWidget(gears: 42, spindles: 14)
  ```
- 只有 value-preserving type conversion 的第一个参数通常省略标签。
  ```swift
  Int64(someUInt32)
  ```

### 4.5 副作用命名

- 无副作用的 function/method 使用 noun phrase。
  ```swift
  x.distance(to: y)
  ```
- 有副作用的 function/method 使用 imperative verb phrase。
  ```swift
  x.sort()
  x.append(y)
  ```
- mutating/nonmutating 成对 API 按语义一致命名。
- 操作天然是动词时，mutating 用祈使动词，nonmutating 优先用过去分词。
  ```swift
  x.reverse()
  let y = x.reversed()
  ```
- 如果动词带直接宾语，过去分词不合语法时，nonmutating 用现在分词。
  ```swift
  s.stripNewlines()
  let oneLine = t.strippingNewlines()
  ```
- 操作天然是名词时，nonmutating 用名词，mutating 加 `form` 前缀。
  ```swift
  x = y.union(z)
  y.formUnion(z)
  ```

### 4.6 类型、协议和布尔 API

- nonmutating Boolean method/property 应读作关于 receiver 的断言。
  ```swift
  x.isEmpty
  line1.intersects(line2)
  ```
- 描述“是什么”的 protocol 使用名词。
  ```swift
  Collection
  ```
- 描述能力的 protocol 使用 `able`、`ible` 或 `ing` 后缀。
  ```swift
  Equatable
  ProgressReporting
  ```
- 其他 type、property、variable、constant 应读作名词。

### 4.7 术语

- 常见词能表达同样含义时，不用冷僻术语。
- 使用术语时，必须遵循既有含义；不要发明术语的新含义。
- 避免非标准缩写；若使用缩写，其含义应能被轻易查到。
- 遵循领域先例。不要为了初学者牺牲既有文化和通用术语。

### 4.8 通用约定

- 任何非 O(1) 的 computed property 必须在文档中说明复杂度。
- 优先使用 method 和 property，而不是 free function。
- free function 只用于：
  - 没有明显 `self`。
  - unconstrained generic。
  - 函数语法是既有领域记号。
- type 和 protocol 使用 `UpperCamelCase`。
- 其他名称使用 `lowerCamelCase`。
- 常见全大写 acronym/initialism 应统一按 case convention 全部大写或全部小写。
  ```swift
  utf8Bytes
  UTF8.CodeUnit
  isRepresentableAsASCII
  ```
- 其他 acronym 当普通词处理。
  ```swift
  radarDetector
  ScubaDiving
  ```
- method 可以共享 base name，仅当它们语义相同，或属于明确不同的领域。
- 不要只靠返回类型重载。

### 4.9 参数名称

- 参数名服务文档；虽然调用点看不到参数名，但文档会读到。
- 选择能让文档自然成句的参数名。
  ```swift
  func filter(_ predicate: (Element) -> Bool)
  ```
- 对常用默认值使用 defaulted parameter，减少 method family。
- 默认参数优先放在参数列表后部。
- 不要用多个近似重载替代一个带默认值的方法，除非语义真的不同。
- 生产 API 优先使用 `#fileID`，节省空间并保护开发者隐私；只在不会面向最终用户运行的测试 helper 或脚本中，为开发工作流或文件 I/O 使用 `#filePath`；需要保持 Swift 5.2 或更早源码兼容时使用 `#file`。

### 4.10 参数标签

- 参数无法有用地区分时，省略所有标签。
  ```swift
  min(x, y)
  zip(sequence1, sequence2)
  ```
- value-preserving type conversion initializer 省略第一个参数标签。
- narrowing conversion 使用描述 narrowing 的标签。
  ```swift
  init(truncating source: UInt64)
  init(saturating valueToApproximate: UInt64)
  ```
- 第一个参数形成介词短语时，给它标签；标签通常从介词开始。
  ```swift
  x.removeBoxes(havingLength: 12)
  ```
- 如果前两个参数共同表示一个单一抽象，标签从介词后开始，以保持抽象清楚。
  ```swift
  a.moveTo(x: b, y: c)
  a.fadeFrom(red: b, green: c, blue: d)
  ```
- 如果第一个参数形成语法短语，省略它的标签，并把前置词合入 base name。
  ```swift
  x.addSubview(y)
  ```
- 如果第一个参数不形成语法短语，它应该有标签。
  ```swift
  view.dismiss(animated: false)
  words.split(maxSplits: 12)
  ```
- defaulted argument 被省略时不参与语法短语，因此默认参数应有标签。
- 标记所有其他参数。

### 4.11 Tuple、closure 和 unconstrained polymorphism

- API 中出现 tuple 时，标记 tuple member。
- API 中出现 closure parameter 时，命名 closure 参数。
- tuple member 和 closure 参数名必须能被文档引用，并解释返回值或 callback 的语义。
- closure 参数名按普通参数名标准选择。
- 对 `Any`、`AnyObject` 和 unconstrained generic overload 格外谨慎。
- 如果 overload set 在弱类型下可能产生歧义，拆成更明确的名称。
- 用文档注释检查歧义；如果两个 overload 的 summary 很难区分，通常应重命名。
  ```swift
  append(_ newElement: Element)
  append(contentsOf newElements: S)
  ```

## 5. 冲突处理

| 场景 | 处理方式 |
|---|---|
| 官方 guideline 与团队 style 冲突 | 先按官方 API design 判断；团队格式或工程约定放到单独 SOP。 |
| API 名称符合语法但调用点误导 | 以调用点含义为准，重命名。 |
| 简短性和清晰性冲突 | 选择清晰性。 |
| 文档 summary 无法简短说明 API | 重新设计 API，而不是补长注释。 |
| overload set 在弱类型下歧义 | 改用更具体 base name 或 argument label。 |
| 默认参数省略后影响调用点语义 | 给默认参数保留标签，或重新设计 API。 |

## 6. 完成标准

- [ ] 已检查至少一个真实调用点或最小调用示例。
- [ ] 调用点清晰，而不是只有 declaration 清晰。
- [ ] 每个相关 declaration 都能写出可读 summary。
- [ ] 名称按角色和语义命名，而不是只按类型命名。
- [ ] 已删除不会增加调用点信息的词。
- [ ] 弱类型参数已补偿角色名。
- [ ] 有副作用和无副作用 API 按不同规则命名。
- [ ] mutating/nonmutating 成对 API 语义一致。
- [ ] protocol 名称表达“是什么”或“能力”。
- [ ] 参数名能让文档自然成句。
- [ ] 参数标签符合 conversion、prepositional phrase、grammatical phrase 和 defaulted argument 规则。
- [ ] tuple member 和 closure parameter 有解释性名称。
- [ ] overload set 避免了 `Any`、`AnyObject` 或 unconstrained generic 下的歧义。
- [ ] 非 O(1) computed property 已说明复杂度。
- [ ] `#fileID`、`#filePath`、`#file` 的选择符合运行环境和兼容性要求。

## 7. 参考资料

- `/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/Swift/Swift API Design Guidelines.md`
- https://www.swift.org/documentation/api-design-guidelines/
