# 要求所有会话标题使用中文

Status: Completed (2026-08-25 14:11)
Kind: Task

## Target
- [x] T1: 自动与手动标题刷新最终仅显示中文核心意图，不包含项目目录名前缀
- [x] T2: 标题刷新使用简洁中文字符串描述当前任务，不因其中包含数字、拉丁字母或技术术语而拒绝结果

## Plan

1. 让模型以简洁中文描述当前任务，同时移除字符集拒绝并继续去除目录前缀。
2. 同步受影响的回归断言与工作区 Context。
3. 运行允许的最小静态与行为验证并记录结果。

## Result

- T1: 共享 prompt-submit 标题脚本明确要求模型用简洁中文描述当前任务，buildTitle 只返回核心意图且旧‘项目 · 标题’格式被拒绝；自动刷新与 /title 手动刷新均复用该脚本。
- T2: 直接行为检查显示‘Session 标题设计’与‘GPT 5 接口超时’均可通过并持久化，字符集不再作为拒绝条件；目录前缀、纯操作输入和裸代码标识符仍被质量边界过滤。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: node --check（脚本与回归文件）、Hook rule validator、Pi show、Context validator 和 git diff --check 均通过；直接行为检查确认混合技术术语可保留、元标签被清理、长度上限为 24。Yao syntax、lint、governance 通过，仅有允许的既存初始加载预算 1463 > 1000；按当前用户规则未运行单元测试。
