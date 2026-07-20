# 将 Swift 样例迁移为样式规则参考

## 计划

- [x] 用逐条规则和短示例创建 `swift-style.md`，覆盖 enum 注释、`MARK`、extension 与多参数方法布局。
- [x] 合并旧用户级 `swift-code-style.md` 的适用规则并删除该文件，同时删除被替代的 `swift.swift`。
- [x] 更新 Code Style SOP 的引用和 workspace context。
- [x] 验证 Markdown、引用、差异格式与技能规则审计。

## 复核

- 新增 `skills/sop-manager/references/code-style/swift-style.md`：逐条定义 Swift 的局部结构规则，并用短代码片段说明 enum case 的 `///` 注释、`// MARK: -`、职责 extension、单 protocol conformance extension 和多参数方法换行。
- 已合并旧用户级 `~/.csl-agent-kit/sops/swift-code-style.md` 的局部一致性、`private(set)`、lowerCamelCase、最小改动、坏味道与验证规则，并删除该文件和被替代的 `swift.swift`。
- `code-style.md` 现引用 `swift-style.md`，且明确只排除“协议设计”，不排除 protocol conformance 的文件内组织。SOP 摘要和候选路由的 Swift 风格正例只命中 `code-style`。
- 文件存在性、旧文件缺失、空白与 `git diff --check` 均通过。Yao lint、资源边界和治理检查通过；聚合校验仍只报告既有的 `agents/interface.yaml` 缺失，资源边界与治理仅有既有警告。

---
