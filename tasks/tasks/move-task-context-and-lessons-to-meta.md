# 将 task-context 与 task-lessons 移至 meta 分类

Status: Completed (2026-08-21 18:07)
Kind: Task

## Scope

- 将 `skills/task-context/` 与 `skills/task-lessons/` 移至 `skills/meta/`，同步当前 manifest、文档、测试与 Context 引用。
- 保持 Skill 名称和行为不变，不保留旧路径别名，不改写历史任务记录。
- 保留并避开当前工作区中与本任务无关的未提交改动。

## Target
- [x] T1: task-context 与 task-lessons 位于 skills/meta/ 下，且所有必要引用同步更新。
- [x] T2: 两个 Skill 的发现、校验与现有行为保持有效。

## Plan

1. 解析两个 Skill 包的当前消费者并保存移动前基线。
2. 移动两个包，同步所有当前路径消费者与 Context Authority。
3. 验证 canonical 路径、Skill 发现、相关测试、Skill 包审计与 diff 完整性。

## Result

- T1: 逐文件 SHA-256 基线确认两个包内容与权限保持不变；新 canonical 路径存在、旧路径不存在，当前 README、Claude manifest、测试与 Context Authority 均已切换到 skills/meta。
- T2: Context/Lessons CLI self-test 与 validate、6 项聚焦测试、Pi nested alias、Claude 23/23 manifest 路径、npm pack、install dry-run、OpenAI quick validation 均通过；Yao 仅报告规则允许的 initial-load token 超限。
- Review gate: Skipped — 用户未请求 adversarial review、双 Agent Reviewer–Editor 或独立 Reviewer approval。

## Verification

- Passed: canonical 路径与旧路径扫描、包内容哈希、脚本语法、自测、Context/Lessons 校验、聚焦测试、Pi/Claude/npm 发现、Yao/resource audit 和 git diff --check 已验证；两个宽泛测试入口仅暴露与本移动无关的既有断言失败。
