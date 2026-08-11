# Release Skill Routing


## Plan

- [x] Replace the broad release skill with a thin release-orchestrator router.
- [x] Remove ecosystem-specific publish commands from the release skill.
- [x] Add built-in `release-orchestrator` SOP.
- [x] Make user SOPs override same-named built-in SOP summaries.
- [x] Remove built-in `npm-publish-tool-or-native-app` and keep it user-defined under `~/.ssbun-skills/sops`.
- [x] Update README wording for the release skill.
- [x] Verify release skill no longer contains direct publish commands.

## Review

- Replaced the broad cross-ecosystem release skill with a thin release-orchestrator.
- Removed direct npm/PyPI/Cargo/Xcode/Homebrew/CocoaPods publish commands from the release skill.
- Added built-in release routing while keeping the npm publish SOP user-defined under `~/.ssbun-skills/sops`.
- Updated the SOP summary script so `~/.ssbun-skills/sops/{name}.md` overrides same-named built-in SOP summaries.
- Updated README release description to say it routes release work to matching SOPs.

Verification performed:

- `rg -n "npm publish|twine upload|cargo publish|pod trunk|agvtool|git push|git tag|Bump version|walk through publishing|publishing itself" skills/release/SKILL.md README.md`
- Read `skills/release/SKILL.md`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `test ! -e skills/sop-manager/sops/npm-publish-tool-or-native-app.md`
