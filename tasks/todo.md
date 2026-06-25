# Current Skills Audit

## Plan

- [x] Inventory repository structure and current skill manifests.
- [x] Review existing lessons and project documentation.
- [x] Audit skill files for structure, trigger clarity, safety rules, and maintainability.
- [x] Check supporting scripts, commands, and docs for broken references or drift.
- [x] Write findings and recommendations to `docs/analysis/current-skills-audit.md`.
- [x] Add a review section with verification evidence.

## Review

Report created: `docs/analysis/current-skills-audit.md`

Verification performed:

- `find skills -maxdepth 2 -type f -name SKILL.md`
- `find . -maxdepth 3 -type f -print`
- `git status --short --untracked-files=all`
- `bash -n scripts/install.sh`
- `jq . .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json`
- Checked `analyze-project` prompt references to templates and `docs/analysis` output paths.

Top findings:

- `handoff-restore` has a contradictory existing-file branch.
- `venom-cli` classifies `gen-asset-code` as read-only even though it generates code.
- `beautiful-mermaid` and `venom-cli` instruct global npm installs without explicit approval.
- `code-reviewer` reference docs still contain placeholder content.
- `scripts/install.sh` needs safer symlink target checks.

# Current Skills Optimization Plan

## Plan

- [x] Re-read the audit report and existing task records.
- [x] Group all findings into implementation phases.
- [x] Write a complete optimization plan with acceptance criteria.
- [x] Add verification commands and manual review checklist.
- [x] Verify the plan document and workspace status.

## Review

Plan created: `docs/analysis/current-skills-optimization-plan.md`

The plan covers all 18 audit findings across four phases:

- Phase 1: Safety and workflow correctness.
- Phase 2: Installer and CI hardening.
- Phase 3: Skill content quality.
- Phase 4: Documentation and platform alignment.

Verification performed:

- Read `docs/analysis/current-skills-optimization-plan.md`.
- Confirmed 18 numbered optimization items with `rg -n "^### [0-9]+\\."`.
- Checked workspace status with `git status --short --untracked-files=all`.

# Current Skills Optimization Implementation

## Plan

- [x] Split implementation into disjoint file groups for subagents.
- [x] Fix safety and workflow skill issues.
- [x] Harden installer, ignore policy, and CI validation.
- [x] Replace placeholder review references and tune interaction skills.
- [x] Align platform command/spec documentation.
- [x] Run verification commands from the optimization plan.
- [x] Review workspace status and summarize changed files.

## Review

Implementation completed across four file groups:

- Safety/workflow skills: `handoff-restore`, `venom-cli`, `beautiful-mermaid`, `release`, `handoff-save`, `sop-manager`.
- Installer/CI: `scripts/install.sh`, `.gitignore`, `.github/workflows/validate.yml`, `README.md`.
- Skill content quality: `code-reviewer` references, `same-page`, `brainstorming`, `figma-describe`.
- Platform docs: `commands/sop-activate.md`, `docs/superpowers/specs/2026-06-04-figma-describe-design.md`.

Verification performed:

- `bash -n scripts/install.sh`
- `git diff --check`
- `jq .` across all plugin and marketplace manifests
- Skill frontmatter validation loop from CI
- Command frontmatter validation loop from CI
- Analyze-project prompt docs path validation loop from CI
- Source keyword scan for removed unsafe/stale patterns
- `git status --short --untracked-files=all`

# SOP Routing Index

## Plan

- [x] Create a lightweight built-in SOP index under `skills/sop-manager/sops/`.
- [x] Add a plugin `SessionStart` hook that points procedural work to the index.
- [x] Update `sop-manager` lookup guidance to read the built-in index before individual built-in SOPs.
- [x] Verify index references and workspace status.

## Review

Created a lightweight frontmatter summary router for built-in SOPs.

Added SOP routing to `hooks/hooks.json` as a `SessionStart` hook:

- Do not read SOP files by default.
- For procedural work only, consult SOP summaries from frontmatter.
- Do not read unrelated SOP files.

Updated `skills/sop-manager/SKILL.md` so built-in SOP lookup reads the index first.

Verification performed:

- Read `hooks/hooks.json`.
- Read SOP frontmatter summaries.
- Checked index references with `rg`.
- Verified referenced SOP files exist.
- Checked `git status --short --untracked-files=all`.

# Figma Describe Hook

## Plan

- [x] Add a Codex `SessionStart` lifecycle hook for CSL SOP routing.
- [x] Add a Codex `PostToolUse` lifecycle hook for Figma/MasterGo design-fetch MCP tools.
- [x] Document `hooks/` in the repository layout.
- [x] Verify hook JSON, matcher coverage, and workspace status.

## Review

Added `hooks/hooks.json` with a `SessionStart` hook that injects the SOP routing prompt when the plugin loads in a Codex session.

Added `hooks/hooks.json` with a `PostToolUse` hook for Figma/MasterGo design-fetch MCP tools. The hook prints a mandatory reminder to use `figma-describe` before implementation, summary, or UI translation.

Updated `README.md` to document `hooks/` as bundled Codex lifecycle hooks.

Verification performed:

- `jq . hooks/hooks.json`
- Executed the `SessionStart` and `PostToolUse` hook commands extracted from `hooks/hooks.json`
- Tested matcher coverage against representative Figma and MasterGo MCP tool names
- Checked SOP and Figma routing references with `rg`
- Checked workspace status
# SOP Manager Dynamic User SOPs

## Plan

- [x] Rename `sop-creator` to `sop-manager` in the skill and docs.
- [x] Define `sop-manager list`, `create`, and `see` behavior in the skill.
- [x] Standardize SOP frontmatter on `name` and `description`.
- [x] Add a hook script that summarizes built-in SOPs and `~/.sops/*.md`.
- [x] Update `SessionStart` hook to run the summary script.
- [x] Verify JSON, script output, references, and workspace status.

## Review

- Renamed the skill to `sop-manager` and updated plugin manifests, README, Claude command docs, and analysis references.
- Replaced the old built-in SOP index with per-SOP YAML frontmatter summaries.
- Added `skills/sop-manager/scripts/sop-summaries.sh` to summarize built-in SOPs and user SOPs under `~/.sops/*.md`.
- Updated the Codex `SessionStart` hook to run the summary script, with a minimal fallback if the script is not found.
- Updated `scripts/install.sh` to remove the old Codex `sop-creator` symlink during install.

Verification performed:

- `jq . hooks/hooks.json .codex-plugin/plugin.json .claude-plugin/plugin.json .cursor-plugin/plugin.json .agents/plugins/marketplace.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json`
- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `bash -n scripts/install.sh`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `jq -r '.hooks.SessionStart[0].hooks[0].command' hooks/hooks.json | sh`
- Temporary `HOME` test with `~/.sops/release-hotfix.md`
- `rg` check for stale `sop-creator`, `skills/sop-creator`, `INDEX.md`, and `~/.agents/sops` references in active files
- `git status --short --untracked-files=all`
# SOP Manager Lessons

## Plan

- [x] Add `sop-manager learn` behavior for reusable mistake/lesson capture.
- [x] Extend SOP templates with a lessons section.
- [x] Record the user correction in `tasks/lessons.md`.
- [x] Verify the updated skill text.

## Review

- Added `sop-manager learn` for reusable mistake/lesson capture.
- Added `## Lessons` to the SOP creation template.
- Defined companion user SOPs like `~/.sops/{built-in-name}-lessons.md` for lessons related to built-in SOPs, so built-in SOP files are not modified or shadowed.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `rg` check for `sop-manager learn`, `## Lessons`, and companion lesson references.
- Read the updated `sop-manager` command section.
- `git diff --check`
# Rewrite Swift API Design SOP

## Plan

- [x] Rewrite `skills/sop-manager/sops/swift-api-design.md` against the official Swift API Design Guidelines.
- [x] Remove rules not present in that official guideline from this SOP.
- [x] Remove the built-in Google Swift style SOP so only the Swift API design SOP remains.
- [x] Add `PostCompact` SOP summary reload and `PreToolUse` SOP reminder hooks.
- [x] Verify frontmatter, hook summary output, and diff.

## Review

- Rewrote `swift-api-design` as a Chinese SOP based on the official Swift API Design Guidelines.
- Removed the `#fileID/#filePath/#file` production/test-helper rule because it is not part of that official API design page.
- Removed `swift-google-style` from built-in SOPs.
- Added `PostCompact` to reload SOP summaries after compaction and `PreToolUse` to remind the agent to check matching SOPs before procedural tool use.
- Added missing guidance for introduction-level intent, documentation summaries, associated type role naming, fluent-usage limits, mutating/nonmutating naming details, argument-label exceptions, tuple/closure names, and unconstrained polymorphism.

Verification performed:

- `skills/sop-manager/scripts/sop-summaries.sh | rg -n 'swift-api-design|Swift API|用于设计'`
- `rg -n "swift-google-style|Google Swift" -S .`
- `rg -n '#fileID|#filePath|#file\\b|Last Updated|version: 1.1|description:' skills/sop-manager/sops/swift-api-design.md`
- `jq . hooks/hooks.json`
- Executed `SessionStart`, `PostCompact`, and `PreToolUse` hook commands from `hooks/hooks.json`
- `git diff --stat`
# Release Skill Routing

## Plan

- [x] Replace the broad release skill with a thin release-orchestrator router.
- [x] Remove ecosystem-specific publish commands from the release skill.
- [x] Add built-in `release-orchestrator` SOP.
- [x] Make user SOPs override same-named built-in SOP summaries.
- [x] Remove built-in `npm-publish-tool-or-native-app` and keep it user-defined under `~/.sops`.
- [x] Update README wording for the release skill.
- [x] Verify release skill no longer contains direct publish commands.

## Review

- Replaced the broad cross-ecosystem release skill with a thin release-orchestrator.
- Removed direct npm/PyPI/Cargo/Xcode/Homebrew/CocoaPods publish commands from the release skill.
- Added built-in release routing while keeping the npm publish SOP user-defined under `~/.sops`.
- Updated the SOP summary script so `~/.sops/{name}.md` overrides same-named built-in SOP summaries.
- Updated README release description to say it routes release work to matching SOPs.

Verification performed:

- `rg -n "npm publish|twine upload|cargo publish|pod trunk|agvtool|git push|git tag|Bump version|walk through publishing|publishing itself" skills/release/SKILL.md README.md`
- Read `skills/release/SKILL.md`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `test ! -e skills/sop-manager/sops/npm-publish-tool-or-native-app.md`
