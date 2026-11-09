# Restore Local AGENTS RTK Include

## Plan

- [x] Restore `@/Users/caishilin/.codex/RTK.md` only in `/Users/caishilin/.codex/AGENTS.md`.
- [x] Keep `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents/references/AGENTS.template.md` without the local include.
- [x] Correct the lesson so it applies to portable templates, not the local AGENTS file.
- [x] Re-run AGENTS/template checks and local quality gate audit.

## Review

- Restored `@/Users/caishilin/.codex/RTK.md` in `/Users/caishilin/.codex/AGENTS.md`.
- Kept `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents/references/AGENTS.template.md` free of the local RTK include.
- Corrected the lesson to say portable AGENTS templates must not contain local absolute-path includes, while the user's local AGENTS may.
- `scripts/check_codex_agents_contract.py` remains portable: it checks shared rule concepts, not local-only tooling includes.

local quality gate audit:

- `quick_validate.py` passed for `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents`.
- `check.js` still reports the pre-existing `Missing agents/interface.yaml` metadata gap.
- Treating that metadata gap as a release-only gate; lint, governance check, and resource boundary check passed.

Verification performed:

- `rg -n "@/Users/caishilin/.codex/RTK.md" /Users/caishilin/.codex/AGENTS.md skills/inject-may-agents/references/AGENTS.template.md`
- `python3 -B scripts/check_codex_agents_contract.py /Users/caishilin/.codex/AGENTS.md`
- `python3 -B scripts/check_codex_agents_contract.py skills/inject-may-agents/references/AGENTS.template.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/inject-may-agents`
- `node skills/meta/skill-quality/scripts/check.js skills/inject-may-agents`
