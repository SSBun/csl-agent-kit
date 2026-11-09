# Codex AGENTS Concept Contract Test

## Plan

- [x] Add a small script that checks the AGENTS rule contract.
- [x] Cover first-principles thinking, adversarial review, mandatory todo/lessons, unchanged verification section, and removed duplicate sections.
- [x] Run the script against `/Users/caishilin/.codex/AGENTS.md`.
- [x] Record verification results.

## Review

- Added `/Users/caishilin/Desktop/personal/skills/scripts/check_codex_agents_contract.py`.
- The script checks the static AGENTS rule contract:
  - language protocol and AGENTS language exception
  - first-principles thinking
  - adversarial review
  - mandatory `tasks/todo.md` and `tasks/lessons.md`
  - unchanged `### 8. Verification Before Done`
  - removed duplicate old sections
  - RTK include
- It intentionally does not simulate a live model conversation; live behavior still needs manual prompt scenarios or a separate LLM harness.

Verification performed:

- `python3 -m py_compile scripts/check_codex_agents_contract.py`
- `python3 scripts/check_codex_agents_contract.py`
- `python3 scripts/check_codex_agents_contract.py /Users/caishilin/.codex/AGENTS.md`
