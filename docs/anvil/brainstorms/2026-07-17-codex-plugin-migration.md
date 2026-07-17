# Engineering Spec: Codex Plugin-Only Migration

## Execution Metadata

- **Status**: implemented
- **Workflow Stage**: req
- **Grill State**: bypassed
- **Created**: 2026-07-17
- **Updated**: 2026-07-17
- **Source Of Truth Until**: replaced by the confirmed `/anvil:plan`, or the request is abandoned
- **Requirements Source**: user acceptance of the previously proposed plugin-only migration, current repository evidence, current Codex plugin documentation, and Codex CLI behavior
- **Background Inputs**: the prior diagnosis and repository task history are background evidence, not independent coding fact sources
- **Compounded Knowledge**: `docs/anvil/knowledge/tooling/safe-symlink-migration.md`

## Background Inputs

- The user asked why the installer creates symlinks under `~/.agents/skills` and proposed using the new Codex plugin system instead.
- The repository previously made its Codex plugin hooks-only to stop duplicate skill discovery from both the plugin cache and `~/.agents/skills`.
- The user explicitly instructed the project to migrate to the new Codex plugin system after the recommended migration boundary was presented.

## Engineering Understanding

- The current CLI treats Codex skills and the Codex plugin as separate default install targets.
- The Codex skills target creates one symlink per shared skill under `~/.agents/skills`.
- The current marketplace entry points at the hooks-only `.codex-plugin` directory, so the installed plugin cache contains hooks but no shared skills.
- Current hook commands prefer scripts reached through `~/.agents/skills`; removing the symlinks without changing hook path resolution would break those hooks.
- Current Codex plugins can bundle root-level `skills/` and `hooks/` and expose `PLUGIN_ROOT` to hook commands.

## Goals

- Make `csl-agent-kit@csl-agent-market` the single Codex distribution and discovery source for shared CSL skills and hooks.
- Remove Codex installation-time creation of shared-skill symlinks under `~/.agents/skills`.
- Preserve hook behavior when the plugin runs from an installed Codex cache.
- Migrate existing CSL-owned symlinks safely so skills are not discovered twice after upgrade.
- Preserve repeatable local development installation through the existing CLI.

## Non-Goals

- Do not change Claude Code, Cursor, Pi, or `npx skills` distribution behavior.
- Do not package the project-local `.agents/skills/integrate-third-skills` workflow as a shared plugin skill.
- Do not delete regular directories, user-owned skills, or symlinks that do not resolve into this package's shared `skills/` tree.
- Do not publish npm, create a release, commit, push, or create an MR/PR.
- Do not add a new dependency or introduce a second plugin package directory.

## Current Architecture Constraints

- The repository root already contains the canonical `.codex-plugin/plugin.json`, `skills/`, and `hooks/hooks.json` surfaces required by the new plugin structure.
- `.agents/plugins/marketplace.json` is the configured repository marketplace and must continue to expose the stable identity `csl-agent-kit@csl-agent-market`.
- The npm package already includes `.codex-plugin/`, `skills/`, `hooks/`, and the repository marketplace file.
- The install CLI supports dry-run and JSON output; the migration must preserve those contracts.
- Existing saved interactive selections may contain the removed `codex-skills` target and must degrade to the remaining valid defaults.

## Solution Choice

- Package the repository root as the Codex plugin so one installed plugin contains both shared skills and hooks.
- Use manifest-relative component paths and plugin-root-relative hook execution.
- Collapse the Codex installer to one plugin target.
- Treat removal of legacy CSL-owned skill links as an idempotent migration step inside the Codex plugin installation workflow.

## Excluded Alternatives

- Keep both the plugin and global symlinks: rejected because it recreates duplicate skill discovery.
- Keep the plugin hooks-only: rejected because it preserves two installation mechanisms and unnecessary home-directory mutation.
- Delete all entries under `~/.agents/skills`: rejected because that directory may contain user-owned and third-party skills.
- Create a second nested plugin mirror: rejected because the repository root already matches the current plugin structure.

## Boundaries And Failure Modes

- A legacy link is removable only when it is a symlink whose resolved or lexical target is within the canonical shared `skills/` directory for this installed package.
- Broken CSL-owned links must be removable without following a missing target.
- A same-named regular file or directory must remain untouched.
- A same-named symlink pointing outside this package must remain untouched.
- Dry-run must report cleanup and plugin commands without mutating the home directory or Codex configuration.
- Plugin command failure must keep the existing non-zero install result contract.
- Re-running installation must be idempotent and must not recreate removed skill links.

## Engineering Cost

- Update the plugin manifest, marketplace source, hook paths, installer targets and migration logic, CLI regression tests, and installation documentation.
- Remove the duplicate Codex-only hook package copy if the root hook manifest becomes canonical.
- Update persistent task and lesson records according to repository rules.
- Validate plugin structure, CLI behavior, package contents, hook execution, legacy-link cleanup, and live Codex plugin installation.

## Explicit Assumptions

- Current Codex CLI behavior and current official plugin documentation take precedence over stale validator rules that reject a now-documented `hooks` manifest field.
- `PLUGIN_ROOT` is available to Codex plugin hooks and resolves to the installed plugin root.
- Shared skills remain rooted only under `skills/`; `.agents/skills/` remains project-local repository content.
- The existing plugin and marketplace identities remain stable.

## Domain Language

- **Shared skill**: a distributable leaf skill under the repository `skills/` tree.
- **Project-local skill**: a repository-only workflow under `.agents/skills/` that must not ship through the Codex plugin.
- **Plugin root**: the installed repository-root package containing `.codex-plugin/`, `skills/`, and `hooks/`.
- **Legacy CSL-owned link**: a symlink under `~/.agents/skills` that points into this package's canonical shared `skills/` tree.
- **Plugin-only migration**: Codex discovers shared CSL skills and hooks solely through the installed plugin.

## Knowledge Probe

- **Policy source**: injected Anvil startup policy and `/anvil:req` skill requirements.
- **Actual invocation**: checked `docs/anvil/knowledge/index.md` and searched `docs/anvil/knowledge` for `codex`, `plugin`, `skills`, `symlink`, `installer`, and `hooks`.
- **Candidate ranking**: zero candidates because `docs/anvil/knowledge/` is absent.
- **Active matches**: 0.
- **Draft clues**: 0.
- **Relevant conflicts**: 0.
- **Unrelated conflicts**: 0.
- **Decision**: continue.

## Functional Requirements

1. Installing the Codex integration installs one plugin that exposes all shared skills and lifecycle hooks.
2. The default and explicit Codex installation paths do not create symlinks under `~/.agents/skills`.
3. Upgrade installation removes only legacy CSL-owned links.
4. Hook commands resolve bundled scripts from the installed plugin root.
5. The project-local `integrate-third-skills` workflow is not bundled as a shared plugin skill.
6. Old saved installer selections containing removed targets resolve to valid current targets without crashing.
7. CLI help, dry-run, human-readable output, and JSON output describe the plugin-only behavior.

## Non-Functional Requirements

- Migration is idempotent.
- No new runtime dependency is added.
- The smallest existing Node.js and shell patterns are reused.
- User-owned filesystem entries are preserved.
- Plugin identity remains stable across reinstall.
- Package contents remain sufficient for installed skill scripts and hooks.

## Security Concerns

- The installer mutates a user home directory and Codex configuration; ownership checks are mandatory before deleting any link.
- The migration must not follow or remove arbitrary external symlink targets.
- No credentials, authentication policy, network access, or private data handling changes are in scope.

## Success Criteria

- Focused CLI tests cover plugin-only defaults, legacy selection handling, ownership-safe link cleanup, dry-run behavior, and absence of the removed target.
- Plugin validation or equivalent current-CLI validation confirms root-level skills and hooks are discoverable.
- The installed CSL plugin cache contains `skills/` and `hooks/` exactly once.
- No CSL-owned shared-skill symlinks remain under `~/.agents/skills` after live migration.
- A fresh Codex thread discovers CSL shared skills from the plugin namespace and hook commands resolve through the plugin root.
- Project checks, package dry-run, JSON validation, diff checks, scoped review, and required Yao audit pass.

## PR Review Concerns

- Trace every changed behavior to this spec, especially link ownership and project-local skill exclusion.
- Reject any cleanup that removes non-symlinks or external symlinks.
- Reject any remaining dual-source Codex discovery path.
- Check that hook commands work from plugin cache rather than only from the repository checkout.
- Check saved-selection backward compatibility and dry-run non-mutation.

## Open Questions

- None. The user accepted the recommended plugin-only migration and its stated boundaries.

## Code Status

- **Overall**: completed on 2026-07-17.
- **Functional requirements**:
  1. Done — the repository-root plugin exports shared skills and root lifecycle hooks.
  2. Done — `codex-plugin` is the sole default Codex target and creates no skill links.
  3. Done — post-install cleanup removes only links proven to target this package's `skills/` tree.
  4. Done — hook commands prefer `PLUGIN_ROOT`, then `CLAUDE_PLUGIN_ROOT`, with a development fallback.
  5. Done — `.agents/skills/integrate-third-skills` is absent from the package's shared skill export.
  6. Done — removed targets in saved selections are filtered and valid targets remain selected.
  7. Done — help, dry-run, human, verbose, and JSON output reflect plugin-only behavior.
- **Non-functional requirements**: all done — cleanup is idempotent, uses only the Node.js standard library, preserves regular and external entries, retains the stable plugin identity, and ships all root skills/hooks needed by the installed plugin.
- **Security concerns**: resolved — cleanup rejects a symlinked legacy parent, inspects each direct entry without following external targets, ignores only an `ENOENT` child race, and performs deletion only after plugin installation succeeds.
- **Success criteria**: met by 52 passing Node 22 checks, 27 recursively discovered shared skills, a 132-entry package dry-run, exact root hook execution tests, live plugin reinstall, empty legacy CSL link state, plugin catalog discovery, JSON/diff validation, scoped adversarial review, Yao audit, and Compound postflight validation.
