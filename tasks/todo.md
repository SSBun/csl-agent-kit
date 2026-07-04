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
- [x] Add a hook script that summarizes built-in SOPs and `~/.ssbun-skills/sops/*.md`.
- [x] Update `SessionStart` hook to run the summary script.
- [x] Verify JSON, script output, references, and workspace status.

## Review

- Renamed the skill to `sop-manager` and updated plugin manifests, README, Claude command docs, and analysis references.
- Replaced the old built-in SOP index with per-SOP YAML frontmatter summaries.
- Added `skills/sop-manager/scripts/sop-summaries.sh` to summarize built-in SOPs and user SOPs under `~/.ssbun-skills/sops/*.md`.
- Updated the Codex `SessionStart` hook to run the summary script, with a minimal fallback if the script is not found.
- Updated `scripts/install.sh` to remove the old Codex `sop-creator` symlink during install.

Verification performed:

- `jq . hooks/hooks.json .codex-plugin/plugin.json .claude-plugin/plugin.json .cursor-plugin/plugin.json .agents/plugins/marketplace.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json`
- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `bash -n scripts/install.sh`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `jq -r '.hooks.SessionStart[0].hooks[0].command' hooks/hooks.json | sh`
- Temporary `HOME` test with `~/.ssbun-skills/sops/release-hotfix.md`
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
- Defined companion user SOPs like `~/.ssbun-skills/sops/{built-in-name}-lessons.md` for lessons related to built-in SOPs, so built-in SOP files are not modified or shadowed.
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

# Inject May Agents Skill

## Plan

- [x] Create `skills/inject-may-agents` with a copied AGENTS template.
- [x] Write the skill workflow for explicit invocation only.
- [x] Require final proposed AGENTS.md content to be shown before writing.
- [x] Validate skill metadata and check references.
- [x] Add a review section with verification evidence.

## Review

- Added `skills/inject-may-agents/SKILL.md`.
- Added `skills/inject-may-agents/references/AGENTS.template.md`, copied from the current English `AGENTS.md`.
- Added `skills/inject-may-agents/agents/openai.yaml` with implicit invocation disabled.
- Updated `README.md` and plugin manifests with the new skill and install count.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/inject-may-agents`
- `cmp -s skills/inject-may-agents/references/AGENTS.template.md /Users/caishilin/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_6iu30dwhwv3r22_a1e7/msg/file/2026-06/AGENTS.md`
- `rg -n "inject-may-agents|17 skills" README.md skills/inject-may-agents`
- `jq . .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json`
- `rg -n "inject-may-agents" README.md skills/inject-may-agents .claude-plugin .cursor-plugin .codex-plugin .agents/plugins`
- `git diff --check`
- `git status --short --untracked-files=all`

# Yao Meta Skill Portfolio Audit

## Plan

- [x] Inventory all `skills/*/SKILL.md` packages in this repository.
- [x] Run Yao portfolio and per-skill validation checks.
- [x] Inspect resource boundaries, trigger descriptions, manifests, and safety issues.
- [x] Write a Chinese audit report under `docs/analysis/`.
- [x] Record verification evidence and remaining risks.

## Review

- Created `docs/analysis/yao-meta-skill-portfolio-audit.md`.
- Generated Yao Skill Atlas artifacts under `docs/analysis/yao-meta-skill-audit/`.
- Audited 17 skills for route collisions, OpenAI schema compatibility, Yao validation, resource boundary size, trust/safety signals, manifest coverage, and high-risk command patterns.
- Cleaned unintended per-skill `reports/security_trust_report.*` files generated by `yao.py trust`; only the centralized audit artifacts remain.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py skill-atlas --workspace-root /Users/caishilin/Desktop/personal/skills --output-dir /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit --report-json /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit/skill-atlas.json --report-html /Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-audit/skill-atlas.html --today 2026-07-03`
- Per-skill `yao.py validate`
- Per-skill `resource_boundary_check.py`
- Per-skill OpenAI `quick_validate.py`
- Safety keyword scan with `rg`
- `jq` summary checks for Atlas outputs
- `git diff --check`

# Yao Meta Skill Audit Fixes

## Plan

- [x] Mark Yao metadata gaps as release-only gates instead of normal platform blockers.
- [x] Remove unsupported `argument-hint` frontmatter and preserve usage hints in skill bodies.
- [x] Reduce over-budget `SKILL.md` entrypoints by moving detail into references.
- [x] Remove duplicated `beautiful-mermaid` install instructions.
- [x] Regenerate audit artifacts and verify OpenAI/Yao checks.

## Review

- Added `skill_atlas/policy.json` so Yao interface/governance metadata gaps are tracked as release-only gates for this OpenAI/Codex-first skill collection.
- Removed all unsupported `argument-hint` frontmatter keys and kept usage hints in skill bodies.
- Reduced over-budget entrypoints by moving detailed workflow/format material into `references/` for `analyze-project`, `repo-map`, `same-page`, `figma-describe`, and `handoff-save`.
- Removed the duplicated global install block from `beautiful-mermaid`; also removed duplicate setup install text from `venom-cli`.
- Refreshed Yao Skill Atlas artifacts under `docs/analysis/yao-meta-skill-audit/` and updated the audit report with post-fix status.

Verification performed:

- `rg -n "^argument-hint:" skills/*/SKILL.md`
- Per-skill OpenAI `quick_validate.py`
- Per-skill Yao `resource_boundary_check.py`
- Yao `skill-atlas` regeneration with `--today 2026-07-03`
- Yao `validate` summary confirmed only `Missing agents/interface.yaml`, now release-only

# Yao Meta Skill Optimization Reanalysis

## Plan

- [x] Re-run Yao Atlas across all skills.
- [x] Re-run OpenAI schema and Yao resource-boundary checks.
- [x] Scan skill content for remaining optimization opportunities.
- [x] Write a concise optimization report under `docs/analysis/`.
- [x] Record verification evidence.

## Review

- Created `/Users/caishilin/Desktop/personal/skills/docs/analysis/yao-meta-skill-optimization-opportunities-2026-07-03.md`.
- Confirmed no hard failures in OpenAI schema validation, Yao resource-boundary validation, or Yao Atlas route/resource checks.
- Identified remaining optimization opportunities: `sop-manager`, `venom-cli`, and `test-triage` are close to the 1000-token production budget; Yao governance metadata remains release-only; optional trigger evals could cover near-neighbor routing groups.

Verification performed:

- Yao `skill-atlas` regeneration with `--today 2026-07-03`
- Per-skill OpenAI `quick_validate.py`
- Per-skill Yao `resource_boundary_check.py`
- Content scan for `argument-hint`, platform-specific prompt-tool references, placeholders, and stale markers

# Release Skill Routing


## Plan

- [x] Replace the broad release skill with a thin release-orchestrator router.
- [x] Remove ecosystem-specific publish commands from the release skill.
- [x] Add built-in `release-orchestrator` SOP.
- [x] Make user SOPs override same-named built-in SOP summaries.
- [x] Remove built-in `npm-publish-tool-or-native-app` and keep it user-defined under `~/.ssbun-skills/sops`.
- [x] Update README wording for the release skill.
- [x] Verify release skill no longer contains direct publish commands.

## Review

- Replaced the broad cross-ecosystem release skill with a thin release-orchestrator.
- Removed direct npm/PyPI/Cargo/Xcode/Homebrew/CocoaPods publish commands from the release skill.
- Added built-in release routing while keeping the npm publish SOP user-defined under `~/.ssbun-skills/sops`.
- Updated the SOP summary script so `~/.ssbun-skills/sops/{name}.md` overrides same-named built-in SOP summaries.
- Updated README release description to say it routes release work to matching SOPs.

Verification performed:

- `rg -n "npm publish|twine upload|cargo publish|pod trunk|agvtool|git push|git tag|Bump version|walk through publishing|publishing itself" skills/release/SKILL.md README.md`
- Read `skills/release/SKILL.md`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `test ! -e skills/sop-manager/sops/npm-publish-tool-or-native-app.md`

# Internet Research: Popular Agents and Skills

## Plan

- [x] Research popular coding agents, agent frameworks, and skill/plugin ecosystems from current public internet sources.
- [x] Compare repeated capability patterns across those agents.
- [x] Write a Chinese report under `docs/analysis/` with source links and recommendations.
- [x] Verify the report file, links/source coverage, and workspace diff.

## Review

- Created `docs/analysis/popular-agents-and-skills-report.md`.
- Compared popular coding agents and agent frameworks using GitHub metadata collected on 2026-06-25.
- Identified high-frequency skill categories: repo understanding, file/shell/test loop, test triage, dependency docs, browser UI verification, code/security review, GitHub workflow, MCP/connectors, release gates, and handoff/SOP.
- Recommended highest-impact coding power additions: `test-triage`, `repo-map`, `dependency-docs`, `browser-ui-verify`, `security-review`, and release-gate SOPs.

Verification performed:

- Read the generated report.
- `rg -n 'https://|test-triage|repo-map|dependency-docs|browser-ui-verify|security-review|release-gate' docs/analysis/popular-agents-and-skills-report.md`
- `git diff --check`
- `git status --short --branch --untracked-files=all`

# Initial Test Triage Skill

## Plan

- [x] Define what `test-triage` does and when it should trigger.
- [x] Create `skills/test-triage/SKILL.md` with a minimal diagnostic workflow.
- [x] Add `test-triage` to the README skill table.
- [x] Validate skill frontmatter and workspace diff.

## Review

- Added `skills/test-triage/SKILL.md`.
- Defined the skill as a reproduce -> diagnose -> fix -> verify loop for failing tests, CI failures, runtime errors, flaky behavior, regressions, and bug reports.
- Updated `README.md` with the new skill and corrected the global install count to 14 skills.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/test-triage`
- `rg -n '13 skills|14 skills|test-triage' README.md skills/test-triage/SKILL.md tasks/todo.md`
- `git diff --check`
- Full `quick_validate.py` across all existing skills was attempted but stops on pre-existing `skills/analyze-project` frontmatter key `argument-hint`; this is outside the new `test-triage` change.

# Test Triage Skill Subagent Audit

## Plan

- [x] Spawn an independent subagent to audit `skills/test-triage/SKILL.md`.
- [x] Review the audit findings.
- [x] Apply focused fixes if the audit identifies actionable issues.
- [x] Re-run validation and document the outcome.

## Review

Subagent verdict: minor edits, no blocker.

Changes made from audit:

- Narrowed the frontmatter trigger by removing generic focused-verification language.
- Added common trigger terms: red builds, pipeline failures, crashes, exceptions, stack traces, and timeouts.
- Added runtime bug reproduction paths before patching and before final verification.
- Moved practical regression-test creation before production-code changes.
- Changed multiple-failure handling from immediate stop to grouping and selecting the highest-signal first failure before escalating broad cleanup.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/test-triage`
- `rg -n 'focused verification|red builds|pipeline failures|crashes|exceptions|stack traces|timeouts|original failure path|regression test|highest-signal' skills/test-triage/SKILL.md tasks/todo.md`
- `git diff --check`

# Initial Repo Map Skill

## Plan

- [x] Define `repo-map` as a lightweight pre-exploration skill for unknown repositories or unfamiliar modules.
- [x] Include optional CodeGraph indexing/query workflow with `rg`/manifest fallback.
- [x] Emphasize key types/classes, responsibilities, entry points, and call/impact relationships.
- [x] Add `repo-map` to the README skill table and install count.
- [x] Validate the new skill and record verification.

## Review

- Added `skills/repo-map/SKILL.md`.
- Designed `repo-map` to run before broad exploration of an unknown repository or unfamiliar module.
- Made key types/classes the center of the output: role, collaborators, owned state, effects, tests, and relationships.
- Added optional CodeGraph flow using `codegraph init`, `sync`, `status`, `files`, `query`, `callers`, `callees`, and `impact`, with `rg`/manifest fallback.
- Updated `README.md` with `repo-map` and corrected the install count to 15 skills.

Verification performed:

- `command -v codegraph`
- `codegraph --help`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n '13 skills|14 skills|15 skills|repo-map|codegraph (init|sync|status|files|query|callers|callees|impact|uninit)' README.md skills/repo-map/SKILL.md tasks/todo.md`
- `git diff --check`

# Repo Map Glossary Correction

## Plan

- [x] Update `repo-map` so it produces a project glossary, not only a structural map.
- [x] Make glossary evidence-backed and focused on preventing user-agent terminology gaps.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill.

## Review

- Updated `skills/repo-map/SKILL.md` so its required output has both `Project Glossary` and `Working Map`.
- Glossary entries now cover domain terms, code terms, project-specific meaning, confusing nearby terms, and evidence source.
- Workflow now collects repeated domain words and builds an evidence-backed glossary before tracing relationships.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'glossary|Glossary|shared vocabulary|understanding gaps|Not the same as|Source|Unknown|domain terms|code terms|基础 glossary|理解偏差' skills/repo-map/SKILL.md tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Multi-Repo Root Detection

## Plan

- [x] Update `repo-map` to detect whether the working folder is a git repo.
- [x] Add child git repository detection when the working folder is only a container.
- [x] Require separate maps/glossaries per child repository.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill.

## Review

- Updated `skills/repo-map/SKILL.md` with a `Resolve project roots` first step.
- The skill now runs `git rev-parse --show-toplevel` to detect a root repo.
- If the working folder is not a git repo, it checks immediate child folders for `.git` and maps each child repository separately.
- CodeGraph usage is now scoped per project root instead of indexing a parent folder containing unrelated repos.
- Recorded the multi-repo correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'git rev-parse|show-toplevel|child git|child folders|separate|separately|project root|project roots|multi|多个项目|子 repo|git repo' skills/repo-map/SKILL.md tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Example Format

## Plan

- [x] Add a repo-map example markdown file as a reference resource.
- [x] Link the example from `skills/repo-map/SKILL.md`.
- [x] Make clear that example facts must not be copied into target reports.
- [x] Validate the skill and reference.

## Review

- Added `skills/repo-map/references/repo-map-web-example.md`.
- Linked the example from `skills/repo-map/SKILL.md` for saved report output or unclear format cases.
- The example includes `Project Glossary`, `Working Map`, and `Confidence`.
- The skill explicitly says not to copy example facts into target reports.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `test -f skills/repo-map/references/repo-map-web-example.md`
- `rg -n 'repo-map-web-example.md|docs/analysis/repo-map.md|Project Glossary|Working Map|Confidence|do not copy example facts' skills/repo-map/SKILL.md skills/repo-map/references/repo-map-web-example.md`
- `git diff --check`

# Repo Map Project-Specific Formats

## Plan

- [x] Update `repo-map` so it chooses report format by project kind.
- [x] Add an iOS/native repo-map example.
- [x] Keep the generic example for non-native or unclear project types.
- [x] Record the project-specific format lesson.
- [x] Validate the updated skill and examples.

## Review

- Updated `skills/repo-map/SKILL.md` to identify project kind before choosing the output format.
- Added `skills/repo-map/references/repo-map-apple-example.md`.
- Kept `repo-map-web-example.md` as the web-specific format.
- The iOS/native example now focuses on app targets, Swift modules, app entry, navigation, SwiftUI state, key types, persistence/networking boundaries, and XCTest hooks.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `test -f skills/repo-map/references/repo-map-apple-example.md`
- `rg -n 'repo-map-apple-example.md|iOS|macOS|SwiftUI|UIKit|AppKit|XCTest|Project kind|App Targets And Modules|App Entry And Navigation|State And Data Flow|Persistence, Networking, And Side Effects|project kind|web/backend|项目类型|apple' skills/repo-map/SKILL.md skills/repo-map/references/repo-map-apple-example.md tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Four Project Kinds

## Plan

- [x] Restrict repo-map format kinds to web, backend, apple, and android.
- [x] Rename the generic example into a web example.
- [x] Rename the iOS/native example into an apple example.
- [x] Add backend and Android examples.
- [x] Update lessons to reflect the four supported kinds.
- [x] Validate all repo-map references.

## Review

- Restricted repo-map format kinds to exactly four: web, backend, apple, and android.
- Renamed the original generic/web example to `repo-map-web-example.md`.
- Renamed the iOS/native example to `repo-map-apple-example.md`.
- Added `repo-map-backend-example.md` and `repo-map-android-example.md`.
- Updated `skills/repo-map/SKILL.md` to select only among those four references.
- Updated `tasks/lessons.md` with the four-kind rule.

Verification performed:

- `find skills/repo-map/references -maxdepth 1 -type f -print | sort`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'repo-map-example|repo-map-ios-native|repo-map-web-example|repo-map-backend-example|repo-map-apple-example|repo-map-android-example|web, backend, apple, or android|四类|Android|Gradle|Activity|XCTest' skills/repo-map tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Deep Concepts Only

## Plan

- [x] Remove obvious inventory from repo-map output guidance.
- [x] Rewrite all four examples around business concepts, core logic modules, key type effects, business flows, relevance filters, and verification hooks.
- [x] Keep implementation details summarized rather than expanded.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill and references.

## Review

- Updated `skills/repo-map/SKILL.md` to reject obvious inventory in final output unless it explains business boundaries.
- Removed `Scope` and `Project Shape` style metadata from all four repo-map examples.
- Reworked all examples to focus on deep concepts: glossary, core concepts, core logic modules, key type effects, business flows, relevance filters, change targets, and verification hooks.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n '^## Scope|^### Project Shape|Language:|Framework:|Project:|Root:|Generated:|Project kind:' skills/repo-map/references/*.md`
- `rg -n 'Core Concepts|Core Logic Modules|Key Type Effects|Business Flows|Relevance Filter|Verification Hooks|obvious inventory|implementation detail|Deep Concepts Only|项目名|语言|框架|核心类型影响|无关区域' skills/repo-map tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Remove Question List

## Plan

- [x] Remove the default question-list section from all repo-map examples.
- [x] Update task records that described that section as part of the format.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the references.

## Review

- Removed the default question-list section from all four repo-map reference examples.
- Updated historical task wording so it no longer describes that section as part of the repo-map format.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- no-residual search for the removed question-list heading across `skills/repo-map`, `tasks/todo.md`, and `tasks/lessons.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `git diff --check`

# Repo Map Component Summary

## Plan

- [x] Add a concise component summary requirement to `repo-map`.
- [x] Update all repo-map format examples to include the summary.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill and references.

## Review

- Added `Component Summary` before `Project Glossary` in the repo-map output guidance.
- Updated all four reference examples to include a concise product/business responsibility summary.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'Component Summary|component summary|组件摘要|Repo Map Component Summary' skills/repo-map tasks/lessons.md tasks/todo.md`
- `git diff --check`

# Repo Map Objective Structure

## Plan

- [x] Remove subjective/audit-style sections from the repo-map skill.
- [x] Update repo-map examples to show objective structure, modules, and key types.
- [x] Rewrite the generated `ZHShortStory` repo-map file in the objective format.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the skill, examples, and generated file.

## Review

- Updated `skills/repo-map/SKILL.md` so repo-map outputs objective structure only: component summary, glossary, file structure, modules, key types, and core flows.
- Rewrote all four repo-map reference examples to remove `Risk`, `Confidence`, `Relevance Filter`, `Change Targets`, and `Verification Hooks`.
- Rewrote `ZHShortStory/docs/analysis/repo-map.md` in the objective format.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'Risk|risk|Confidence|confidence|Relevance Filter|Change Targets|Verification Hooks|Why It Matters|Open Questions|open questions|audit|审计|风险|置信|建议|问题清单' skills/repo-map /Users/caishilin/Documents/SharkSpace/native-short-reader/ZHShortStory/docs/analysis/repo-map.md tasks/lessons.md`
- `rg -n '^## Component Summary|^## Project Glossary|^## Working Map|^### File Structure|^### Modules|^### Key Types|^### Core Flows' /Users/caishilin/Documents/SharkSpace/native-short-reader/ZHShortStory/docs/analysis/repo-map.md skills/repo-map/references/*.md`
- `git diff --check`
- `git diff --check -- docs/analysis/repo-map.md`

# SOP Create English Output (Superseded)

## Plan

- [x] 曾尝试在 `sop-manager create` 指令中加入 SOP 文件正文语言规则。
- [x] 保持模板结构不变，只补充语言约束，避免扩大改动。
- [x] 用搜索和 diff 校验规则位置与格式。

## Review

- 已被后续 “Remove SOP Create Language Limit” 撤销。
- 原因：用户明确纠正主流程描述可以使用任意语言，不应限制整份 SOP 文件语言。

Verification performed:

- `rg -n 'frontmatter 的 \`description\`|SOP Create English Output' skills/sop-manager/SKILL.md tasks/todo.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- skills/sop-manager/SKILL.md tasks/todo.md`

# SSBun SOP Storage

## Plan

- [x] Move user SOP storage into the SSBun-owned local folder: `~/.ssbun-skills/sops`.
- [x] Update SOP lookup, create, learn, see, release, hook, and script path references.
- [x] Record the naming correction for short preferences as tips, not rules.
- [x] Test the updated skill, script, hook command, and path searches.

## Review

- Updated `sop-manager` create/list/learn/see guidance to use `~/.ssbun-skills/sops`.
- Updated `sop-summaries.sh`, `release`, and `release-orchestrator` to resolve user SOPs from the new folder.
- Updated hooks to prefer `~/.ssbun-skills/skills/sop-manager/scripts/sop-summaries.sh`, with existing fallback paths preserved.
- Updated `scripts/install.sh` so Codex installs also create `~/.ssbun-skills/skills/{name}` symlinks.
- Documented user-created SOP storage in `README.md`.
- Removed the invalid `argument-hint` frontmatter key from `skills/release/SKILL.md` after validation exposed it.
- Recorded the tips naming correction in `tasks/lessons.md`.

Verification performed:

- `bash -n skills/sop-manager/scripts/sop-summaries.sh scripts/install.sh`
- `jq . hooks/hooks.json`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/release`
- Temporary `HOME` test with `~/.ssbun-skills/sops/release-orchestrator.md`
- Executed the `SessionStart` hook command from `hooks/hooks.json`
- No-residual search for legacy user SOP path
- `git diff --check`

# Tips Skill

## Plan

- [x] Create the `tips` skill with minimal add/list/edit guidance.
- [x] Store user tips under `~/.ssbun-skills/tips/tips.md`.
- [x] Add scripts to append tips and inject tips into session context.
- [x] Add hooks for session start/new/resume/clear/compact and post-compact injection.
- [x] Update install/docs and verify scripts, hooks, and skill metadata.

## Review

- Added `skills/tips/SKILL.md` and `skills/tips/agents/openai.yaml`.
- Added `skills/tips/scripts/tips-add.sh` to append one short tip to `~/.ssbun-skills/tips/tips.md`.
- Added `skills/tips/scripts/tips-inject.sh` to inject stored tips into session context.
- Updated `hooks/hooks.json` so tips inject before SOP summaries on `SessionStart` (`startup|resume|clear|compact|new`) and before SOP reload on `PostCompact`.
- Updated README and plugin manifests to include `tips`.

Verification performed:

- `bash -n skills/tips/scripts/tips-add.sh skills/tips/scripts/tips-inject.sh scripts/install.sh`
- `jq .` for hook and plugin JSON files
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- Temporary `HOME` test for `tips-add.sh` and `tips-inject.sh`
- Temporary `HOME` tests for `SessionStart` and `PostCompact` tips hook commands
- Hook order check: tips runs before SOP summary/reload
- `git diff --check`

# Tips Length Guard

## Plan

- [x] Add a length guard before `tips-add.sh` writes a tip.
- [x] Document the maximum tip length in `skills/tips/SKILL.md`.
- [x] Verify accepted and rejected tips do the right thing.

## Review

- Added a 240-character guard to `skills/tips/scripts/tips-add.sh`.
- The guard runs before directory/file creation, so rejected tips do not write anything.
- Documented the 240-character limit in `skills/tips/SKILL.md`.

Verification performed:

- `bash -n skills/tips/scripts/tips-add.sh`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- Temporary `HOME` test: short tip is saved and injected.
- Temporary `HOME` test: 241-character tip is rejected and no tips file is created.

# Tips Confirmation Guard

## Plan

- [x] Require explicit confirmation before any tip write.
- [x] Update `tips-add.sh` so old direct calls fail without `--confirmed`.
- [x] Document the show-then-ask workflow in `skills/tips/SKILL.md`.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Verify confirmed writes, unconfirmed rejection, and validation.

## Review

- Updated `tips-add.sh` to require `--confirmed` before writing.
- Updated `skills/tips/SKILL.md` to require showing the exact tip and waiting for explicit user confirmation.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `bash -n skills/tips/scripts/tips-add.sh`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- Temporary `HOME` test: unconfirmed write is rejected and no tips file is created.
- Temporary `HOME` test: confirmed short tip is saved and injected.
- Temporary `HOME` test: confirmed 241-character tip is rejected and no tips file is created.

# Tips Agents Metadata Removal

## Plan

- [x] Remove optional `skills/tips/agents/` metadata.
- [x] Verify the `tips` skill still validates and scripts remain present.

## Review

- Removed `skills/tips/agents/openai.yaml`.
- `tips` now contains only `SKILL.md` and the two scripts it needs.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- `find skills/tips -maxdepth 3 -type f`

# SOP Files Audit

## Plan

- [x] Identify built-in, current user, and legacy user SOP files.
- [x] Read every discovered SOP file.
- [x] Check frontmatter, trigger visibility, path consistency, and referenced SOP availability.
- [x] Report findings without modifying SOP behavior.

## Review

- Audited built-in SOPs:
  - `/Users/caishilin/Desktop/personal/skills/skills/sop-manager/sops/release-orchestrator.md`
  - `/Users/caishilin/Desktop/personal/skills/skills/sop-manager/sops/swift-api-design.md`
- Audited legacy user SOPs:
  - `/Users/caishilin/.sops/npm-publish-tool-or-native-app.md`
  - `/Users/caishilin/.sops/typescript-cli.md`
- Current user SOP directory `~/.ssbun-skills/sops` has no SOP files.

Verification performed:

- `find skills/sop-manager/sops -maxdepth 1 -type f -name '*.md'`
- `find ~/.ssbun-skills/sops -maxdepth 1 -type f -name '*.md'`
- `find ~/.sops -maxdepth 1 -type f -name '*.md'`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `nl -ba` on all discovered SOP files
- `rg` for SOP path references and release orchestrator target names

# User SOP Migration

## Plan

- [x] Check current and legacy user SOP directories for conflicts.
- [x] Move legacy `~/.sops/*.md` files into `~/.ssbun-skills/sops/`.
- [x] Verify SOP summary output includes the migrated user SOPs.

## Review

- Moved `/Users/caishilin/.sops/npm-publish-tool-or-native-app.md` to `/Users/caishilin/.ssbun-skills/sops/npm-publish-tool-or-native-app.md`.
- Moved `/Users/caishilin/.sops/typescript-cli.md` to `/Users/caishilin/.ssbun-skills/sops/typescript-cli.md`.
- Legacy `/Users/caishilin/.sops` no longer contains `.md` SOP files.

Verification performed:

- `find ~/.ssbun-skills/sops -maxdepth 1 -type f -name '*.md'`
- `find ~/.sops -maxdepth 1 -type f -name '*.md'`
- `skills/sop-manager/scripts/sop-summaries.sh`

# Remove SOP Create Language Limit

## Plan

- [x] 删除 `sop-manager create` 中“整份 SOP 必须使用英文”的限制。
- [x] 保留现有模板和用户 SOP 存储路径不变。
- [x] 记录这次纠正，避免以后把语言要求扩大到整份 SOP。
- [x] 校验 skill 和 diff。

## Review

- 删除了 `skills/sop-manager/SKILL.md` 中强制 SOP 文件全篇英文的步骤。
- 保留模板本身不变；SOP 主流程描述现在不再被固定为英文或其他单一语言。
- 在 `tasks/lessons.md` 记录这次纠正：不要把语言偏好扩大成整份 SOP 文件限制。

Verification performed:

- Confirmed no active SOP language-limit rule remains in `skills/sop-manager/SKILL.md`.
- `rg -n 'Remove SOP Create Language Limit|SOP Create Language Scope' tasks/todo.md tasks/lessons.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- skills/sop-manager/SKILL.md tasks/todo.md tasks/lessons.md`

# Baoyu Skills Wiki Collection

## Plan

- [x] 读取用户 tips，确认 wiki 文档保存到本地 MyWiki 目录。
- [x] 只读检查 `JimLiu/baoyu-skills` 仓库权限和当前 commit。
- [x] 抽取远端仓库 skill 清单与 frontmatter 描述。
- [x] 写入中文收藏文档到 wiki 目录。
- [x] 打开生成的 Markdown 文件并校验路径。

## Review

- 已创建 wiki 文档：`/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md`
- 文档来源：`https://github.com/JimLiu/baoyu-skills`，采集 commit `c9a50cc`。
- 文档包含推荐安装组合、公众号文章工作流、内容采集、视觉生成、发布分发、工具类和 21 个 skill 的完整索引。
- GitHub repo 当前对本机账号权限为 `READ`，没有直接推送远端 wiki。
- 已按 tips 用 Typora 打开生成的 Markdown 文件。

Verification performed:

- `gh repo view jimliu/baoyu-skills --json nameWithOwner,url,description,defaultBranchRef,viewerPermission,hasWikiEnabled`
- `git clone --depth 1 https://github.com/jimliu/baoyu-skills.git /tmp/baoyu-skills`
- `find /tmp/baoyu-skills -maxdepth 3 -type f -name SKILL.md`
- `rg -n '^\| `baoyu-' "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md"`
- `wc -l "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md"`
- `open -a Typora "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/我收藏的 Agent Skills - baoyu-skills.md"`
- `git diff --check -- tasks/todo.md`

# SOP Create Good Example

## Plan

- [x] Add a concise good SOP example under `skills/sop-manager/references/`.
- [x] Update `sop-manager create` to read and follow the example before writing a SOP.
- [x] Verify the skill, reference path, and diff.

## Review

- Added `/Users/caishilin/Desktop/personal/skills/skills/sop-manager/references/good-sop-example.md`.
- Updated `sop-manager create` so new SOP creation reads that example first and checks trigger description, scope, executable steps, confirmation gates, concrete error handling, and reusable lessons.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `test -f skills/sop-manager/references/good-sop-example.md`
- `rg -n 'good-sop-example|清楚的触发型|Save Markdown Docs SOP|SOP Create Good Example' skills/sop-manager tasks/todo.md`
- `git diff --check`

# Install Script Output And Local Data Boundary

## Plan

- [x] Stop creating `~/.ssbun-skills/skills` mirrors; keep `~/.ssbun-skills` for user data only.
- [x] Link Codex skills directly from `~/.agents/skills/{name}` to this repository's `skills/{name}`.
- [x] Remove hook lookups for `~/.ssbun-skills/skills/...`.
- [x] Make install output show unchanged links in default color, new links in green, updated links in yellow.
- [x] Verify install behavior with a temporary HOME and fake Codex path.

## Review

- Updated `scripts/install.sh` so Codex skill symlinks point directly from `~/.agents/skills/{name}` to `/Users/caishilin/Desktop/personal/skills/skills/{name}`.
- Removed creation of `~/.ssbun-skills/skills/{name}` mirrors.
- Added cleanup for obsolete symlinks under `~/.ssbun-skills/skills`; only symlinks are removed.
- Changed installer output to status lines:
  - `unchanged` in default terminal color.
  - `new` in green when stdout supports color.
  - `updated` in yellow when stdout supports color.
- Removed `~/.ssbun-skills/skills/...` lookups from tips and SOP hooks.
- Updated the current machine: removed the old `~/.ssbun-skills/skills` symlink mirror and relinked real `~/.agents/skills/*` entries directly to this repository.
- Recorded the local-data boundary correction in `tasks/lessons.md`.

Verification performed:

- `bash -n scripts/install.sh`
- `jq . hooks/hooks.json`
- Temporary `HOME` install with Codex hidden from `PATH`: creates direct `~/.agents/skills` links and no `~/.ssbun-skills/skills`.
- Temporary `HOME` migration test: removes old mirror symlink and updates `.agents` link to direct repository path.
- Hook fallback tests for tips and SOP summary commands.
- Real HOME relink test with Codex hidden from `PATH`; second run reports `unchanged`.
- `git diff --check`

# Codex Duplicate Skills Fix

## Plan

- [x] Explain duplicate skill source.
- [x] Change install output so unchanged links do not print an `unchanged` status.
- [x] Show only the Codex skill path in install output, not the repository target path.
- [x] Make Codex plugin hooks-only so skills load from `~/.agents/skills` instead of both plugin cache and symlinks.
- [x] Refresh current Codex plugin cache and verify duplicate plugin skills are gone.

## Review

- Root cause: Codex had both `/Users/caishilin/.agents/skills/sop-manager` and plugin cache `/Users/caishilin/.codex/plugins/cache/CSL/csl/1.7.1/skills/sop-manager`, so the same skill appeared twice.
- Updated `scripts/install.sh` output:
  - Unchanged links print as `Codex: ~/.agents/skills/{name}` in default color.
  - New links print as `new Codex: ~/.agents/skills/{name}` in green when color is available.
  - Updated links print as `updated Codex: ~/.agents/skills/{name}` in yellow when color is available.
  - Repository target paths are no longer printed for normal skill links.
- Added `.codex-plugin/hooks/hooks.json` so `.codex-plugin` is the actual hooks-only Codex plugin package.
- Removed `skills` export from `.codex-plugin/plugin.json`.
- Changed the Codex marketplace source to `./.codex-plugin`.
- Removed the old tracked `plugins/csl -> ..` symlink, which caused Codex to package the whole repository as the plugin.
- Updated `scripts/install.sh` to remove/re-add `csl@CSL`, preventing stale plugin caches from keeping a `skills/` directory.
- Refreshed current machine's `csl@CSL` plugin cache; it no longer contains `skills/`.
- Documented in `README.md` that Codex skills are linked through `~/.agents/skills` and the plugin is hooks-only.

Verification performed:

- `bash -n scripts/install.sh`
- `jq . .codex-plugin/plugin.json .codex-plugin/hooks/hooks.json hooks/hooks.json .agents/plugins/marketplace.json`
- Temporary `HOME` install output test: first run shows `new ...`, second run shows plain `Codex: ~/.agents/skills/{name}`.
- Real `./scripts/install.sh codex`
- Confirmed `/Users/caishilin/.codex/plugins/cache/CSL/csl/local/skills` does not exist.
- Confirmed `/Users/caishilin/.codex/plugins/cache/CSL/csl/local/hooks/hooks.json` exists.
- Confirmed `/Users/caishilin/.agents/skills/sop-manager` points to `/Users/caishilin/Desktop/personal/skills/skills/sop-manager`.
- `git diff --check`

# Wiki Skill Collections Folder

## Plan

- [x] Create a dedicated local wiki folder for future skill collection docs.
- [x] Move the existing `baoyu-skills` collection doc into that folder.
- [x] Verify the new path and open the moved document.

## Review

- Created `/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections`.
- Moved the existing `baoyu-skills` collection doc into that folder.
- Future agent skill collection wiki docs should go in this folder.

Verification performed:

- `ls -la "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections"`
- `wc -l "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections/我收藏的 Agent Skills - baoyu-skills.md"`
- `open -a Typora "/Users/caishilin/Library/Mobile Documents/com~apple~CloudDocs/MyWiki/技术文档/AI Agent/Agent Skill Collections/我收藏的 Agent Skills - baoyu-skills.md"`
- `git diff --check -- tasks/todo.md`
