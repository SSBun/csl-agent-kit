---
schema: csl-memory/v1
id: legacy-context-3f04e0f0972b0b999ca0
revision: 1
type: fact
title: Skill package 质量门禁
summary: 修改 Skill package 后如何运行确定性质量检查，以及它不能证明哪些行为。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-skill-quality — Built-in Skill package quality
    gate:1
updated: 2026-11-02T03:43:08.149Z
deleted: false
---

## CTX-skill-quality — Built-in Skill package quality gate
- Scope: 日常 Skill package 的确定性结构、资源、上下文预算与 routing fixture 验证，以及共享和项目本地 package 的检查入口。
- Paths: `skills/meta/skill-quality/`, `AGENTS.md`, `.claude-plugin/plugin.json`, `README.md`, `tests/skill-quality.test.mjs`, `tests/pi-skill-commands.test.mjs`
- Keywords: skill quality, validation, frontmatter, context budget, routing fixtures
- Authority: `skills/meta/skill-quality/SKILL.md`, `skills/meta/skill-quality/scripts/check.js`, `AGENTS.md`
- Recheck: 当 Skill package schema、routing fixture 格式、发现目录、上下文预算或日常维护门禁变化时复核。

### Purpose and Boundaries
- `skill-quality` 是仓库唯一的日常 Skill package 确定性质量门禁。
- 工具只验证声明的 package 契约；不验证非 Skill 规则，也不运行 package 脚本、项目测试、构建、打包或 telemetry。

### Structure
- `scripts/check.js <skill-dir>` 检查单个 package；`--all --workspace <workspace>` 递归发现 `skills/` 与 `.agents/skills/` 下的叶子 `SKILL.md`。共享 Skill 仍由宿主递归发现，Claude manifest 显式枚举共享叶子，项目本地 Skill 不进入共享分发。
- JSON 输出与人类输出都使用 package 级 `pass`、`warning`、`failure`；质量失败返回退出码 2，只有 warning 时返回 0，调用错误返回 1。
- 门禁验证 frontmatter、JSON/YAML、现有 `agents/openai.yaml` display metadata、资源目录和 1000-token 初始加载 warning budget；存在 `trigger_cases.json` 与 `semantic_config.json` 时执行确定性 routing 分类。

### Decision and Verification Boundaries
- 日常 Skill 修改必须逐包运行内置门禁，失败阻塞完成；warning 需要结合 package 语义评估，workflow 的完整性优先于初始加载预算。
- 聚焦行为测试、宿主发现、manifest 一致性和 package 专属验证仍由对应项目检查证明，不能由结构门禁替代。
