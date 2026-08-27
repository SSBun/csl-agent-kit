# Global AGENTS Rule Optimization

## Plan

- [x] Preserve mandatory `tasks/todo.md` and `tasks/lessons.md` compliance.
- [x] Keep `### 8. Verification Before Done` unchanged.
- [x] Merge duplicate thinking, planning, task-management, and simplicity rules.
- [x] Record the correction about todo/lessons in `tasks/lessons.md`.
- [x] Audit the updated rules with `skill-quality` and verify the final diff.

## Review

- Updated `/Users/caishilin/.codex/AGENTS.md` in English.
- Merged `Think Before Coding` and `Engineering Mindset` into `Engineering Thinking`.
- Merged `Goal-Driven Execution` and `Task Management` into `Goal-Driven Task Management`.
- Removed duplicate `Core Principles` while preserving root-cause and minimum-code rules under `Simplicity First`.
- Kept `### 8. Verification Before Done` unchanged.
- Preserved strong `tasks/todo.md` and `tasks/lessons.md` compliance rules.
- Recorded the todo/lessons correction in `tasks/lessons.md`.

local quality gate audit:

- Scope is an AGENTS rule-file cleanup, not a skill package or release.
- No trigger boundary changed for a skill; no `trigger_eval.py` required.
- Lightest reliable process applies: inspect changed rules, remove duplication, verify with grep and diff check.

Verification performed:

- `rg -n "^## Engineering Mindset|^## Task Management|^## Core Principles|^### 8\\. Verification Before Done|tasks/todo\\.md|tasks/lessons\\.md" /Users/caishilin/.codex/AGENTS.md`
- `git diff --check -- tasks/todo.md tasks/lessons.md`
