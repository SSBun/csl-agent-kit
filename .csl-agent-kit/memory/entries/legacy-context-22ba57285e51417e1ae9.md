---
schema: csl-memory/v2
id: legacy-context-22ba57285e51417e1ae9
revision: 6
type: fact
title: SOP 发现、存储与编写边界
summary: 项目优先于用户及内置，保留旧发现路径过渡；示例轻量化，语言按当前有效要求，不扩张局部字段约束。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-agent-sops — Project, user, and built-in SOP
    routing:1
  - session:01a1a060-6f89-71ed-b277-8eaa473ee5b6/task:null/event:30b2a0327edc8a03611b77417308da8508e1e46423c508bf3228cfd7f7cbf819
  - session:01a1a060-6f89-71ed-b277-8eaa473ee5b6/task:unify-kit-storage-specs/event:f78eaee845ab2c1c6cfc7c501b07e8332bd0212f51d70aec1a1dd0f85cffb7e3
  - skills/meta/agent-sops/SKILL.md#Storage and precedence
  - skills/meta/agent-migration/references/storage.md
  - skills/meta/agent-migration/SKILL.md
  - skills/meta/agent-sops/scripts/sop-summaries.sh
  - skills/meta/agent-sops/scripts/sop-candidates.js#loadSops
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-08 SOP Example Metadata Minimalism:1
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-06-28 SOP Create Language Scope:1
  - /Users/caishilin/AGENTS.md#Language Protocol
updated: 2026-11-05T11:35:19.297Z
deleted: false
retrieval:
  aliases:
    - SOP 发现与存储过渡边界
    - agent-sops
    - SOP覆盖顺序
    - .agents/sops
    - .csl-agent-kit/sops
    - CSL_AGENT_KIT_SOPS_DIR
    - SOP 示例避免无需求的治理字段
    - SOP 语言约束不扩大范围
  situations:
    - 诊断项目SOP未被发现或同名覆盖
    - 核对SOP统一存储规范与当前发现器差异
    - 迁移旧项目SOP前检查读写兼容性
  topics:
    - SOP/发现与覆盖
    - 存储迁移/SOP
  links:
    - kind: related
      scope: project
      id: agent-migration-directory-memory-routing
---

## SOP 发现与存储过渡边界

同一frontmatter name只暴露最高优先级SOP：项目 > 用户 > 内置。发布流程沿用同一发现边界，无独立发布注册表。

统一存储规范目标：项目 .csl-agent-kit/sops/；用户 $CSL_AGENT_KIT_HOME/sops/，默认 ~/.csl-agent-kit/sops/；内置 skills/meta/agent-sops/sops/ 随包分发。仅限Kit所属数据，源码、第三方内容和宿主发现入口不随之迁移。

过渡差异：sop-summaries.sh 与 sop-candidates.js 仍读取工作区 .agents/sops/；用户目录支持 CSL_AGENT_KIT_SOPS_DIR 覆盖。规范更新不证明发现器或安装版本已切换。读写方兼容后经 agent-migration 显式迁移；不双写、不凭目录存在猜权威源，不把本项目规范视为其他项目搬迁授权。

Native hooks用 sop-summaries.sh 生成会话摘要、sop-candidates.js 路由候选；Pi传入 ctx.cwd。代码风格入口 skills/meta/agent-sops/sops/code-style.md，语言细则在 references/code-style/，Swift为 swift-style.md。

SOP确认模式及实质检查以 agent-sops/SKILL.md#Priority boundary 为准；SOLO只跳过已授权范围的确认暂停，身份、防重复、平台限制和验证仍保留，不以修改用户SOP实现模式切换。

发现或注入变化时核对 scripts、pi/extensions/csl-context-hooks.ts、tests/cli-install-output.test.js 与 tests/pi-context-hooks.test.mjs；测试定义不代表当前宿主已加载。

## SOP 示例避免无需求的治理字段

## 2026-07-08 SOP Example Metadata Minimalism

- **Trigger:** 设计或修改 SOP 示例文件的 YAML frontmatter 时。
  - **Rule:** 不要默认加入 SOP id、owner、creator、reviewer、approver、effective_date 这类治理字段；示例 SOP 默认只保留 `version` 和 `update_date` 这类轻量元数据。
  - **Why:** 示例文件应展示轻量现代格式，过多治理元数据会让新 SOP 创建变重。

## SOP 语言约束不扩大范围

## 2026-06-28 SOP Create Language Scope

- **Trigger:** 用户要求调整 SOP create 的语言行为时。
  - **Rule:** 遵守当前有效语言指令；在没有全文语言要求时，主流程描述可使用任意语言，只有明确要求的字段或模板片段固定语言，不能由局部约束推出全文要求。
  - **Why:** 把语言约束扩大到整份 SOP 会错误限制用户的流程描述和团队文档习惯。
