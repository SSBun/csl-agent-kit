---
schema: csl-memory/v2
id: legacy-context-c1c22f866bd05d47dfff
revision: 4
type: reference
title: Skill 整合、分发与集成参考
summary: 来源元数据、自包含和项目专用发现边界；移动检查所有消费者，清空不授权重装，含本机参考仓及Hook接入线索。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    units:CTX-third-party-skills,Components
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    sections:2026-07-10 Avoid One-Off Skill Interface Folders;2026-07-08 AGENTS
    Template No Local Include;2026-07-22 Keep Distributed Skills
    Self-Contained;2026-07-16 将项目专用流程与全局可分发技能分开;2026-07-16
    将清空和选择整合视为两个独立阶段;2026-07-10 Keep Caveman And Ponytail Responsibilities
    Distinct;L-20260821-skill-rename-consumers
  - .agents/skills/integrate-third-skills/SKILL.md
  - bin/csl-agent-kit.js
  - pi/extensions/csl-skill-commands.ts
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#Components:1
  - /Users/caishilin/AGENTS.md#Language Protocol
updated: 2026-11-05T11:35:21.236Z
deleted: false
retrieval:
  aliases:
    - Skill 整合、发现与可分发边界
    - integrate-third-skills
    - .repository.json
    - Caveman
    - Ponytail
    - mattpocock/skills
    - Skill重命名
    - 自包含分发
    - 补充组件边界与本机参考仓
  situations:
    - 导入更新第三方Skill
    - 移动Skill并核对消费者
    - 区分项目专用与共享发现
    - 清空后选择整合候选
  topics:
    - Skill/整合与发现
    - Skill/分发边界
  links: []
---

## Skill 整合、发现与可分发边界

整合入口 .agents/skills/integrate-third-skills/ 仅本仓库使用；第三方源码放 skills/<source-group>/<skill>/。每个vendored叶子的 .repository.json 记录 repository、sourcePath、ref、commit、license、upstreamStatus；许可证放来源分组根。当前数量现场查询，不缓存。status按来源/ref复用临时检出并比较导入commit；diff区分导入后上游变化与上游相对本地差异，--patch才输出逐行补丁。

共享CLI及Pi递归枚举 skills/ 叶子，以frontmatter名称公开；项目专用流程放受版本控制的 .agents/skills/，排除共享发布、全局安装与共享命令发现，同时核对链接不会重新暴露。仅用于生成这类共享链接的安装选项应移除。Pi slash alias默认转Skill请求；必要时附宿主事实边界，archive使用调用前session file、workspace、active leaf，不把归档命令或压缩摘要当原始对话。

移动、删除、重命名Skill或alias：核对README、manifest、安装枚举、规则、Authority、测试与路径构造器；解析根变量、相对路径及生成消费者，不能只搜完整旧字符串。替代存在时只暴露canonical名称；当前路径须实际存在，旧路径不残留，历史任务不批量重写。导入/更新还核对元数据和发布包内容。

可分发Skill运行指导须随包自包含；项目RFC仅作背景，除非明确纳入运行契约。Agent模板/example不含作者机器 @/Users/... include；用户私有配置可含本机工具include。孤立agents/接口目录先核对运行与打包依赖，仅无用途且授权覆盖时删除。

要求清空目标再列候选时，清理结果保持为空；推荐不授权重装。比较Caveman/Ponytail时：前者压缩自然语言冗词，后者约束代码清晰简洁与实现规模，可互补，不能因都强调简洁就视为重复。

本机参考仓 ~/Desktop/test/skills 对应 mattpocock/skills，分 engineering、productivity、misc、personal、in-progress、deprecated；使用前复核路径。

## 补充组件边界与本机参考仓

## Components

- Agent Hooks 的分发 `SKILL.md` 语言服从当前有效指令，以 bundled CLI 作为 accepted-behavior authority，不把项目 RFC 当作 runtime guidance。
- `pi/extensions/csl-context-hooks.ts` 是 Agent Hooks 的 Pi adapter：通过 facade 的 `createEvent()` / `runEvent()` 生成以 `ctx.cwd` 为工作区的标准事件；它按 `toolCallId` 记录 `write` / `edit` 调用前状态，成功结果提供工作区相对的 `changed_files`（`created` / `modified`），失败或工作区外文件提供空数组，其他工具保持 unknown。权威实现与回归测试为该 extension 和 `tests/pi-context-hooks.test.mjs`。
- `skills/meta/agent-hooks/scripts/validate-rules.js` 复用 V1 `parseMarkdown()` 校验一个或多个候选 Hook Markdown 的 frontmatter 与规则语义；已存储脚本的可执行性和宿主 effective 状态仍以 `agent-hooks show` 为准。权威入口是该脚本与 `skills/meta/agent-hooks/SKILL.md`。

- `~/Desktop/test/skills` 是 `mattpocock/skills` 的本地参考仓库；技能按 `engineering`、`productivity`、`misc`、`personal`、`in-progress`、`deprecated` 分桶。
