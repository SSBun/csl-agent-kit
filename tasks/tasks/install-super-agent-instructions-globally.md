# Install Super Agent Instructions Globally

## Plan

- [x] Back up the existing Codex and Claude instruction targets.
- [x] Link Codex, Agent Skills, and Claude Code to the bundled Super Agent instructions.
- [x] Verify all symlinks and backups, then run the required Yao rule audit.

## Review

- Codex, Agent Skills, and Claude Code now link directly to the bundled Super Agent instructions.
- Preserved the previous Codex file and Claude symlink in timestamped adjacent backups.
- Verified all three targets with `test -L` and exact `readlink` comparison; verified both backups and the original Claude link destination.
- Required Yao audit ran: lint, governance, and resource-boundary checks passed. Aggregate validation reports the repository's known release-only `Missing agents/interface.yaml` gap.
