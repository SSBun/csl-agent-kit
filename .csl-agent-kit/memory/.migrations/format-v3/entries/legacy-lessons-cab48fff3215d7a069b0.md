---
schema: csl-memory/v1
id: legacy-lessons-cab48fff3215d7a069b0
revision: 1
type: experience
title: 发布后核对最终远端 CI
summary: push、打 tag 或发布后核对远端 headSha 和最终 CI 结论，不复用旧证据。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-31 发布完成前必须验证最终远端 CI:1
updated: 2026-11-02T03:43:09.423Z
deleted: false
---

## 2026-07-31 发布完成前必须验证最终远端 CI

- **Trigger:**
  - 任务包含向受 CI 保护的分支 push、打 tag 或发布包。
- **Rule:**
  - 最终 push 后必须定位与远端目标 branch HEAD 完全一致的 CI run，并等待其成功；本地测试、dry-run、registry 发布成功或旧 commit 的 CI 结果都不能替代该检查。
  - CI 失败时立即重新打开所属任务，修复并验证新的最终 run 后才能报告发布完成。
- **Check:**
  - CI run 的 `headSha` 与远端 branch HEAD 一致，且结论为 `success`。
  - 任务 Result 记录最终 run 的 ID 或 URL 与成功结论。
