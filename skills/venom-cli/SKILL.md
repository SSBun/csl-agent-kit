---
name: venom-cli
description: Use when the user mentions Zhihu iOS development, venom-cli, component dependency management, or asks to build/check/make/switch/integrate components in a Zhihu project. Use when user wants to integrate other components to local or make the projects.
argument-hint: [project-path]
---

## Setup

venom-cli is installed globally via npm:

```bash
npm install --global @ssbun/venom-cli
```

Invoke as `venom-cli` directly.

## Project Path

The CLI accepts `-p, --project <path>` option to specify project directory. **Ask user for the root project path** if not obvious from context. Always pass `-p <path>` explicitly.

## Command Discovery

**Run `--help` to explore commands and options.** venom-cli uses nested subcommands — use `--help` at each level to discover available subcommands, options, and flags.

```bash
venom-cli --help                          # top-level commands
venom-cli <command> --help                # subcommand options
venom-cli <command> <subcommand> --help   # nested subcommand details
```

## Key Commands

- **`doctor`** — Check environment (Ruby, Bundler, CocoaPods, Git, Xcode). Use `--fix` to auto-repair.
- **`devices`** — List simulators/devices. Run before `build` to pick target.
- **`build`** — Compile project. Prefer for incremental compilation (see Build Performance Tips).
- **`make`** — Regenerate Podfile + pod install using binary caches. Triggers full recompile.
- **`make-source`** — Same as `make` but from source (no cache). Slower, allows source-level debugging.
- **`integrate list/switch/clone/remove/status`** — Component dependency management.
- **`gen-asset-code`** — Generate Swift/ObjC resource access code for component.
- **`config get/set/list`** — Manage venom-cli configuration.

## Typical Workflows

- **Prefer `build` for compilation checks.** `make` and `make-source` clean all caches and trigger a full recompile, making subsequent `build` very slow.
- **Only use `make` / `make-source` when structural changes require it:**
  - Files added or deleted in the project
  - Podspec dependency changes (new/removed pods, version bumps)
  - After running `gen-asset-code` to integrate new assets
- **For all other cases** (code edits, bug fixes, refactoring), run `build` directly. It compiles incrementally and is significantly faster.

## Safety Rules

- **Confirm before any write operation:** make, make-source, build, integrate switch, integrate clone --integrate, integrate remove, config set
- **Read operations** (doctor, devices, integrate list, integrate status, config list/get, gen-asset-code) are safe to run without confirmation
- When running make/make-source, warn that it triggers pod install which modifies Podfile.lock and Pods directory
