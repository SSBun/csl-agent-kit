---
name: swift-api-design
version: 1.1
owner: Swift / Apple
scope: global
description: 用于设计、命名、审查 Swift API，包括 public/internal declarations、方法、属性、参数标签、协议、关联类型和文档注释。
globs:
  - "**/*.swift"
alwaysApply: false
---

# Swift API Design Guidelines

**Version:** 1.1
**Owner:** Swift / Apple
**Last Updated:** 2026-06-25

## Purpose

按 Swift 官方 API Design Guidelines 设计和审查 API。目标不是让声明本身最短，而是让调用点清晰、一致、符合 Swift 生态惯用法。

## Scope

适用于 Swift API 的命名、参数、参数标签、协议、关联类型、文档注释和重载设计。

不覆盖格式化、文件组织、import 排序、访问控制风格、并发模型、错误处理策略或性能实现细节；这些应交给其他 Swift style SOP。

## Procedure

### 1. 先看调用点

1. 写出至少一个真实调用点。
2. 判断调用点是否能让读者理解操作对象、动作、参数角色和返回含义。
3. 如果只看声明才清楚，重新命名。
4. 优先清晰；不要为了少几个字符牺牲含义。

### 2. 写文档注释来验证设计

1. 为每个 declaration 写文档注释。
2. 先写 summary；summary 是最重要部分。
3. summary 尽量使用一个句子片段，并以句号结尾。
4. function/method summary 说明它做什么、返回什么；省略无效副作用和 `Void` 返回。
5. subscript summary 说明它访问什么。
6. initializer summary 说明它创建什么。
7. 其他 declaration summary 说明它是什么。
8. 如果功能无法用简单文字说明，重新设计 API。
9. 需要补充信息时，再加段落、列表和 Swift symbol documentation markup。
10. 使用 Xcode 能识别的 symbol command，例如 `Parameter`、`Returns`、`Throws`、`Complexity`、`Note`、`Warning`、`SeeAlso`。

### 3. 促进清晰使用

1. 包含所有避免歧义所需的词。
   ```swift
   employees.remove(at: position)
   ```
2. 省略不会在调用点增加信息的词。
   ```swift
   allViews.remove(cancelButton)
   ```
3. 变量、参数和 associated type 按角色命名，不按类型命名。
   ```swift
   var greeting = "Hello"
   func restock(from supplier: WidgetFactory)
   ```
4. 如果 associated type 与 protocol constraint 绑定太紧并造成命名冲突，用 `Protocol` 后缀区分 constraint。
5. 对弱类型信息补偿角色名。弱类型包括 `Any`、`AnyObject`、`NSObject`、`Int`、`String` 等。
   ```swift
   func addObserver(_ observer: NSObject, forKeyPath path: String)
   ```

### 4. 让调用点自然流畅

1. 方法和函数名应让主要调用点形成自然英文短语。
   ```swift
   x.insert(y, at: z)
   x.subviews(havingColor: color)
   ```
2. 不要强迫所有参数都参与流畅短语；核心一两个参数之后，流畅性可以下降。
3. factory method 以 `make` 开头。
   ```swift
   x.makeIterator()
   ```
4. initializer 和 factory method 的第一个参数通常不要与 base name 组成连续短语。
   ```swift
   Color(red: 32, green: 64, blue: 128)
   factory.makeWidget(gears: 42, spindles: 14)
   ```
5. 只有 value-preserving type conversion 的第一个参数通常省略标签。
   ```swift
   Int64(someUInt32)
   ```

### 5. 按副作用命名

1. 无副作用的 function/method 使用 noun phrase。
   ```swift
   x.distance(to: y)
   ```
2. 有副作用的 function/method 使用 imperative verb phrase。
   ```swift
   x.sort()
   x.append(y)
   ```
3. mutating/nonmutating 成对 API 按语义一致命名。
4. 操作天然是动词时，mutating 用祈使动词，nonmutating 优先用过去分词。
   ```swift
   x.reverse()
   let y = x.reversed()
   ```
5. 如果动词带直接宾语，过去分词不合语法时，nonmutating 用现在分词。
   ```swift
   s.stripNewlines()
   let oneLine = t.strippingNewlines()
   ```
6. 操作天然是名词时，nonmutating 用名词，mutating 加 `form` 前缀。
   ```swift
   x = y.union(z)
   y.formUnion(z)
   ```

### 6. 命名类型、协议和布尔 API

1. nonmutating Boolean method/property 应读作关于 receiver 的断言。
   ```swift
   x.isEmpty
   line1.intersects(line2)
   ```
2. 描述“是什么”的 protocol 使用名词。
   ```swift
   Collection
   ```
3. 描述能力的 protocol 使用 `able`、`ible` 或 `ing` 后缀。
   ```swift
   Equatable
   ProgressReporting
   ```
4. 其他 type、property、variable、constant 应读作名词。

### 7. 正确使用术语

1. 常见词能表达同样含义时，不用冷僻术语。
2. 使用术语时，必须遵循既有含义。
3. 不要发明术语的新含义。
4. 避免缩写；若使用缩写，其含义应能被轻易查到。
5. 遵循领域先例。不要为了初学者牺牲既有文化和通用术语。

### 8. 遵守通用约定

1. 任何非 O(1) 的 computed property 必须在文档中说明复杂度。
2. 优先使用 method 和 property，而不是 free function。
3. free function 只用于：
   - 没有明显 `self`。
   - unconstrained generic。
   - 函数语法是既有领域记号。
4. type 和 protocol 使用 `UpperCamelCase`。
5. 其他名称使用 `lowerCamelCase`。
6. 常见全大写 acronym/initialism 应统一按 case convention 全部大写或全部小写。
   ```swift
   utf8Bytes
   UTF8.CodeUnit
   isRepresentableAsASCII
   ```
7. 其他 acronym 当普通词处理。
   ```swift
   radarDetector
   ScubaDiving
   ```
8. method 可以共享 base name，仅当它们语义相同，或属于明确不同的领域。
9. 不要只靠返回类型重载。

### 9. 设计参数名称

1. 参数名服务文档；虽然调用点看不到参数名，但文档会读到。
2. 选择能让文档自然成句的参数名。
   ```swift
   func filter(_ predicate: (Element) -> Bool)
   ```
3. 对常用默认值使用 defaulted parameter，减少 method family。
4. 默认参数优先放在参数列表后部。
5. 不要用多个近似重载替代一个带默认值的方法，除非语义真的不同。

### 10. 设计参数标签

1. 参数无法有用地区分时，省略所有标签。
   ```swift
   min(x, y)
   zip(sequence1, sequence2)
   ```
2. value-preserving type conversion initializer 省略第一个参数标签。
3. narrowing conversion 使用描述 narrowing 的标签。
   ```swift
   init(truncating source: UInt64)
   init(saturating valueToApproximate: UInt64)
   ```
4. 第一个参数形成介词短语时，给它标签；标签通常从介词开始。
   ```swift
   x.removeBoxes(havingLength: 12)
   ```
5. 如果前两个参数共同表示一个单一抽象，标签从介词后开始，以保持抽象清楚。
   ```swift
   a.moveTo(x: b, y: c)
   a.fadeFrom(red: b, green: c, blue: d)
   ```
6. 如果第一个参数形成语法短语，省略它的标签，并把前置词合入 base name。
   ```swift
   x.addSubview(y)
   ```
7. 如果第一个参数不形成语法短语，它应该有标签。
   ```swift
   view.dismiss(animated: false)
   words.split(maxSplits: 12)
   ```
8. defaulted argument 被省略时不参与语法短语，因此默认参数应有标签。
9. 标记所有其他参数。

### 11. 标记 tuple 和 closure 参数

1. API 中出现 tuple 时，标记 tuple member。
2. API 中出现 closure parameter 时，命名 closure 参数。
3. 这些名称必须能被文档引用，并解释返回值或 callback 的语义。
4. closure 参数名按普通参数名标准选择。

### 12. 谨慎处理 unconstrained polymorphism

1. 对 `Any`、`AnyObject` 和 unconstrained generic overload 格外谨慎。
2. 如果 overload set 在弱类型下可能产生歧义，拆成更明确的名称。
3. 用文档注释检查歧义；如果两个 overload 的 summary 很难区分，通常应重命名。
   ```swift
   append(_ newElement: Element)
   append(contentsOf newElements: S)
   ```

## Review Checklist

- 调用点是否清晰，而不是只有声明清晰？
- 每个 declaration 是否有可读 summary？
- 名称是否按角色而不是类型命名？
- 是否删除了不会增加调用点信息的词？
- 弱类型参数是否补偿了角色名？
- 有副作用和无副作用 API 是否按不同规则命名？
- mutating/nonmutating 成对 API 是否语义一致？
- protocol 名称是否表达“是什么”或“能力”？
- 参数名是否能让文档自然成句？
- 参数标签是否符合 conversion、prepositional phrase、grammatical phrase 和 defaulted argument 规则？
- tuple member 和 closure parameter 是否有解释性名称？
- overload set 是否避免了 `Any` 或 unconstrained generic 下的歧义？

## Error Handling

| Scenario | Resolution | Escalate To |
|---|---|---|
| 官方 guideline 与团队 style 冲突 | 先按官方 API design 判断；团队格式或工程约定放到单独 SOP | 项目 owner |
| API 名称符合语法但调用点误导 | 以调用点含义为准，重命名 | API reviewer |
| overload set 在弱类型下歧义 | 改用更具体 base name 或 argument label | API owner |
| 无法写出简单文档 summary | 重新设计 API，而不是补长注释 | API owner |

## References

- [Swift API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/)
