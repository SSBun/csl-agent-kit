---
schema: csl-memory/v1
id: legacy-lessons-f70055900a7ae1733947
revision: 1
type: experience
title: 共享 UI 状态的保持与恢复
summary: Hook 与宿主都写 UI 状态时，保持决定可能需要重应用旧值，不能等同于不操作。
sources:
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-28 共享 UI 状态的“保持”不能等同于无操作:1
updated: 2026-11-02T03:43:09.641Z
deleted: false
---

## 2026-07-28 共享 UI 状态的“保持”不能等同于无操作

- **Trigger:**
  - Hook 或后台任务要求保持标题、状态栏或其他 UI 值，而宿主生命周期也可能改写同一状态。
- **Rule:**
  - 保存最后一次成功写入的所属值；明确的保持决定应重新应用该值，不能假设当前外部状态未被覆盖。
  - 将保持决定与生成失败分开处理；失败路径继续遵守其独立的不写入约束。
- **Check:**
  - 测试模拟外部覆盖后，保持路径恢复最后一次成功值。
  - 测试确认无历史值的初始化行为和生成失败行为分别符合产品约束。
