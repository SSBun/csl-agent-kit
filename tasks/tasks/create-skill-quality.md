# 创建内置 Skill Quality 工具

Status: In Progress (2026-08-27 13:37)
Kind: Task

## Target

- [ ] T1: 仓库提供可发现的内置 skill-quality Skill 与确定性检查入口，可检查单个或全部 Skill package，并以 pass、warning、failure 及退出码报告约定的最小质量门禁。
- [ ] T2: 日常 Skill 修改门禁改用仓库内置工具，不再强制依赖 Yao 或 OpenAI validator；Yao 仅保留为可选深度审计，非 Skill 规则验证边界保持不变。
- [ ] T3: 确定性验证覆盖有效 package、frontmatter 或资源错误、上下文预算以及已有 routing fixtures，且不引入完整 Skill OS、治理评分、打包、telemetry、自动项目测试或 0–100 自动评分。

## Scope

- 新增共享 `skill-quality` Skill、确定性检查脚本、接口元数据与 routing fixtures。
- 将当前日常 Skill 维护规则和仍在使用的 Maintainer Validation 文案迁移到内置工具；历史报告与任务记录不回写。
- 增加聚焦回归覆盖，并在 `tasks/context.md` 记录新的稳定质量门禁边界。
- 不实现 Yao 的治理评分、manifest 要求、Skill IR、打包、telemetry、自动项目测试或 0–100 评分。

## Plan

- [ ] 实现单包与全仓模式，以及结构、frontmatter、资源、上下文预算、接口和 routing fixtures 检查。
- [ ] 增加 Skill package 元数据、routing fixtures 与聚焦回归覆盖。
- [ ] 迁移项目规则和当前 Maintainer Validation 消费者，清理强制外部 validator 依赖。
- [ ] 更新 Context Pack，并运行获准的确定性验证与任务完成门禁。
