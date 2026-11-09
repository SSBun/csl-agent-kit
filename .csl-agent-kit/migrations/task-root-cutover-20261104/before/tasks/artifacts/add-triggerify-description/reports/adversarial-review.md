---
created: 2026-07-23
task: add-triggerify-description
review_cycles: 2
---

# 为 Triggerify 规则增加描述

Topic: 可选描述字段与 CLI 展示

> **E1:** 增加可选 `description`，由 schema、create/update/clear、serialization、status、show 和 list 共用；qualified ID 仍由文件名决定。
>
> **R1:** 字段和兼容路径正确，但仅拒绝 CR/LF 会允许 tab、Unicode 行分隔符和终端控制字符破坏表格或伪造输出。
>
> **E2:** 在输入校验中拒绝 Unicode `Cc`、`Zl`、`Zp`，并补充 tab、ESC、NEL、行分隔符和段落分隔符回归用例；没有增加转义层或其它 metadata。
>
> **R2:** 描述字段、CLI 操作、旧规则兼容、project metadata-only 边界、文档和测试均满足要求。

**Conclusion:** `description` 可以安全地作为单行表格单元格展示，且没有形成第二份名称来源。

---

**Final decision:** `APPROVED`

**Outcome:** Triggerify 规则支持可选描述，list/show 可以展示，现有规则无需迁移。

**Remaining:** none
