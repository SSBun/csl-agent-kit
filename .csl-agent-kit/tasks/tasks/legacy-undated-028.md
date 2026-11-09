# 补充 Swift 小型代码风格规则

## 计划

- [x] 将已调研的十项可执行 Swift 规则按主题写入 `swift-style.md`。
- [x] 保留现有 API Design SOP 的语义边界，不加入行宽、`self`、import 排序等纯团队偏好。
- [x] 验证 Markdown、差异格式与技能规则审计。

## 复核

- `swift-style.md` 新增可选值、失败路径、控制流、类型表达式和文档注释规则，覆盖强制操作、`T!`、`guard`、`for ... where`、合并 `switch` case、`@unknown default`、类型简写、冗余语法与公开声明 summary。
- 保留 Swift API Design SOP 对文档语义的要求；未加入行宽、`self`、import 排序等纯团队偏好。
- Markdown 代码围栏成对，`git diff --check` 通过；local quality gate lint 通过，资源与治理检查只有既有警告，聚合校验仍只报告既有的 `agents/interface.yaml` 缺失。

---
