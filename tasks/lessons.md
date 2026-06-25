# Lessons

## 2026-06-18 SOP Lessons Scope

- **Trigger:** 用户说 SOP 用来记录标准操作和容易犯错行为，不是在问当前仓库 `tasks/lessons.md`。
  - **Rule:** 把可跨项目复用的错误模式设计为 `sop-manager learn`，写入相关 `~/.sops/*.md` 或内置 SOP 的 companion lesson SOP。
  - **Why:** 只回答当前项目 lesson 文件会错过用户要的跨项目、跨 agent 复用目标。

## 2026-06-25 User-Defined SOP Ownership

- **Trigger:** 用户要求扩展动态用户 SOP，或已有 `~/.sops/{name}.md` 且没有明确要求发布为插件内置 SOP。
  - **Rule:** 不要把用户 SOP 复制到 `skills/sop-manager/sops/`；内置目录只放通用路由或确认为插件自带的 SOP，具体可变流程留在 `~/.sops/`。
  - **Why:** 内置副本会让用户看不清 SOP 的真实来源，也会让动态用户 SOP 的更新和分发边界变复杂。
