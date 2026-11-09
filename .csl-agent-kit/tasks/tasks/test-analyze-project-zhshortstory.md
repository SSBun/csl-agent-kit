# 用干净子 Agent 验证 analyze-project

Status: Completed (2026-08-10 10:43)
Kind: Task

## Target
- [x] T1: 一个 fresh-context 子 Agent 使用当前 analyze-project 合同，在 ZHShortStory 唯一 Git 根生成一份 need-bounded、源码可证的 active report，且不修改项目源码。
- [x] T2: 父 Agent 核对报告路径、内容边界与工作树变更，并在本机打开该报告供用户检查。

## Scope

包含：以用户给定 symlink 的 canonical Git root 为 project scope，使用当前未提交的 analyze-project skill snapshot 生成并检查一份项目级报告。

不包含：不修改 ZHShortStory 源码、配置、Anvil stage artifact 或 knowledge；不运行 build/test、网络或外部 mutation。

## Plan

1. 启动一个 fresh-context、无 ambient skill 的单一 writer 子 Agent，显式读取当前 analyze-project skill 合同与目标项目规则。
2. 子 Agent按默认 need 分析唯一主要入口并仅发布 active report；无法确定唯一入口时零写入并返回聚焦问题。
3. 父 Agent 核对生成路径、报告边界、源码证据及 git diff，然后用本机 `open` 打开报告。

## Result

- T1: fresh-context delegate b012fde1 在仓库外 temp cwd、skill:false 条件下读取当前 SKILL/report-contract；目标基线 clean，仅生成 38 行/285 词的 docs/analysis/project-map.md，未修改源码。
- T2: 父 Agent 核对 4 个必需章节和 Material Uncertainty、禁止章节缺失、绝对 evidence anchor 为 0、13 个关键源码符号存在；目标 git status 仅含报告，并已通过 macOS open 打开。
- Review gate: Skipped — 用户要求输出检查而非独立 adversarial review；按规则跳过。

## Verification

- Passed: 最终报告 Working tree 为 clean，静态边界断言和源码锚点检查通过；open 返回成功，首轮宿主元数据与全部自有 temp 已清理。
