# 新增内置 Code Style SOP 与 Swift 模板

## 计划

- [x] 创建跨语言的内置 `code-style` 规则型 SOP，并明确不与 API 设计、架构或业务规则混用。
- [x] 创建首个 Swift 参考模板 `skills/sop-manager/references/code-style/swift.swift`。
- [x] 验证 SOP 候选路由、Swift 语法和差异格式。
- [x] 按仓库规则运行 `yao-meta-skill` 审计。

## 复核

- 新增 `skills/sop-manager/sops/code-style.md`：按语言读取模板、以项目局部风格为高优先级、限制为当前任务的最小风格改动。
- 新增 `skills/sop-manager/references/code-style/swift.swift`：展示 lowerCamelCase 属性、`private(set)` 源状态与相邻的派生状态和行为。
- `swiftc -parse` 通过；候选路由正例命中 `code-style`，Swift API 设计与架构反例不命中；`git diff --check` 通过。
- `yao-meta-skill` 的 lint 与资源边界检查通过；governance 仅报告既有的可选 `manifest.json` 缺失，`validate_skill.py` 仅报告既有的 `agents/interface.yaml` 缺失，均未在本次扩大范围修复。

---
