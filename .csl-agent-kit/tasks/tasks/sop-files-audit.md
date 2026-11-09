# SOP Files Audit

## Plan

- [x] Identify built-in, current user, and legacy user SOP files.
- [x] Read every discovered SOP file.
- [x] Check frontmatter, trigger visibility, path consistency, and referenced SOP availability.
- [x] Report findings without modifying SOP behavior.

## Review

- Audited built-in SOPs:
  - `/Users/caishilin/Desktop/personal/skills/skills/sop-manager/sops/release-orchestrator.md`
  - `/Users/caishilin/Desktop/personal/skills/skills/sop-manager/sops/swift-api-design.md`
- Audited legacy user SOPs:
  - `/Users/caishilin/.sops/npm-publish-tool-or-native-app.md`
  - `/Users/caishilin/.sops/typescript-cli.md`
- Current user SOP directory `~/.ssbun-skills/sops` has no SOP files.

Verification performed:

- `find skills/sop-manager/sops -maxdepth 1 -type f -name '*.md'`
- `find ~/.ssbun-skills/sops -maxdepth 1 -type f -name '*.md'`
- `find ~/.sops -maxdepth 1 -type f -name '*.md'`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `nl -ba` on all discovered SOP files
- `rg` for SOP path references and release orchestrator target names
