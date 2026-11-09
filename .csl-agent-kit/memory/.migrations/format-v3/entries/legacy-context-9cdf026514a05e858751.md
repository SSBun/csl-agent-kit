---
schema: csl-memory/v1
id: legacy-context-9cdf026514a05e858751
revision: 1
type: fact
title: 项目评测布局与验证边界
summary: 维护 evals、项目专用 Skill 发现或 Task Target 评测时使用；不把静态 fixtures 当作模型行为证据。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-project-evals — Project-local evaluation
    workspace:1
updated: 2026-11-02T03:43:08.218Z
deleted: false
---

## CTX-project-evals — Project-local evaluation workspace
- Scope: 仓库专用评测套件、共享评测脚本、生成结果边界和 project-only evaluation skills 的 canonical 存储与发现。
- Paths: `evals/`, `.agents/skills/task-target-alignment-eval`
- Keywords: project evals, task target alignment eval, gold cases, scorer, project-local skill, symlink discovery
- Authority: `evals/README.md`, `evals/scripts/check-project-evals.js`, `evals/scripts/evaluate-task-target-alignment.js`, `evals/task-target-alignment/cases.json`, `evals/skills/task-target-alignment-eval/SKILL.md`
- Recheck: 当根评测目录布局、项目 skill 发现入口、发布清单、结果持久化边界或评测 runner contract 变化时复核。

### Purpose and Boundaries
- 根 `evals/` 是项目评测 artifacts 的 canonical source，只服务当前 CSL Agent Kit 仓库；它不属于共享 `skills/` 分发树、npm 发布清单、全局安装或 Pi 共享命令枚举。

### Structure
- `evals/scripts/` 保存跨 suite 的确定性 validator／runner／scorer，`evals/<suite>/` 保存 tracked cases 与 suite 文档，`evals/skills/<name>/` 保存评测 skill 源码；各 suite 的 `results/` 是默认忽略的生成数据。
- `.agents/skills/task-target-alignment-eval` 是指向 canonical skill source 的唯一相对 symlink 发现入口。Pi 会跟随 project `.agents/skills` 目录链接，共享 CLI 只枚举根 `skills/`，因此该 skill 只在受信任的当前项目中激活。

### Workflows
- 修改评测 suite、skill 或发现边界后运行 layout check、evaluator `validate`、针对 symlink package 的 Skill Quality 和 Context validation；`--self-test` 与项目测试须当前请求明确授权。v6 `prepare` 请求不含 oracle，`workType` 区分当前探索／实现工作；等价探索用 null level 的 `continue_exploration`，不产生接受证据。`authorizedClauses` 只表示授权来源，`confirmationItems`／`goal_recheck` 表示需要的用户目标复核；`continue_unchanged` 仍需完整候选及真实接受来源，`show_continue` 仍是策略错误。scorer 检查探索误确认、实现／用户暂停漏等待、越界继续、接受复用、覆盖、原因、展示、委派和 Safety；comparison 只接受相同 v6 dataset hash，旧报告不证明当前策略。固定候选与索引不证明语义、自由生成或真实工具时序，须另获授权后观察；结果保持 provisional／report-only。权威为 `evals/scripts/evaluate-task-target-alignment.js` 和 `evals/task-target-alignment/cases.json`。

### Decision and Verification Boundaries
- Oracle cases、schema、固定 prediction samples 和确定性脚本可提交；当前 Task Target labels 在人工 adjudication 前保持 provisional／report-only。付费模型 run 需要当前用户明确授权，prediction／报告默认写入 ignored `results/`。不得保存 chain-of-thought、凭据、客户数据或未脱敏完整会话。
