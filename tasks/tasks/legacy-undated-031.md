# 收紧 Swift 风格参考边界

## 计划

- [x] 将 `swift-style.md` 改为仅含按主题分组的具体 Swift 规则与短示例。
- [x] 将适用边界和使用顺序移至 `code-style.md`，不重复保留在参考文件。
- [x] 更新 workspace context，并验证 Markdown、路由、差异格式与技能审计。

## 复核

- `swift-style.md` 现仅保留五个规则分区：类型与状态、enum 与 MARK、extension 组织、方法布局、改动边界与验证；不再包含范围、使用顺序、例外、坏味道或完成检查章节。
- `code-style.md` 的使用方式现在承载 Swift 的使用说明：结构改动前读取目标文件和必要调用方，确认局部结构；参考只处理文件内组织，不决定 API 命名或 protocol 是否应采用。
- 分区检查确认参考文件只有五个规则标题且没有被移走的章节；SOP 摘要和 Swift 风格候选路由仍只命中 `code-style`。空白与 `git diff --check` 通过。
- local quality gate lint、资源边界和治理检查通过；聚合校验仍只报告既有的 `agents/interface.yaml` 缺失，资源边界与治理仅有既有警告。

---
