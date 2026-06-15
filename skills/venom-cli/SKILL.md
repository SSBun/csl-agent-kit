---
name: venom-cli
description: Manages Zhihu iOS component dependencies and builds via venom-cli. Use when the user mentions Zhihu iOS development, venom-cli, component dependency management, or asks to build/check/make/switch/integrate components in a Zhihu project.
argument-hint: [project-path]
---

## Preflight

Before running venom-cli commands, verify the binary is on PATH:

```bash
command -v venom-cli && venom-cli --version
```

If missing, ask the user before installing globally. Explain that this installs the `venom-cli` executable on their system via npm:

```bash
npm install --global @ssbun/venom-cli
```

If the user declines installation, stop. Do not run build/make/integrate commands until preflight passes.

## Setup

venom-cli is installed globally via npm only after explicit user approval:

```bash
npm install --global @ssbun/venom-cli
```

Invoke as `venom-cli` directly.

## Project Path

The CLI accepts `-p, --project <path>` option to specify project directory.

**Check pre-configured projects first** — venom-cli stores project paths in config:

```bash
venom-cli config list
```

If a project is listed in config, use its path. Otherwise ask user for root project path. Always pass `-p <path>` explicitly.

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
- **`build`** — Incremental compile. Fast. Use for checking build errors after code edits. Supports `--scheme`, `--run`, `--debug`, `--verbose`.
- **`make`** — Regenerate Podfile + pod install using binary caches. Full recompile.
- **`make-source`** — Same as `make` but from source (no cache). Full recompile, slower.
- **`integrate list/switch/clone/remove/status`** — Component dependency management.
- **`gen-asset-code`** — Generate Swift/ObjC resource access code for component.
- **`config get/set/list`** — Manage venom-cli configuration.

## Build Decision Guide

### Use `build` for checking compilation errors

`build` compiles incrementally — fast. Use for all normal code changes (edits, bug fixes, refactoring).

```bash
venom-cli -p <project-path> build --scheme <scheme-name>
```

### Use `make` or `make-source` when you add/delete files or change dependencies

`make`/`make-source` clean all caches and regenerate Podfile from scratch, triggering full recompile. Required when structure changes:

- **Files added or deleted** in project or component
- **Podspec dependency changes** (new/removed pods, version bumps)
- **After `gen-asset-code`** to integrate new resources/strings

```bash
venom-cli -p <project-path> make
# or
venom-cli -p <project-path> make-source
```

**Only run `make`/`make-source` when needed.** Running them unnecessarily slows subsequent `build` since caches are cold. If no files added/deleted and no dependency changes, just `build`.

## Safety Rules

- **Confirm before any write operation:** make, make-source, build, integrate switch, integrate clone --integrate, integrate remove, config set, gen-asset-code
- **Read operations** (doctor, devices, integrate list, integrate status, config list/get) are safe to run without confirmation
- When running make/make-source, warn that it triggers pod install which modifies Podfile.lock and Pods directory
- Before running gen-asset-code, warn that it may generate Swift/ObjC resource access files
