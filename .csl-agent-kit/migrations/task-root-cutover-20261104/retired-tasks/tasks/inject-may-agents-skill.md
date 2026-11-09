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
