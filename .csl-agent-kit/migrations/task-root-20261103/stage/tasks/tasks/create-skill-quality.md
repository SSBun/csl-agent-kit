# 创建内置 Skill Quality 工具

Status: Completed (2026-08-27 15:06)
Kind: Task

## Target
- [x] T1: 仓库提供可发现的内置 skill-quality Skill 与确定性检查入口，可检查单个或全部 Skill package，并以 pass、warning、failure 及退出码报告约定的最小质量门禁。
- [x] T2: 日常 Skill 修改门禁完全由仓库内置工具提供，不保留先前外部审计系统的名称、依赖、说明或兼容边界；非 Skill 规则验证边界保持不变。
- [x] T3: 确定性验证覆盖有效 package、frontmatter 或资源错误、上下文预算以及已有 routing fixtures；工具不执行 package scripts、项目测试、构建、打包或 telemetry，也不生成主观 portfolio 评分。
- [x] T4: 整个 CSL Agent Kit 仓库，包括当前生效代码、Skills、规则、元数据、使用文档、历史任务记录和分析档案，不再包含先前外部审计系统的名称、引用、依赖、归因或专属审计产物，并通过全仓语义搜索确认无残留。

## Scope

- 保留共享 `skill-quality` 的本地确定性门禁能力，并使实现、说明、fixtures 与归因完全独立于先前外部审计系统。
- 清除整个仓库中的相关名称、引用、依赖、兼容说明和专属历史产物，包括任务记录、报告、分析档案与文件名。
- 保留与该系统无关的历史内容；不修改 lockfile 中偶然形成相同字符序列的完整性摘要。

## Plan

1. 删除专属历史任务、报告与分析产物，并同步 canonical task index。
2. 重写当前规则、Skill package、fixtures、Context 和测试中的现行边界。
3. 清理其余历史文档、任务与报告中的残留引用，同时保持各格式可解析。
4. 运行全仓语义搜索、内置质量门禁和获准的静态验证，然后完成任务门禁。

## Result

- T2: 现行项目规则、相关 Maintainer Validation、Skill package 与 fixtures 仅使用仓库内置 skill-quality；实现无外部运行时、归因文件或兼容说明。
- T3: 本地 smoke 观察到有效包 pass、frontmatter/JSON 错误 failure、预算 warning、routing 误分类 failure，且 package script 未执行；全仓 28 个 package 为 0 failure。
- T4: 工作树中品牌语义、专属 feature 与现存路径搜索均为 0；16 个专属审计/任务产物已删除，70 JSON、7 JSONL（606 records）和 35 YAML 全部可解析。
- T1: 已新增可发现的 skill-quality package 及单包/全仓 CLI；Pi 注册、Claude manifest 和 npm pack dry-run 均包含该 Skill。
- Review gate: Skipped — 用户未请求独立审查；已完成范围、误替换、残留路径、格式损坏与外部依赖的内联质疑式自审。

## Verification

- Passed: 最终检查确认 skill-quality self-check pass；全仓 28 packages 0 failure（14 个既有预算或可选 interface warning）；Node 语法、70 JSON、7 JSONL（606 records）、35 YAML、Context/Lessons/task validate、品牌语义与专属 feature/path 零残留搜索及 git diff --check 均通过；按用户规则未运行单元测试或项目测试套件。
