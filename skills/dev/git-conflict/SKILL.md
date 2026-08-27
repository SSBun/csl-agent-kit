---
name: git-conflict
description: Resolve an in-progress Git merge or rebase conflict. Use when Git reports unmerged paths or cannot continue because of conflicts.
---

# Git Conflict

Resolve the active operation narrowly; do not turn conflict resolution into a refactor.

1. **Map the operation.**
   - Run `git status` and inspect relevant history to identify the active merge or rebase, its goal, the current commit, and every unmerged path.
   - Read each file's base and both conflict stages. During a rebase, do not infer branch intent from the `ours` and `theirs` labels alone.
   - Continue only when every conflict and both intended changes are understood.

2. **Resolve intent.**
   - Use repository code and commit messages first; consult linked PRs or issues when available.
   - Preserve both compatible intents. If they are incompatible, follow the operation's established goal; ask the user when the correct product choice remains unclear.
   - Do not invent behavior or refactor adjacent code.

3. **Verify the tree.**
   - Remove every conflict marker, then stage only the resolved paths. Leave unrelated working-tree changes untouched.
   - Confirm Git reports no unmerged paths and `git diff --cached --check` passes.
   - Run the repository's required checks in its prescribed order. Fix only regressions caused by the resolution.

4. **Continue Git.**
   - For a merge, run `git merge --continue`, or commit when Git instructs.
   - For a rebase, run `git rebase --continue` and repeat this workflow for each later conflict.
   - Finish only when Git reports no merge or rebase in progress and the final history and status match the intended result.

Never abort the operation, discard a side wholesale, or stage unrelated changes unless the user explicitly asks.
