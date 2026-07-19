---
name: analyze-project
description: 分析一个软件项目或组件，并在 docs/analysis/ 下生成一份有源码证据的高密度报告。用于 /analyze-project、为继续开发建立项目/组件的职责—功能模块—核心工作流地图（develop），或用概念顺序、源码走读及 recall/prediction/transfer 检验生成源码驱动的掌握指南（learn）。也适用于 project map、component map、working flow、项目学习指南等请求；不用于快速定位（repo-map）、代码/架构/安全审计、单次改动计划或通用语言/框架教学。
---

# Analyze Project

一次分析一个 Git project、目录组件或文件组件；只写一份报告，不修改源码。

## 调用与路由

```text
/analyze-project [target_path] [develop|learn]
```

- `target_path` 默认当前目录。
- `develop`：回答 scope 做什么、功能模块如何分工、核心工作流如何运行，供继续开发复用。
- `learn`：安排理解顺序、代表行为走读和检验，供人类学习或 Agent 后续推理。
- 用户未写 mode 时，只在意图明确时推断；“当前状态地图/继续开发”选 `develop`，“学会/理解并检验”选 `learn`。两者都合理时只问一次，不同时运行。
- 快速找入口用 `repo-map`；审计、review、change plan 或通用课程转交对应能力。

选定 mode 后，执行任何分析或写入前完整读取相应 reference：

- `develop` → `references/develop-mode.md`
- `learn` → `references/learn-mode.md`

## 共用执行协议

### 1. 固定唯一 scope

1. 用只读方式解析 canonical target、唯一 Git 根和仓库相对路径；target 必须等于 Git 根或位于其内。
2. 自然语言组件名有多个候选，或 target 包含多个独立 Git 根时，列出候选并询问；选择前零写入。
3. 拒绝仓库外 symlink、路径逃逸及当前文件系统无法安全表示的派生路径；不使用 hash fallback。
4. 组件只覆盖其内部、直接上下游和参与的核心行为，不重新分析整个项目。

### 2. 派生唯一输出

输出均相对 Git 根：

| Scope | Develop | Learn |
| --- | --- | --- |
| project | `docs/analysis/project-map.md` | `docs/analysis/learning/project-guide.md` |
| directory | `docs/analysis/components/dir/<repo-relative-dir>/map.md` | `docs/analysis/learning/dir/<repo-relative-dir>/guide.md` |
| file | `docs/analysis/components/file/<repo-relative-file>.md` | `docs/analysis/learning/file/<repo-relative-file>.md` |

写入前：

1. 规范化输出并确认仍在对应 canonical 输出根内；逐级检查已有父目录 symlink 不会逃逸。
2. 对目标执行 `lstat`。symlink、目录、设备或其他非普通文件直接拒绝。
3. 目标普通文件已存在时零写入并询问：Develop 可选择“基于现有报告完整更新”或“完整替换”；Learn 只允许“完整重分析并替换”。两者都不得局部补丁式更新。

### 3. 从证据建立报告

1. 在任何输出写入前采样 `HEAD`（无首次提交则 `HEAD: unborn`）、工作树 clean/包含未提交改动状态及带时区时间。
2. 读取适用的 agent 规则、README、manifest、真实入口、直接上下游和测试配置；从可观察行为反向追踪调用、数据、事件、状态与失败边界。
3. README/设计文档只能补充意图，不能单独证明运行行为；CodeGraph 只作导航。
4. 项目事实必须有仓库相对锚点：优先 `path#symbol`，配置用 `path#key`，都不可用时才用行号。无证据内容不得写成事实。
5. 一个事实只定义一次；其他位置引用模块、target、概念或 checkpoint。省略空章节、占位符、固定数量条目和非核心 inventory。
6. 默认使用用户语言；代码、命令、符号与既有领域词保留原文。

默认只运行读操作。不得安装依赖、执行构建/测试/项目进程或改变外部状态；确需运行才能证明核心行为时，先取得授权，否则零写入。不得修改、格式化或重构源码。

### 4. 验证后安全写入

先在内存中完成报告与全部 mode-specific 检查，再写唯一目标。新建或替换时只允许目标报告、必要父目录和同目录临时文件；替换必须重新分析完整 scope，并用不跟随链接的同目录原子替换。无法保证时零写入。

报告不得包含疑似 secret 的值、片段、hash、位置或安全章节。只在最终回复使用例外格式：`疑似 <类别>：<仓库相对路径>；未记录秘密值`。

## 最终回复

只返回：

- 报告路径；或导致零写入的阻塞条件/待选择项。
- 阻止正确理解或学习、且无法由仓库证据确认的问题。
- 允许格式的脱敏 secret 警告。

不复述报告摘要、模块、流程、概念或答案。

## 维护验证

路由变化后运行 `evals/trigger_cases.json`；输出或失败协议变化后核对 `evals/contract_cases.json`。完整质量门以两份已批准 PRD 为准。
