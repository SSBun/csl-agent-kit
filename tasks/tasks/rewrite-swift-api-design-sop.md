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
