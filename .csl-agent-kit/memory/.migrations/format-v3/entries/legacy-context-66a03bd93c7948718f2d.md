---
schema: csl-memory/v1
id: legacy-context-66a03bd93c7948718f2d
revision: 1
type: fact
title: Pi 通用设置与审查模型配置
summary: 处理 Task 模式、审查配置、设置面板或同进程重载时读取；不要与 Memory 模型配置混淆。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-pi-settings — Pi 通用设置与审查配置:1
updated: 2026-11-02T03:43:08.358Z
deleted: false
---

## CTX-pi-settings — Pi 通用设置与审查配置
- Scope: CSL Agent Kit 的 Pi 通用设置面板、审查配置存储与启动参数解析边界。
- Paths: `pi/extensions/csl-settings.ts`, `pi/lib/csl-settings.ts`, `tests/pi-settings.test.mjs`
- Keywords: Pi, csl-settings, review model, thinking, parent inheritance, csl_review_config
- Authority: `pi/extensions/csl-settings.ts`, `pi/lib/csl-settings.ts`, `README.md`
- Recheck: 当设置字段、数据目录、Pi 工具指引或 subagent 的模型后缀覆盖语义变化时复核。

### Purpose and Boundaries
- `/csl-settings` 是通用配置入口；`review.model` 与 `review.thinking` 保存到 `CSL_AGENT_KIT_HOME` 或默认 CSL 用户数据目录的 `settings.json`，不修改 Pi 或 pi-subagents 的配置。Task 确认模式也在该面板及 `/task-mode` 提供操作；共享解析器位于 `skills/meta/csl-tasks/shared/lib/task-mode.js`，跨宿主 CLI 位于同组件 `scripts/task-mode.js`。
- Task 模式采用 session > project > global > 默认 confirm，各层新值为 solo／confirm／inherit，solo 对外名称 SOLO；已有 autonomous 存储只读归一为 solo，不自动改写用户文件。全部位于用户数据目录，项目按 realpath 摘要隔离，会话按宿主、工作区和真实会话 ID 摘要隔离。项目配置不是仓库内授权；Pi 每轮通过 Contract Hook 重读，原生 Codex／Claude 在 SessionStart 读取。无效配置降回确认并报告错误，保存成功不证明 Hook 已启用。
- `skills/meta/task-mode/` 提供跨宿主共享 Skill，复用共享配置 CLI；Codex 通过递归 skills 根发现，Claude manifest 显式登记。Skill 查询须区分已保存设置与当前会话实际生效；真实会话身份不可用时仅解析项目／全局，不宣称覆盖会话层。Pi 自动别名跳过 task-mode，由设置扩展独占 `/task-mode`，原生 `/skill:task-mode` 仍可调用 Skill。
- Pi 的 jiti 以 moduleCache=false 重载 TypeScript，但原生 createRequire 的 CommonJS 缓存不会随之失效。`pi/lib/csl-settings.ts` 每次重新加载时只清除无状态 task-mode 直接依赖的缓存，确保 /reload 读到当前枚举；不清理无关模块，不改用户配置。检查边界是同进程升级模块后重载，而非仅验证新进程 import。
- `csl-settings` 使用原生 setStatus 的独立 csl-task-mode 键在 TUI 底栏显示解析模式与来源；启动／恢复／重载、树导航、每轮开始／结束及设置修改后重读，shutdown 只清理自己的键。无定时器，非 TUI 不显示，配置错误显示 CONFIRM · config error；显示配置解析结果，不证明进行中的模型请求已应用新规则。自定义 footer 是否展示 extension statuses 仍由该 footer 决定。
- `csl_review_config` 是只读解析工具，不是启动器。其工具指引要求 CSL 审查的主 Agent 将返回的 `launch.model` 放到实际 Reviewer 子调用中；未设置的项读取调用时父会话实际值。该接入不拦截所有 subagent，不覆盖 Editor，也不会改变已有子 Agent 的恢复契约。
