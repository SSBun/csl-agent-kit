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

## Command Reference

### doctor — Check environment

```bash
venom-cli -p <project-path> doctor
venom-cli -p <project-path> doctor --fix   # attempt auto-fix
```

Check Venom environment state and all dependencies (Ruby, Bundler, CocoaPods, Git, Xcode, project structure). Use `--fix` to attempt auto-repair of missing Podfile.lock or Pods directory.

### devices — List devices and simulators

```bash
venom-cli -p <project-path> devices
venom-cli -p <project-path> devices --format json
```

List connected physical devices and available simulators. Useful before running `build` to pick a target.

### build — Build Xcode project

```bash
venom-cli -p <project-path> build --scheme <scheme-name>
venom-cli -p <project-path> build --scheme <scheme-name> --verbose
```

Build Xcode project for a connected device or simulator. Use `devices` first to verify target. Requires scheme name. Option `--verbose` for full build output.

### make — Build with binary pods

```bash
venom-cli -p <project-path> make
```

Run `make all_binary` — generate Podfile and run pod install using binary caches. Standard build flow.

### make-source — Build from source

```bash
venom-cli -p <project-path> make-source
```

Run `make all_source` — generate Podfile and run pod install from source (no binary cache). Slower but allows source-level debugging.

### integrate — Component management

**List components:**

```bash
venom-cli -p <project-path> integrate list
venom-cli -p <project-path> integrate list --format json
venom-cli -p <project-path> integrate list --filter <text>
```

List all components with full state. Supports table/json output and text filtering.

**Switch pod source:**

```bash
venom-cli -p <project-path> integrate switch <pod-name> --local <path>
venom-cli -p <project-path> integrate switch <pod-name> --binary
venom-cli -p <project-path> integrate switch <pod-name> --source
venom-cli -p <project-path> integrate switch <pod-name> --branch <branch>
venom-cli -p <project-path> integrate switch <pod-name> --tag <tag>
venom-cli -p <project-path> integrate switch <pod-name> --commit <hash>
```

Change a pod's source in customization.yml. Options are mutually exclusive.

**Clone component:**

```bash
venom-cli -p <project-path> integrate clone <pod-name>
venom-cli -p <project-path> integrate clone <pod-name> --integrate  # also add to customization.yml
```

Clone a component repo to local component folder.

**Remove component:**

```bash
venom-cli -p <project-path> integrate remove <pod-name>
```

Remove a component from customization.yml.

**Show status:**

```bash
venom-cli -p <project-path> integrate status
venom-cli -p <project-path> integrate status --format json
```

Show component state and git status for locally-developed pods.

### gen-asset-code — Generate asset access code

```bash
venom-cli -p <project-path> gen-asset-code --path <component-path>
venom-cli -p <project-path> gen-asset-code --path <component-path> --type resource
venom-cli -p <project-path> gen-asset-code --path <component-path> --type string
venom-cli -p <project-path> gen-asset-code --path <component-path> --type all
```

Generate Swift/ObjC resource access code (images, strings) for a component.

### config — Configuration management

```bash
venom-cli -p <project-path> config list
venom-cli -p <project-path> config get <key>
venom-cli -p <project-path> config set <key> <value>
```

Manage venom-cli configuration values.

## Typical Workflows

### Diagnose build issues

```bash
venom-cli -p <project-path> doctor
venom-cli -p <project-path> integrate status
```

Run doctor to check environment, then status to see component state.

### Switch component to local for development

```bash
venom-cli -p <project-path> integrate switch <pod-name> --local /path/to/component
venom-cli -p <project-path> make-source
```

Switch to local source, then rebuild from source.

### Integrate a new component

```bash
venom-cli -p <project-path> integrate clone <pod-name> --integrate
venom-cli -p <project-path> make-source
```

Clone and register a component, then rebuild.

### Revert to binary

```bash
venom-cli -p <project-path> integrate switch <pod-name> --binary
venom-cli -p <project-path> make
```

### Build project on device/simulator

```bash
venom-cli -p <project-path> devices
venom-cli -p <project-path> build --scheme <scheme-name>
```

List available targets, then build for the active device/simulator.

### Generate asset code for a component

```bash
venom-cli -p <project-path> gen-asset-code --path <component-path> --type all
```

## Safety Rules

- **Confirm before any write operation:** make, make-source, build, integrate switch, integrate clone --integrate, integrate remove, config set
- **Read operations** (doctor, devices, integrate list, integrate status, config list/get, gen-asset-code) are safe to run without confirmation
- When running make/make-source, warn that it triggers pod install which modifies Podfile.lock and Pods directory
