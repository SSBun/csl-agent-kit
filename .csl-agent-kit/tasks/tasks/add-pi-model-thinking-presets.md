# 添加 Pi 模型与思考等级预设

Status: Completed (2026-08-20 14:31)
Kind: Task

## Scope

- 包含：全局 Pi 预设配置，以及一次命令同时切换模型与 thinking level。
- 不包含：工具集、system prompt、项目级覆盖、快捷键或预设编辑 UI。

## Target
- [x] T1: /preset flash-max 同时选择 deepseek/deepseek-v4-flash 与 max。
- [x] T2: /preset sol-xhigh 同时选择 openai-codex/gpt-5.6-sol 与 xhigh。
- [x] T3: /preset 无参数可交互选择，且用户修改预设配置后无需重启即可生效。
- [x] T4: 缺失、无效或不可用的预设不会被报告为成功，并有自动化测试覆盖。
- [x] T5: /preset list 显示每个预设的名称、provider/model 和 thinking level，且不切换当前状态。

## Plan

1. 定义可重新加载的全局预设配置与最小命令行为。
2. 实现命令并写入两个初始预设。
3. 添加自动化检查与简明使用说明，然后验证实际 Pi 加载。
4. 为 list 子命令添加回归测试、最小实现与使用说明。

## Result

- T1: Focused test selected flash-max and observed deepseek/deepseek-v4-flash with thinking max; Pi print-mode smoke exited 0.
- T2: Focused test selected sol-xhigh and observed openai-codex/gpt-5.6-sol with thinking xhigh; Pi print-mode smoke exited 0.
- T3: Interactive selector test passed, then rewrote presets.json and observed the next command use the new value without reload.
- T4: Automated tests reject invalid config, unknown preset, missing model, unsupported thinking level, and unavailable credentials with error notifications.
- T5: The original reproduction returned Unknown preset list; after the fix the same command printed both preset rows and setter guards confirmed no model or thinking change.
- Review gate: Skipped — User did not request independent or adversarial review.

## Verification

- Passed: Original non-test reproduction now lists both presets; Pi print smoke exited 0; production and regression-test syntax checks, package dry-run, and git diff --check passed. Unit tests were not run because the user did not request tests.
