# Inject My Agents Name Fix

## Plan

- [x] Update the misspelled user-facing skill name to `Inject My Agents`.
- [x] Update matching description text that names the template phrase.
- [x] Leave the existing `inject-may-agents` skill ID and paths unchanged for compatibility.
- [x] Validate metadata, JSON manifests, and search results.
- [x] Audit the skill change with `skill-quality`.

## Review

- Updated `skills/inject-may-agents/SKILL.md` title and frontmatter description.
- Updated `skills/inject-may-agents/agents/openai.yaml` display name.
- Updated `README.md` skill summary.
- Kept `inject-may-agents` as the stable invocation ID and path.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/inject-may-agents`
- YAML parse for `skills/inject-may-agents/agents/openai.yaml`
- JSON parse for plugin and marketplace manifests
- `rg -n "Inject May Agents|May agent|May Agents|Inject My Agents|My agent|My Agents" README.md skills/inject-may-agents`
- `node skills/meta/skill-quality/scripts/check.js skills/inject-may-agents`
- `git diff --check -- README.md skills/inject-may-agents/SKILL.md skills/inject-may-agents/agents/openai.yaml tasks/todo.md`

Unresolved risk:

- local quality gate validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/inject-may-agents`; lint, governance check, and resource boundary check passed.
