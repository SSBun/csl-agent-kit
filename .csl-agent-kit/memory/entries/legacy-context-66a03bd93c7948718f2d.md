---
schema: csl-memory/v2
id: legacy-context-66a03bd93c7948718f2d
revision: 4
type: fact
title: Pi 设置、审查模型与状态显示
summary: Task模式层级和审查模型解析，配置错误显式显示；Git只显示干净与否，重载和实际生效须分别验证。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-pi-settings — Pi 通用设置与审查配置:1
  - pi/extensions/csl-settings.ts:29-68
  - session:01a1aa58-9de8-71d2-8315-2cedf5cf3d26/task:compact-task-mode-footer/event:2a6b29f1319182ffd870fee569ad4576aa749b5c3cfca2bf2feff5f25dcadcc0
  - session:01a1aa58-9de8-71d2-8315-2cedf5cf3d26/task:compact-git-clean-status/event:91f64d78e4f04ef3f5e674d2ef4348a5c20188b92f3dddf48d7a959288bb29ce#user
updated: 2026-11-05T11:35:20.962Z
deleted: false
retrieval:
  aliases:
    - Pi 通用设置与审查模型配置
    - Task模式底栏
    - ✋ CONFIRM
    - ⚡ SOLO
    - csl-settings
    - csl_review_config
    - Pi Git 状态显示偏好
    - Git状态图标
    - git status
    - 工作区是否干净
  situations:
    - 调整Task模式紧凑显示、颜色或查询配置来源
    - 核对Task模式层级与实际生效边界
    - 排查Pi同进程重载后Task枚举未更新
    - 配置Reviewer模型继承
    - 调整Pi底栏Git状态展示
  topics:
    - Pi/状态栏
    - Pi/设置与审查配置
  links: []
---

## Pi 通用设置与审查模型配置

Pi 通用设置与审查配置；权威入口 `pi/extensions/csl-settings.ts`、`pi/lib/csl-settings.ts`、`README.md`，验证入口 `tests/pi-settings.test.mjs`。设置字段、数据目录、工具指引或 subagent 模型后缀语义变化时复核。

- `/csl-settings`：`review.model`、`review.thinking` 保存到 CSL 用户数据目录（支持 `CSL_AGENT_KIT_HOME`）的 `settings.json`，不修改 Pi 或 pi-subagents 配置。Task 模式也可通过 `/task-mode` 操作；共享解析器 `skills/meta/csl-tasks/shared/lib/task-mode.js`，跨宿主 CLI 为同组件 `scripts/task-mode.js`。
- Task 模式：session > project > global > 默认 confirm；新值 solo／confirm／inherit，solo 对外名 SOLO。旧 autonomous 只读归一为 solo，不自动改文件。配置均在用户数据目录；项目按 realpath 摘要隔离，会话按宿主、工作区、真实会话 ID 摘要隔离。项目配置不构成仓库内授权。Pi 每轮经 Contract Hook 重读，原生 Codex／Claude 在 SessionStart 读取；无效配置降回确认并报错，保存成功不证明 Hook 已启用。
- `skills/meta/task-mode/` 复用共享配置 CLI；Codex 递归发现 skills，Claude manifest 显式登记。查询区分保存值与当前会话实际生效；缺真实会话身份时仅解析项目／全局。Pi 自动别名跳过 task-mode，设置扩展独占 `/task-mode`，`/skill:task-mode` 仍可调用 Skill。
- Pi jiti 的 moduleCache=false 不清除原生 createRequire 的 CommonJS 缓存。`pi/lib/csl-settings.ts` 重载时仅清除无状态 task-mode 直接依赖缓存，使 `/reload` 读取当前枚举；不清理无关模块或改配置。验证须覆盖同进程升级后重载，不能仅测新进程 import。
- Task 底栏：`✋ CONFIRM` 用 `accent`，`⚡ SOLO` 用 `success`；省去 `Task:`、方括号和配置来源，来源仍可经 `/task-mode` 查询。配置错误显示 `✋ CONFIRM · config error`，错误后缀用 `error`。纯展示修改可 `/reload` 加载。
- 状态使用独立 `csl-task-mode` setStatus 键；启动／恢复／重载、树导航、每轮开始／结束和设置修改后重读，shutdown 只清自身键。无定时器，非 TUI 不显示。显示解析结果不证明进行中请求已应用新规则；自定义 footer 是否展示 extension statuses 由该 footer 决定。
- `csl_review_config` 是只读解析器，不是启动器。CSL 审查主 Agent 须将返回的 `launch.model` 传入实际 Reviewer 子调用；未设置项继承调用时父会话实际值。不拦截所有 subagent，不覆盖 Editor，不改变已有子 Agent 的恢复契约。

## Pi Git 状态显示偏好

Pi Git 状态图标：仅区分工作区干净／有改动；不显示改动数量。
