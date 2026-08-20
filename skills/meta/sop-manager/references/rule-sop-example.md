---
name: swift-api-naming-review
description: Review Swift API naming, argument labels, documentation comments, and overload choices.
when_to_use: Use when designing or reviewing Swift API naming, argument labels, documentation comments, or overload choices.
version: 1.0
update_date: 2026-07-08
globs:
  - "**/*.swift"
do_not_use_when:
  - Only formatting Swift files, sorting imports, or organizing file layout.
  - The task is mainly about concurrency models, error handling strategy, or performance implementation details.
alwaysApply: false
---

# SOP: Swift API 命名审查

## 1. 目的

指导 agent 用一组判断规则审查 Swift API 是否清晰、符合调用点语义，并避免为了简短牺牲可读性。

## 2. 适用范围

适用：

- 新增或修改 Swift API declaration。
- 审查方法、属性、参数标签、协议、关联类型、文档注释或重载设计。

不适用：

- 纯格式化、import 排序、文件组织或访问控制风格。
- 并发模型、错误处理策略、性能实现细节。

## 3. 使用方式

1. 找到本次新增或修改的 API declaration。
2. 找到至少一个真实调用点；没有调用点时，先构造最小调用示例。
3. 只检查与本次变更相关的规则分组。
4. 如果规则冲突，按“调用点清晰度 > 官方惯例 > 项目局部风格 > 简短性”处理。
5. 最后用完成标准 checklist 验收。

## 4. 规则分组

### 调用点清晰度

- 调用点必须让读者理解操作对象、动作、参数角色和返回含义。
- 如果只看 declaration 才清楚，重新命名。
- 不要为了少几个字符牺牲含义。

### 参数和标签

- 参数名按角色命名，不按类型命名。
- 弱类型参数必须补偿角色名，例如 `String`、`Int`、`Any`、`AnyObject`。
- 默认参数应有清楚标签，避免调用点省略后产生歧义。

### 文档注释

- 每个 public 或共享 API 必须能写出一句简短 summary。
- 如果 summary 需要长段解释才能说清，优先重新设计 API。
- 非 O(1) computed property 必须说明复杂度。

### 重载

- 只在语义相同或领域明确不同时共享 base name。
- 不要只靠返回类型区分 overload。
- 如果 `Any`、`AnyObject` 或 unconstrained generic 下会歧义，改用更具体名称。

## 5. 冲突处理

| 冲突 | 处理方式 |
|---|---|
| 官方惯例和项目局部风格冲突 | 先按官方惯例判断；项目局部风格只能作为次级约束。 |
| 名称语法正确但调用点误导 | 以调用点含义为准，重命名。 |
| 简短性和清晰性冲突 | 选择清晰性。 |
| 无法写出简短 summary | 重新设计 API，不用长注释掩盖问题。 |

## 6. 完成标准

- [ ] 已检查至少一个真实或最小调用点。
- [ ] API 名称表达角色和语义，而不是只表达类型。
- [ ] 参数标签不会让调用点产生歧义。
- [ ] 文档 summary 可以用一句话说明 API。
- [ ] overload set 不依赖返回类型或弱类型猜测。
