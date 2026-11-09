---
schema: csl-memory/v1
id: legacy-context-22ba57285e51417e1ae9
revision: 3
type: fact
title: SOP 发现与覆盖顺序
summary: 既有 SOP 发现边界；用户要求统一 .csl-agent-kit 存储，先更新相关 Task、Skill 和规格，再以
  agent-migration Skill 支持旧项目迁移；不代表已实施。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-agent-sops — Project, user, and built-in SOP
    routing:1
  - session:01a1a060-6f89-71ed-b277-8eaa473ee5b6/task:null/event:30b2a0327edc8a03611b77417308da8508e1e46423c508bf3228cfd7f7cbf819
  - session:01a1a060-6f89-71ed-b277-8eaa473ee5b6/task:unify-kit-storage-specs/event:f78eaee845ab2c1c6cfc7c501b07e8332bd0212f51d70aec1a1dd0f85cffb7e3
updated: 2026-11-03T07:57:11.587Z
deleted: false
---

## CTX-agent-sops — Project, user, and built-in SOP routing
- Scope: SOP discovery, writable ownership, same-name precedence, session summaries, prompt candidates, and Pi workspace loading.
- Paths: `skills/meta/agent-sops/`, `pi/extensions/csl-context-hooks.ts`, `tests/cli-install-output.test.js`, `tests/pi-context-hooks.test.mjs`
- Keywords: agent sops, project SOP, user SOP, built-in SOP, .agents/sops, .csl-agent-kit, agent-migration, precedence, candidates
- Authority: `skills/meta/agent-sops/SKILL.md`, `skills/meta/agent-sops/scripts/sop-summaries.sh`, `skills/meta/agent-sops/scripts/sop-candidates.js`
- Recheck: 当 SOP 存储层级、workspace 根边界、同名覆盖顺序或宿主 context 注入方式变化时复核。

### 用户提出的统一存储方向
用户明确建议 CSL Agent Kit 保存的所有内容统一归入 `.csl-agent-kit`，称其为指定保存位置；适用于本工具的存储设计，不推广为其他工具的通用偏好。来源：session:01a1a060-6f89-71ed-b277-8eaa473ee5b6，event:30b2a0327edc8a03611b77417308da8508e1e46423c508bf3228cfd7f7cbf819。
后续用户明确要求先更新所有相关 Task、Skill 和规格文件，并创建名为 `agent-migration` 的 Skill，供旧项目把相关内容迁移到新目录。来源：同一 session，task:unify-kit-storage-specs，event:f78eaee845ab2c1c6cfc7c501b07e8332bd0212f51d70aec1a1dd0f85cffb7e3；任务载体为 `tasks/tasks/unify-kit-storage-specs.md`。这补充了此前未明确的迁移方式，不等于 Skill 已创建或任何旧项目已迁移，也不能推定已授权立即迁移 MyTwitter。
这是对下述既有项目 SOP 目录约定的新变更方向。助手提出的项目根/用户主目录分层、源码与随包资源例外，尚未得到用户进一步确认。实际读写和迁移须核对正式规范与实现，不能仅凭此记忆认定新目录已生效。

### Purpose and Boundaries
- Agent SOPs 统一发现项目、用户和内置 SOP；同一 frontmatter `name` 只暴露最高优先级版本，顺序固定为项目级、用户级、内置级。

### Structure
- 既有规范中，项目级 SOP 位于当前 workspace 的 `.agents/sops/` 并可随仓库版本控制；用户级 SOP 位于 `~/.csl-agent-kit/sops/` 并跨项目生效；内置 SOP 位于 `skills/meta/agent-sops/sops/` 并随包分发。新存储方向见上节，使用前复核当前权威载体。
- `skills/meta/agent-sops/sops/code-style.md` 是跨语言内置代码风格 SOP；它按语言读取 `skills/meta/agent-sops/references/code-style/`，Swift 参考为 `swift-style.md`。

### Relationships
- Native hooks 通过 `sop-summaries.sh` 从当前工作目录生成 session summary，并通过 `sop-candidates.js` 做 prompt-time 路由；Pi adapter 必须把 `ctx.cwd` 显式传给同一候选模块。
- 发布工作直接按同一三级发现边界匹配具体 SOP，不另建发布 SOP 注册表。`agent-sops` 的 Priority boundary 将 Task 确认模式应用到 SOP 的确认步骤：SOLO 跳过授权范围内的 confirmation-only 暂停，保留 SOP 的身份、防重复、平台限制、验证等实质要求；不修改用户级 SOP 来实现该模式。

### Decision and Verification Boundaries
- `tests/cli-install-output.test.js` 同时验证摘要与候选路由的项目 > 用户 > 内置覆盖；`tests/pi-context-hooks.test.mjs` 验证 Pi 从活跃 workspace 注入项目 SOP。
