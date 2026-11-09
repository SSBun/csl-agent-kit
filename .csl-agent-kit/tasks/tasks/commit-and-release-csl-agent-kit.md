# Commit And Release CSL Agent Kit

## Plan

- [x] Confirm release target, package ownership, current/target version, and SemVer impact.
- [x] Audit the complete dirty workspace and separate unrelated changes if any.
- [x] Update version metadata and changelog for the confirmed release.
- [x] Run full local verification, npm pack/publish dry-runs, and inspect package contents.
- [ ] Present commit, tag, push, and publish commands for explicit confirmation.
- [ ] Commit only approved files, then execute only confirmed remote release actions.
- [ ] Verify git and registry state after release.

## Review

Release preparation complete; remote release actions pending final confirmation.

Confirmed release:

- GitHub: `SSBun/csl-agent-kit`
- npm: `@ssbun/csl-agent-kit@2.0.0`
- npm user: `ssbun`
- version type: major, because old paths, namespace, and skill invocation compatibility were intentionally removed.

Preparation completed:

- Renamed the GitHub repository from `SSBun/skills` to `SSBun/csl-agent-kit` and updated local `origin`.
- Updated package and plugin versions to `2.0.0`.
- Added `CHANGELOG.md` with breaking-change notes.
- Added an npm `files` allowlist, public publish config, repository metadata, Node engine requirement, and optional Pi peer dependency.
- Updated CI to validate the npm CLI and the current Codex plugin contract.

Verification performed:

- `npm ci`
- `npm run check:cli`
- JSON, hook parity, shell syntax, and Node syntax checks.
- All 17 skills passed `quick_validate.py`.
- Manifest and CI contract checks passed.
- `git diff --check`
- `npm pack --dry-run --json`: 82 files, approximately 77 kB packed / 213 kB unpacked.
- Packed tarball install simulation passed.
- `npm publish --dry-run --access public` passed.
- `npm whoami` returned `ssbun`.
- `@ssbun/csl-agent-kit@2.0.0` is available.

Pending remote actions:

- Commit release changes.
- Push `main` to `origin` (including the two existing local commits ahead of the old remote main).
- Publish `@ssbun/csl-agent-kit@2.0.0` with public access.
- Create and push `v2.0.0` after recording final release status.
