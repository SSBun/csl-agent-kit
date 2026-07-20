# 为 Swift 规则按需加入代码块

## 计划

- [x] 在 enum 注释、MARK、功能 extension、protocol conformance extension 和多参数方法规则下加入最小代码块。
- [x] 明确主 SOP 中代码块只在规则需要精确语法参考时使用。
- [x] 更新 workspace context，并验证 Markdown、路由、差异格式与技能规则审计。

## 复核

- `swift-style.md` 在五条需要精确 Swift 语法或布局的规则下加入短代码块：enum case 注释、MARK、功能 extension、单 protocol conformance extension 和多参数方法。
- `code-style.md` 明确代码块仅在文字无法充分表达语法或布局时使用，且必须紧邻对应规则；规则仍是参考文件的主体。
- 五组 Swift 代码围栏均成对；SOP 摘要和候选路由保持不变，`git diff --check` 与空白检查通过。
- Yao lint、资源边界和治理检查通过；聚合校验仍只报告既有的 `agents/interface.yaml` 缺失，资源边界与治理仅有既有警告。

---
