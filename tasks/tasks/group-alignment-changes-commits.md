# 分组提交当前本地改动

Status: In Progress (2026-08-29 09:21)
Kind: Task

## Scope

- Included: 当前 Task Target 对齐协议／规则／消费者／验证／Context 改动、routing 元数据改动，以及本轮新增 canonical task records。
- Excluded: 修改交付物内容、改写既有 Git 历史、推送远端或提交工作区外文件。

## Target

- [ ] T1: 检查当前工作区全部 tracked 与 untracked 改动，并按独立 feature／concern 建立互不混杂的提交分组。
- [ ] T2: 每个分组分别暂存并使用清晰的 conventional-style message 创建 Git commit，不改写既有历史且不推送远端。
- [ ] T3: 所有当前本地改动都被提交，最终工作区干净，并核对提交顺序、内容边界和消息。

## Plan

1. 提交可见 Task Target 对齐运行时、consumer ownership、稳定规则、Context 与集中行为断言。
2. 单独提交 routing fixtures／semantic config 与运行时语义解耦。
3. 单独提交已完成的 Task Target 工作记录及本任务激活记录。
4. 完成本任务并提交最终任务状态，然后核对提交序列和干净工作区。
