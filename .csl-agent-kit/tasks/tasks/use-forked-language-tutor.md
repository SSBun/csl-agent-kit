# 将 Pi 语言插件切换到个人 fork

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-15 16:46) |
| Kind | Task |

## Task Summary

**Pi 包来源配置**：在 [用户配置](file:///Users/caishilin/.pi/agent/settings.json) 将 npm 原来源替换为本地 fork 目录，其他配置不变。

**本地插件依赖**：为 [开发副本](file:///Users/caishilin/Desktop/personal/pi-language-tutor) 安装锁定依赖，未修改跟踪文件。用户重新加载后发现 Glimpse 原生宿主缺失；已通过依赖自带 build:macos 构建，使用隐藏窗口验证 native host ready 与正常关闭，未改动源码或闪卡。完整闪卡界面仍需用户重试验证。

## Target
- [x] T1: Pi 的语言学习插件来源切换为 SSBun/pi-language-tutor，原来源不再重复加载。
- [x] T2: 保留现有语言设置与闪卡数据，不修改插件功能。

## Result

- T2: language-learn.json、flashcards.json、flashcards-settings.json 的 SHA256 前后完全一致；本地 fork git status --short 为空。
- T1: 用户已 reload 本地 fork；修复依赖缺失的 glimpse 原生程序，build:macos 成功；通过 open(hidden) 收到 native host ready，随后正常关闭。完整 flashcards UI 待用户重试。
- Review gate: Skipped — R1 原生依赖构建及启动已直接验证。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 补建缺失原生依赖，无源码修改。
- Snapshot: fork-aeaa9fa;glimpseui-0.8.1-local-swift-build
- Evidence: 缺失复现、构建成功、原生宿主 ready/closed 冒烟检查成功。
- Result clarity: 恢复已切换插件的原生依赖。
- Bounded impact: 仅 node_modules/glimpseui/src/glimpse。
- Low risk: 未修改源码和用户学习数据。
- Sufficient verification: 隐藏窗口启动与关闭成功，Git 干净；未运行测试套件，完整闪卡 UI 待用户验证。
- Task fingerprint: d37132da416cb9e327764e346c85ce84db11cb8790a846d30331171c0f8083c9

## Verification

- Passed: Glimpse native host ready 和 closed 均已观察；Git 工作树干净；未验证完整闪卡交互。
