---
name: release-new-version
description: Use when the user wants to release a new version of a project (npm, PyPI, Cargo, Xcode/agvtool, Homebrew, CocoaPods, generic). Bumps version across all locations, commits, tags, optionally pushes, and walks through publishing — confirming each destructive step.
---

## Arguments

- `$ARGUMENTS` — optional: `[version] [--skip-push]`
  - `version` — target version (e.g. `1.2.3`). Skips version confirmation prompt.
  - `--skip-push` — skip remote push. Skips push confirmation prompt.

## Project Detection Table

Detect project type by checking files top-down. Use first match.

| Detection file(s) | Type | Version locations | Bump command |
|---|---|---|---|
| `*.xcodeproj/project.pbxproj` | xcode | `project.pbxproj` (`MARKETING_VERSION`, `CURRENT_PROJECT_VERSION`) | `agvtool new-marketing-version "X.Y.Z"` + `agvtool new-version -all "N"` |
| `package.json` | npm | `package.json`, `package-lock.json`, `npm-shrinkwrap.json` | Edit `package.json` version field, then `npm install --package-lock-only` |
| `pyproject.toml` or `setup.py` or `setup.cfg` | python | `pyproject.toml`, `setup.py`, `setup.cfg`, `**/__init__.py` (`__version__`) | Edit version field |
| `Cargo.toml` | cargo | `Cargo.toml`, `Cargo.lock` | Edit `Cargo.toml` version, then `cargo generate-lockfile` |
| `*.gemspec` | ruby | `*.gemspec`, `lib/**/version.rb` | Edit version field |
| `go.mod` + `goreleaser.yml` | go | goreleaser config, `main.go` version var | Edit version variable |
| `*.podspec` | cocoapods | `*.podspec` | Edit `s.version` |
| `VERSION` file | generic | `VERSION` | Edit file |

**Fallback**: check `Makefile`, `conf.py`, shell scripts for `VERSION=` or `__version__` patterns.

## Publishing Table

| Type | Detection | Publish command |
|---|---|---|
| npm | `package.json` exists | `npm publish` |
| python | `pyproject.toml` or `setup.py` exists | `python -m build && twine upload dist/*` |
| cocoapods | `*.podspec` exists | `pod trunk push *.podspec` |
| homebrew | Homebrew formula in repo or tap | Update formula, push tap |

## Flow

### 1. Check Git Status

```bash
git status
```

If uncommitted changes exist: **stop and tell user to commit or stash first.** Do not offer discard.

### 2. Detect Project Type

Run detection table top-down. Identify type, version locations, and bump method.

### 3. Detect Current Version

Read version from all locations in the version-locations column. If values disagree, **report mismatch and ask user which is correct** before proceeding.

### 4. Determine New Version

- If `version` argument provided: use it, skip confirmation.
- Otherwise: show current version, ask user for target version.

### 5. Determine Tag Prefix

```bash
git tag --list | head -20
```

- If existing tags match `v*`: use `v` prefix.
- If existing tags match `[0-9]*`: no prefix.
- If no tags exist: ask user.

### 6. Bump Version

**Primary**: update all locations from version-locations column.

**Fallback grep** for edge cases:
```bash
grep -r "version" --include="*.json" --include="*.py" --include="*.js" --include="*.ts" --include="*.sh" --include="*.toml" --include="*.yml" --include="*.yaml" --include="*.h" --include="*.swift" --include="*.go" --include="*.rs" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=build . 2>/dev/null | grep -v "lockfile\|lock\b" | grep -i "version"
```

Show user all files changed. Ask to confirm.

### 7. Documentation Check

Single pass — check README.md, CHANGELOG.md / HISTORY.md, and website dirs (`website/`, `docs/`, `site/`, `web/`, `www/`, `index.html`).

If any need updates for this release, ask user whether to update now. If yes, help update, then stage doc files separately:

```bash
git add README.md CHANGELOG.md docs/
git commit -m "Update documentation for vX.Y.Z"
```

### 8. Commit Version Bump

Stage **only** version-bump files. Never `git add -A`.

```bash
git add package.json Cargo.toml pyproject.toml VERSION
git commit -m "Bump version to X.Y.Z"
```

### 9. Create Tag

```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```

### 10. Push

- If `--skip-push` argument: skip.
- Otherwise: ask user. If yes:
  ```bash
  git push
  git push origin vX.Y.Z
  ```

### 11. Publish

Check publishing table. If project type has a publish command, ask user whether to publish. If yes, run it.

### 12. Summary

| Item | Value |
|---|---|
| **Version** | X.Y.Z |
| **Git Tag** | vX.Y.Z |
| **Commit** | [hash] |
| **Remote** | Pushed / Not pushed |
| **Published to** | [type] / None |

## Rules

- Never automatically push without user confirmation (unless `--skip-push` used, which means no push at all).
- Never publish to package managers without explicit user approval.
- Never assume version number without asking (unless provided as argument).
- Refuse to proceed with dirty working tree.
