---
name: code-style
description: Apply language-specific code style references when writing, refactoring, or reviewing code organization and readability.
when_to_use: Use when writing, refactoring, or reviewing code style, file organization, local readability, or simple code smells; identify the language and read its matching style reference before editing.
version: 1.0
update_date: 2026-07-15
do_not_use_when:
  - The task is API naming, parameter labels, protocol design, associated types, or public API design.
  - The task is mainly about business rules, architecture, concurrency, error-handling strategy, or performance strategy.
alwaysApply: false
---

# SOP: Code Style

## 1. 目的

让 agent 在整理代码风格时先使用对应语言的风格参考，再服从项目已经建立的局部约定；目标是清晰、局部、少重复，而不是机械重排代码。

## 2. 适用范围

适用：

- 新增、重构或审查代码风格、文件组织、局部可读性和简单坏味道。
- 需要按语言选择属性、方法、import、文件内分组或命名大小写的默认风格。

不适用：

- API 命名、参数标签、协议设计、关联类型或 public API 设计；使用语言对应的 API design SOP。
- 业务规则、架构、并发、错误处理策略或性能策略。

## 3. 使用方式

1. 确认当前任务的主要语言。
2. 读取对应语言参考；没有参考时，先阅读目标文件和邻近文件的稳定局部风格，不要自行发明通用规则。
3. 对 Swift 的文件结构改动，先阅读目标文件与必要的直接调用方，确认现有的 `// MARK:`、extension、访问控制和成员排列；`swift-style.md` 只处理文件内组织，不决定 API 命名或是否采用 protocol。
4. 将参考视为默认约定，将明确的项目规则和稳定局部风格视为更高优先级。
5. 只整理当前任务触及的代码；不要为了统一风格重排无关区域。
6. 完成后运行与语言和改动风险相称的最小验证。

## 4. 规则

### 语言参考

- 参考提供语言特有的布局、命名和局部坏味道判断；不要把某种语言的规则套到另一种语言。
- 参考以逐条规则说明约定；只有规则需要展示精确语法或布局时，才在该规则下加入最小代码块，不是必须复制的业务实现。
- 新语言参考只在用户明确要求或当前任务确实需要时创建。

### 局部一致性

- 相关状态、行为和 helper 保持邻近，让读者能顺着职责阅读。
- 优先复用当前文件和邻近文件已建立的稳定结构；不要为单个改动引入新分组体系。
- 如果项目约定与参考冲突，采用项目约定，并在结果中说明差异。

### 最小改动

- 每个风格改动都必须直接服务当前任务。
- 不新增无必要的 wrapper、helper、重复状态或抽象。
- 不能证明有价值的格式化、重排或重命名不做。

## 5. 冲突处理

| 冲突 | 处理方式 |
|---|---|
| 明确项目规则与语言参考冲突 | 采用项目规则。 |
| 稳定局部风格与参考冲突 | 采用局部风格；只有用户要求统一时才扩大范围。 |
| 代码风格与 API 设计冲突 | 清晰的调用点和 API 设计优先，改用对应 API design SOP。 |
| 没有对应语言参考 | 按目标和邻近文件的稳定风格处理，并说明缺少参考。 |

## 6. 完成标准

- [ ] 已识别主要语言并读取对应参考，或说明参考不存在。
- [ ] 已阅读目标文件和必要的邻近文件。
- [ ] 未把语言参考机械套用到不相符的项目约定。
- [ ] 改动仅覆盖当前任务需要的区域。
- [ ] 未新增无必要的 wrapper、helper、重复状态或抽象。
- [ ] 已运行最小且相关的格式、语法或测试验证。

## 7. 语言参考

| 语言 | 文件 |
|---|---|
| Swift | `references/code-style/swift-style.md` |
