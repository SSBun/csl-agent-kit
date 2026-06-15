# Current Skills Optimization Plan

**Date:** 2026-06-15
**Source audit:** `docs/analysis/current-skills-audit.md`
**Goal:** Resolve all audited skill, installer, CI, and documentation issues with the smallest safe set of changes.

## Assumptions

- This plan optimizes the current CSL skills repository; it does not add new skills.
- Existing skill names, public command names, and platform manifest shape should remain stable.
- Safety and instruction correctness take priority over wording polish.
- Changes should be staged in small batches so each batch can be reviewed and tested independently.

## Success Criteria

- All 18 audit findings have an explicit fix, deferral, or documented no-change decision.
- No skill instructs global installation, repository writes, commits, tags, or generated-code commands without an explicit approval gate.
- `scripts/install.sh` refuses to overwrite unrelated existing targets.
- CI validates manifests, skill frontmatter, prompt output paths, and script syntax reproducibly.
- `code-reviewer` references contain real guidance or are removed from the skill.
- Platform docs and commands agree on Claude/Cursor/Codex behavior.
- `git status --short --untracked-files=all` shows only intentional untracked files after local-only artifacts are handled.

## Phase 1: Safety and Workflow Correctness

### 1. Fix `handoff-restore` branch logic

Files:

- `skills/handoff-restore/SKILL.md`

Change:

- Rewrite steps 2-4 so existing files route directly to reading the handoff.
- Keep the missing-file branch separate and terminal when no handoffs exist.

Acceptance:

- The restore flow has no step that routes an existing file into a missing-file branch.
- Manual read-through produces exactly one path for "exists" and one path for "missing".

### 2. Reclassify `venom-cli gen-asset-code` as write-capable

Files:

- `skills/venom-cli/SKILL.md`

Change:

- Move `gen-asset-code` out of the safe read-operation list.
- Add it to "confirm before write operation".
- Note that it may generate Swift/ObjC resource access files.

Acceptance:

- No wording says `gen-asset-code` can run without confirmation.
- Safety rules match the command description.

### 3. Add explicit approval gates for global installs

Files:

- `skills/beautiful-mermaid/SKILL.md`
- `skills/venom-cli/SKILL.md`

Change:

- Replace "install globally and retry" with "ask user before installing".
- Document what to do if approval is denied.
- Prefer local/temp execution where practical, but do not invent a dependency manager flow unless verified.

Acceptance:

- Every `npm install -g` or `npm install --global` instruction is preceded by explicit user approval.
- Failed preflight stops cleanly when install is not approved.

### 4. Add release confirmation gates

Files:

- `skills/release/SKILL.md`

Change:

- Add explicit confirmation before committing.
- Add explicit confirmation before creating an annotated tag.
- Keep push and publish confirmations as already required.

Acceptance:

- The flow clearly confirms docs update, version changes, commit, tag, push, and publish as separate gates where applicable.
- The description promise "confirming each destructive step" is true in the detailed flow.

### 5. Fix release staging instructions

Files:

- `skills/release/SKILL.md`

Change:

- Replace fixed `git add package.json Cargo.toml pyproject.toml VERSION` with `git add <detected-version-files>`.
- Require listing detected version files before staging.
- Mention ecosystem-specific files from the detection table.

Acceptance:

- The staging example cannot accidentally omit Xcode/gemspec/podspec files due to hardcoded examples.
- The flow still forbids `git add -A`.

### 6. Add overwrite guard for `handoff-save`

Files:

- `skills/handoff-save/SKILL.md`

Change:

- If target handoff exists, inspect timestamp and ask before overwrite, or write a backup first.
- Keep the storage path stable.

Acceptance:

- Existing handoff state cannot be silently overwritten.
- The user-facing completion message still reports the final handoff path.

### 7. Bound SOP authority

Files:

- `skills/sop-creator/SKILL.md`

Change:

- Add precedence rule: SOPs never override system, developer, explicit user, platform safety, repository, or tool permission constraints.
- Clarify "authoritative" means within the SOP's applicable scope only.

Acceptance:

- SOP lookup remains useful, but cannot be read as permission to bypass higher-priority instructions.

## Phase 2: Installer and CI Hardening

### 8. Add safe symlink installation helper

Files:

- `scripts/install.sh`

Change:

- Add a helper such as `ensure_symlink <target> <source>`.
- If target is missing, create symlink.
- If target is a symlink to the intended source, leave it.
- If target is a symlink elsewhere or a real directory/file, stop with a clear message.
- Apply to Cursor plugin link, Codex skill links, and repo-local `.agents/skills`.

Acceptance:

- Installer does not silently mutate unrelated user-managed paths.
- `bash -n scripts/install.sh` passes.
- Re-running installer is idempotent when links already point to this repo.

### 9. Decide `.agents/skills` policy

Files:

- `.gitignore`
- optionally `README.md`

Change:

- Prefer adding `.agents/skills` to `.gitignore`, because the script creates it as local install state.
- Document that `.agents/plugins/marketplace.json` is tracked but `.agents/skills` is generated.

Acceptance:

- `git status --short --untracked-files=all` no longer reports `.agents/skills`.
- Tracked `.agents/plugins/marketplace.json` remains unaffected.

### 10. Pin and verify `yq` in CI

Files:

- `.github/workflows/validate.yml`

Change:

- Replace `latest` URL with a fixed `yq` version.
- Add SHA256 verification before installing, or use a pinned trusted setup action.

Acceptance:

- CI no longer downloads `latest`.
- The workflow remains readable and does not require network sources beyond the pinned artifact/action.

### 11. Strengthen prompt output path validation

Files:

- `.github/workflows/validate.yml`

Change:

- Replace `{{PROJECT_PATH}}/docs/[^a]` regex with extraction of all `{{PROJECT_PATH}}/docs/...` references.
- Fail unless each extracted output path starts with `{{PROJECT_PATH}}/docs/analysis/`.
- Keep the check focused on `skills/analyze-project/prompts/`.

Acceptance:

- `docs/api`, `docs/foo`, and similar paths fail validation.
- Current valid `docs/analysis` paths pass.

## Phase 3: Skill Content Quality

### 12. Replace `code-reviewer` placeholder references

Files:

- `skills/code-reviewer/references/code_review_checklist.md`
- `skills/code-reviewer/references/coding_standards.md`
- `skills/code-reviewer/references/common_antipatterns.md`
- optionally `skills/code-reviewer/SKILL.md`

Change:

- Replace placeholder sections with concise, real guidance.
- Keep the references small enough that agents can selectively read them.
- If useful content is not ready, remove or downgrade the reference pointers from `SKILL.md`.

Acceptance:

- No `Pattern 1`, `Scenario 1`, `Benefit 1`, `Tool 1`, or similar placeholder text remains.
- The review skill can cite references without degrading output quality.

### 13. Make `same-page` language-relative

Files:

- `skills/same-page/SKILL.md`

Change:

- Replace hardcoded English opener with an instruction to announce in the user's required response language.

Acceptance:

- The skill no longer conflicts with Chinese-only projects.

### 14. Reduce `same-page` burden for trivial clarifications

Files:

- `skills/same-page/SKILL.md`

Change:

- Keep evidence and confidence for substantive claims.
- Allow skipping ASCII diagrams for trivial clarification where a diagram adds no value.
- Define "trivial" narrowly to avoid weakening the skill.

Acceptance:

- High-stakes explanations still require evidence and confidence.
- Simple clarifications can stay concise.

### 15. Add write confirmation to `brainstorming`

Files:

- `skills/brainstorming/SKILL.md`

Change:

- Add confirmation before writing to `docs/plans/...`, unless the user explicitly requested a document artifact.

Acceptance:

- Brainstorming does not create docs silently.
- The implementation handoff behavior remains unchanged.

### 16. Add Figma tool-introspection fallback

Files:

- `skills/figma-describe/SKILL.md`

Change:

- If runtime MCP schema introspection is unavailable, use statically exposed Figma tools from the current session.
- Keep official Figma MCP preference.

Acceptance:

- The skill can proceed in Codex-style environments where tool schemas are already visible but not dynamically inspectable.

## Phase 4: Documentation and Platform Alignment

### 17. Resolve `sop-activate` platform semantics

Files:

- `commands/sop-activate.md`
- optionally `README.md`

Change:

- Choose one of two options:
  - Claude-only command: update frontmatter/description to Claude-only and point Cursor users to `sop-creator`.
  - Cross-platform command: keep Cursor paths and add explicit platform branching.
- Recommended: Claude-only, because README already says slash commands are Claude-only.

Acceptance:

- Frontmatter, body, and README no longer contradict each other.

### 18. Update or archive old Figma spec

Files:

- `docs/superpowers/specs/2026-06-04-figma-describe-design.md`

Change:

- Mark the spec as historical, or update the skill location to `skills/figma-describe/SKILL.md`.
- Prefer marking historical if the file is an old design artifact.

Acceptance:

- The document no longer presents `~/.claude/skills/...` as the current canonical path.

## Verification Plan

Run after implementation:

```bash
bash -n scripts/install.sh
jq . .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json >/dev/null
find skills -maxdepth 2 -type f -name SKILL.md
rg -n "npm install -g|npm install --global|git add package.json Cargo.toml pyproject.toml VERSION|Pattern 1|Scenario 1|Benefit 1|Let me make sure we're on the same page|\\{\\{PROJECT_PATH\\}\\}/docs/\\[\\^a\\]" .
git status --short --untracked-files=all
```

Manual review checklist:

- Read each changed `SKILL.md` once end to end.
- Confirm every state-changing operation has an approval gate.
- Confirm `release` still has a usable happy path.
- Confirm installer instructions match README.
- Confirm no generated local state is newly untracked except intentional task/report files.

## Suggested Implementation Order

1. Phase 1 in one PR/commit: skill safety fixes.
2. Phase 2 in one PR/commit: installer, ignore policy, CI hardening.
3. Phase 3 in one PR/commit: reference quality and interaction refinements.
4. Phase 4 in one PR/commit: documentation/platform consistency.

This order reduces user-facing safety risk first, then prevents regressions through stronger automation, then improves quality and documentation drift.

