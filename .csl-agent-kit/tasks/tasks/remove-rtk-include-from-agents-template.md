# Remove RTK Include From AGENTS Template

## Plan

- [x] Remove `@/Users/caishilin/.codex/RTK.md` from `/Users/caishilin/.codex/AGENTS.md`.
- [x] Remove the same include from `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents/references/AGENTS.template.md`.
- [x] Update the AGENTS contract test so RTK include is not required.
- [x] Record the correction in `/Users/caishilin/Desktop/personal/skills/tasks/lessons.md`.
- [x] Run validation and local quality gate audit.

## Review

- Removed the local absolute-path RTK include from `/Users/caishilin/.codex/AGENTS.md`.
- Removed the same include from `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents/references/AGENTS.template.md`.
- Updated `/Users/caishilin/Desktop/personal/skills/scripts/check_codex_agents_contract.py` so RTK include is no longer part of the expected AGENTS contract.
- Recorded `/Users/...` include guidance in `/Users/caishilin/Desktop/personal/skills/tasks/lessons.md`.
- Verified the inject-may-agents template still matches `/Users/caishilin/.codex/AGENTS.md` exactly.

local quality gate audit:

- `quick_validate.py` passed for `/Users/caishilin/Desktop/personal/skills/skills/inject-may-agents`.
- `check.js` still reports the pre-existing `Missing agents/interface.yaml` metadata gap.
- Treating that metadata gap as a release-only gate; lint, governance check, and resource boundary check passed.

Verification performed:

- `rg -n "@/Users/caishilin/.codex/RTK.md|RTK.md" /Users/caishilin/.codex/AGENTS.md skills/inject-may-agents/references/AGENTS.template.md scripts/check_codex_agents_contract.py`
- `cmp -s /Users/caishilin/.codex/AGENTS.md skills/inject-may-agents/references/AGENTS.template.md`
- `python3 -B scripts/check_codex_agents_contract.py /Users/caishilin/.codex/AGENTS.md`
- `python3 -B scripts/check_codex_agents_contract.py skills/inject-may-agents/references/AGENTS.template.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/inject-may-agents`
- `node skills/meta/skill-quality/scripts/check.js skills/inject-may-agents`
