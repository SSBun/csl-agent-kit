# Rename conventions to standing-orders and harden the skill

- Status: Completed
- Date: 2026-07-21

## Goal

Rename the `conventions` skill to `standing-orders` (more precise: user's personal, always-on directives) and harden the skill with a size spec and a 4-step guide that routes non-convention content to the right carrier.

## Decisions

- Name: `standing-orders` (standing = persistent, orders = binding directive).
- Size spec: max 15 entries / 1500 characters total; each entry single line, imperative, ≤ 120 chars.
- Format: plain Markdown grouped by topic; no JSON/YAML; no explanatory paragraphs.
- Guide flow: CLASSIFY → DISTILL → CHECK → CONFIRM, with explicit exit ramps to AGENTS.md / sop-manager / lessons.md / one-off execution.

## Plan

- [ ] Rename `skills/conventions/` → `skills/standing-orders/` (git mv).
- [ ] Rewrite `SKILL.md`:
  - frontmatter `name` + description updated.
  - add size spec section.
  - replace ad-hoc add/remove sections with the 4-step CLASSIFY/DISTILL/CHECK/CONFIRM flow.
  - keep non-goals and storage location.
- [ ] Update `evals/trigger_cases.json` + `semantic_config.json` wording (convention → standing order).
- [ ] Update `references/agents.md` `### 6. User Conventions` → `### 6. Standing Orders` + file path reference.
- [ ] Update `hooks/hooks.json` (statusMessage wording, the `cat` command path unchanged since conventions.md filename stays).
- [ ] Update `pi/extensions/csl-context-hooks.ts` (section heading wording).
- [ ] Update 6 plugin manifests (keywords + skill path).
- [ ] Update `README.md` (skill table + data-location line).
- [ ] Update `tasks/context.md` (component entry + relationships).
- [ ] Keep `~/.csl-agent-kit/conventions.md` filename as-is (data file, not skill name; renaming would invalidate existing data; document the mapping in skill).
- [ ] After optimization, run `adversarial-review` against the final SKILL.md + agents.md section + hooks + Pi extension diff.

## Decision: keep data filename `conventions.md`

The skill name and the data filename are separate concerns. `conventions.md` is the user's existing data file with 5 migrated entries. Renaming it adds churn (data migration, hook path change, Pi extension path change) for no semantic gain. The skill body will name the file explicitly so the `standing-orders` skill → `conventions.md` mapping is unambiguous.

## Verification

- All JSON valid; no `conventions` slug残留 in active config except the data filename.
- SKILL.md passes adversarial-review.
- grep standing-orders across active files consistent.

## Review

- Prior adversarial review completed (2 cycles, APPROVED): [report](../artifacts/rename-conventions-to-standing-orders/reports/adversarial-review.md)

Key finding (R4 BLOCKER, resolved): the initial commit kept the data file as `conventions.md` while the skill was `standing-orders`, creating a naming split with a weak justification. Fixed by renaming the data file to `standing-orders.md` and updating all 8 active references.

Other findings: R1 spec/data intro inconsistency (fixed), R3 unjustified 1500-char cap (justified in spec), R2 strict-trigger gap (acknowledged, by design per user decision Q6).
## Adversarial remediation (2026-07-22)

**Status:** Completed (2026-07-22 11:04)

### Goals

- Replace obsolete tips tests with standing-orders and updated Pi regression coverage.
- Support first-write initialization and explicit persistent preference requests.
- Preserve higher-priority instruction boundaries and warn about legacy tips without auto-promoting them.
- Keep data-directory resolution and platform injection documentation consistent.
- Complete an independent Reviewer–Editor loop and record its final report.

### Result

- 修复 R1–R8，独立 Reviewer 最终判定 `APPROVED`。
- `npm run check` 通过，包括 CLI、standing-orders、task graph、Pi 与安装 dry-run。
