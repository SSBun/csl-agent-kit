# 将 git-conflict 移至 dev 分类

Status: Completed (2026-08-21 15:57)
Kind: Task

## Scope

- 将 `git-conflict` 转为 `skills/dev/` 下的项目自有 Skill，移除第三方来源元数据与 vendored 清单身份。
- 保持已确认的 Skill 行为不变，不保留旧目录或兼容副本。

## Target
- [x] T1: git-conflict 的 canonical 目录为 skills/dev/git-conflict，旧 mattpocock 目录不存在。
- [x] T2: git-conflict 不再包含第三方来源元数据，也不再属于 mattpocock vendored 来源清单。
- [x] T3: 当前发现、文档与验证消费者只使用新位置，且不产生重复 Skill。

## Plan

1. 将 Skill 包迁至 dev 分类并移除第三方来源身份，同时保持运行时内容不变。
2. 清理 vendored 来源消费者并确认所有当前发现入口解析到唯一新位置。
3. 验证 Skill、递归发现和发布包边界，并记录结果。

## Result

- T1: 全仓 frontmatter 扫描仅在 skills/dev/git-conflict/SKILL.md 找到 git-conflict，旧 mattpocock/git-conflict 目录不存在。
- T2: 新目录不含 .repository.json，vendored expectedSources 已移除 git-conflict，当前非历史内容不存在旧来源路径引用。
- T3: npx skills 递归发现与 Pi runtime 均只发现一个 git-conflict；npm pack 仅包含 skills/dev/git-conflict。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: Yao、resource-boundary、语法、canonical 路径、递归发现、Pi runtime、npm pack、Context/Lessons 与 git diff --check 全部通过；按用户规则未运行单元测试。
