# Current Skills Audit

**Date:** 2026-06-15
**Scope:** `/Users/caishilin/Desktop/personal/skills`
**Mode:** Read-only audit of 13 shipped skills, plugin manifests, commands, installer, CI, and support docs.

## Executive Summary

The skill collection is structurally coherent: all 13 skill directories have `SKILL.md`, platform manifests are valid JSON, `scripts/install.sh` parses with `bash -n`, and `analyze-project` prompt/template references resolve.

The main risks are not missing files. They are operational safety and instruction drift:

- Some skills instruct agents to run global installs or write-generating commands without explicit approval.
- Release/handoff workflows contain state-changing steps with incomplete confirmation or branch logic.
- `code-reviewer` references are placeholder content, so the skill can pull low-quality guidance into reviews.
- Installer and CI scripts need stronger guardrails for symlink targets and pinned external tooling.
- A few docs/commands disagree about current platform layout and behavior.

## Inventory

- Skills: 13
- Claude commands: 2
- Analyze-project prompts: 11
- Analyze-project templates: 12, including `SUMMARY.md`
- Platform manifests checked: `.claude-plugin`, `.cursor-plugin`, `.codex-plugin`, `.agents/plugins`

## High Severity

### 1. `handoff-restore` has a contradictory branch

Evidence: [skills/handoff-restore/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/handoff-restore/SKILL.md:21)

Step 2 says existing file should go to step 3, but step 3 is the missing-file branch. That makes the mandatory restore workflow self-contradictory.

Recommendation: change step 2 to route existing files directly to the read step, and make the missing branch separate.

### 2. `venom-cli` marks a generating command as read-only

Evidence: [skills/venom-cli/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/venom-cli/SKILL.md:63), [skills/venom-cli/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/venom-cli/SKILL.md:94)

`gen-asset-code` is described as generating Swift/ObjC resource access code, but the safety rules classify it as a read operation that can run without confirmation.

Recommendation: move `gen-asset-code` to write operations and require confirmation, plus note expected output files when known.

### 3. Missing dependencies trigger global installs without approval

Evidence: [skills/beautiful-mermaid/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/beautiful-mermaid/SKILL.md:14), [skills/venom-cli/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/venom-cli/SKILL.md:15)

Both skills instruct global `npm install -g` when dependencies are missing. Global installs require network, mutate user-level tooling, and may need elevated permissions.

Recommendation: require explicit user approval before installation. Prefer project-local or temporary install options where possible, and document fallback behavior when installation is denied.

### 4. Installer can overwrite or misplace symlinks

Evidence: [scripts/install.sh](/Users/caishilin/Desktop/personal/skills/scripts/install.sh:10), [scripts/install.sh](/Users/caishilin/Desktop/personal/skills/scripts/install.sh:17)

`ln -sfn` is used without checking whether targets are existing directories, symlinks owned by this repo, or unrelated user-managed paths. On macOS, replacing a real directory can produce surprising nested links instead of a clean replacement.

Recommendation: add a helper that checks each target. If it is a non-CSL directory or symlink, stop and tell the user exactly what to remove or override.

## Medium Severity

### 5. Release workflow confirmation is incomplete

Evidence: [skills/release/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/release/SKILL.md:3), [skills/release/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/release/SKILL.md:95), [skills/release/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/release/SKILL.md:104)

The description promises confirmation for each destructive step, but the flow only clearly confirms docs, push, and publish. Commit and tag creation are state-changing and should also be explicit confirmation gates.

Recommendation: add confirmation before commit and before tag creation, unless the user supplied a fully explicit release command that includes those actions.

### 6. Release staging example does not match supported ecosystems

Evidence: [skills/release/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/release/SKILL.md:97), [skills/release/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/release/SKILL.md:100)

The skill says to stage only version-bump files, but the sample `git add` is fixed to `package.json Cargo.toml pyproject.toml VERSION`, omitting Xcode, gemspec, podspec, and other detected version files.

Recommendation: replace the fixed sample with `git add <detected-version-files>` and require listing those files before staging.

### 7. `handoff-save` overwrites state without a guard

Evidence: [skills/handoff-save/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/handoff-save/SKILL.md:102), [skills/handoff-save/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/handoff-save/SKILL.md:104)

The skill always overwrites `~/.agents/handoffs/{project-name}.md`. Handoffs are cross-session state, so accidental overwrite can lose useful context.

Recommendation: if a handoff exists, read its timestamp and either ask before overwriting or write a `.bak` first.

### 8. SOP authority is too broad

Evidence: [skills/sop-creator/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/sop-creator/SKILL.md:44), [skills/sop-creator/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/sop-creator/SKILL.md:48)

The skill says SOPs are authoritative instructions before any procedural work. It does not explicitly say they cannot override system, developer, user, platform safety, or repository-specific rules.

Recommendation: add a precedence rule: SOPs apply only within their scope and never override higher-priority instructions or explicit user approvals.

### 9. `code-reviewer` references are placeholders

Evidence: [skills/code-reviewer/references/code_review_checklist.md](/Users/caishilin/Desktop/personal/skills/skills/code-reviewer/references/code_review_checklist.md:8), [skills/code-reviewer/references/coding_standards.md](/Users/caishilin/Desktop/personal/skills/skills/code-reviewer/references/coding_standards.md:8), [skills/code-reviewer/references/common_antipatterns.md](/Users/caishilin/Desktop/personal/skills/skills/code-reviewer/references/common_antipatterns.md:8)

The referenced docs contain generic placeholders such as `Pattern 1`, `Scenario 1`, and `Benefit 1`. Since the skill tells agents to read these references as needed, this can degrade review quality.

Recommendation: replace them with real review heuristics, or remove the reference section until the files contain useful guidance.

### 10. CI downloads `yq` from `latest` without pinning or checksum

Evidence: [.github/workflows/validate.yml](/Users/caishilin/Desktop/personal/skills/.github/workflows/validate.yml:19)

The workflow downloads an unpinned binary and executes it after `chmod +x`. This weakens reproducibility and supply-chain safety.

Recommendation: pin a specific `yq` version and verify SHA256, or use a pinned trusted action.

### 11. CI path regex for `docs/analysis` is too weak

Evidence: [.github/workflows/validate.yml](/Users/caishilin/Desktop/personal/skills/.github/workflows/validate.yml:106)

The regex `{{PROJECT_PATH}}/docs/[^a]` does not precisely assert that every docs output path is under `docs/analysis/`.

Recommendation: extract every `{{PROJECT_PATH}}/docs/...` reference from prompts and fail unless it starts with `{{PROJECT_PATH}}/docs/analysis/`.

### 12. Repo-local `.agents/skills` symlink is untracked and not ignored

Evidence: [scripts/install.sh](/Users/caishilin/Desktop/personal/skills/scripts/install.sh:26), [.gitignore](/Users/caishilin/Desktop/personal/skills/.gitignore:4)

Current `git status --short --untracked-files=all` reports `?? .agents/skills`. The install script creates this symlink for portable convention, but `.gitignore` does not ignore it.

Recommendation: choose one policy: commit the symlink intentionally, or ignore `.agents/skills`. Ignoring is safer if it is purely local install state.

## Low Severity

### 13. `same-page` conflicts with Chinese-only projects

Evidence: [skills/same-page/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/same-page/SKILL.md:12)

The skill hardcodes an English opener. In this repo, `AGENTS.md` requires all prose responses to be Chinese.

Recommendation: make the opener language-relative, e.g. "announce in the user's language".

### 14. `same-page` may be too heavy for simple clarifications

Evidence: [skills/same-page/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/same-page/SKILL.md:10)

Every run must include evidence, confidence, and an ASCII diagram. That is useful for high-stakes explanations, but excessive for small clarifications.

Recommendation: keep evidence/confidence mandatory for substantive claims, but make ASCII optional for trivial clarifications.

### 15. `brainstorming` writes plans without an explicit final confirmation

Evidence: [skills/brainstorming/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/brainstorming/SKILL.md:36), [skills/brainstorming/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/brainstorming/SKILL.md:39)

The process writes a validated design to `docs/plans/...` after design discussion. It does not explicitly ask before writing.

Recommendation: require "write this to docs?" before creating the file, unless the user's original request included documentation output.

### 16. `figma-describe` assumes tool-schema introspection exists

Evidence: [skills/figma-describe/SKILL.md](/Users/caishilin/Desktop/personal/skills/skills/figma-describe/SKILL.md:30)

The skill says to inspect the connected Figma MCP tool schema. Some environments expose tools statically and do not support runtime schema introspection.

Recommendation: add fallback: use the available Figma tools already listed in the session when schema introspection is unavailable.

### 17. `sop-activate` platform language is inconsistent

Evidence: [commands/sop-activate.md](/Users/caishilin/Desktop/personal/skills/commands/sop-activate.md:2), [commands/sop-activate.md](/Users/caishilin/Desktop/personal/skills/commands/sop-activate.md:6), [commands/sop-activate.md](/Users/caishilin/Desktop/personal/skills/commands/sop-activate.md:87)

Frontmatter says Claude Code or Cursor, body says Claude Code only, and later sections include Cursor rule paths.

Recommendation: pick one: Claude-only command that delegates Cursor to `sop-creator`, or cross-platform command with clear platform branching.

### 18. Old Figma spec points to pre-plugin location

Evidence: [docs/superpowers/specs/2026-06-04-figma-describe-design.md](/Users/caishilin/Desktop/personal/skills/docs/superpowers/specs/2026-06-04-figma-describe-design.md:75)

The spec says the skill lives at `~/.claude/skills/figma-describe/SKILL.md`, while the current repo uses `skills/figma-describe/SKILL.md` and plugin manifests.

Recommendation: mark the spec as historical or update the skill location.

## Passed Checks

- `find skills -maxdepth 2 -type f -name SKILL.md` found 13 skills.
- `bash -n scripts/install.sh` passed.
- `jq .` passed for all plugin and marketplace manifests.
- Every top-level `skills/*/` directory has a `SKILL.md`.
- `analyze-project` prompt references to `{{SKILL_PATH}}/templates/*.md` resolve.
- `analyze-project` prompts include `{{PROJECT_PATH}}/docs/analysis/...` output paths.
- `scripts/install.sh` has executable permissions.

## Recommended Fix Order

1. Fix safety issues: `handoff-restore`, `venom-cli`, global install approval, and release commit/tag confirmation.
2. Harden install and CI: symlink ownership checks, `.agents/skills` policy, pinned `yq`, stronger docs path validation.
3. Replace placeholder `code-reviewer` references.
4. Resolve language/platform drift in `same-page`, `sop-activate`, and the Figma spec.

