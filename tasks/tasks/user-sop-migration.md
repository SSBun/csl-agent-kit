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
