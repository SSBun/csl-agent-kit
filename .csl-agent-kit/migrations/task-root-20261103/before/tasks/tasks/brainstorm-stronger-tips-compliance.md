# Brainstorm Stronger Tips Compliance

## Plan

- [x] Clarify whether “more positive” refers to saving tips or complying with already injected tips.
- [x] Compare compliance-strength designs while preserving explicit confirmation before every write.
- [x] Agree on the desired execution semantics and document the validated design only if requested.

## Review

- Confirmed that saved tips are mandatory whenever applicable but remain below system, developer, and explicit current-turn user instructions.
- Kept exact-preview and explicit-confirmation requirements before every write.
- Defined tips as normalized, single-line, single-behavior persistent instructions.
- Agreed limits: 120 characters per tip, 20 tips, and 2,000 total tip characters.
- Agreed to inject the complete current tips block before every agent turn, plus session start and post-compaction/resume.
- No standalone design document was requested or written.
