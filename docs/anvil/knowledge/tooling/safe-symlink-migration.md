---
title: "Safe migration of owned legacy skill symlinks"
kind: pattern
status: active
priority: normal
confidence: high
modules:
  - "Codex plugin installer"
tags:
  - "migration"
  - "symlink-safety"
applies_to:
  - "Replacing per-skill symlink installs with a package or plugin install"
evidence:
  - type: code
    ref: "bin/csl-agent-kit.js"
  - type: test
    ref: "tests/cli-install-output.test.js"
  - type: requirement
    ref: "docs/anvil/brainstorms/2026-07-17-codex-plugin-migration.md"
  - type: plan
    ref: "docs/anvil/plans/2026-07-17-codex-plugin-migration-plan.md"
last_verified: "2026-07-17"
related: []
---

## 结论

When replacing a per-skill symlink installation with a package or plugin, remove only legacy symlinks that are provably owned by the package, and only after the replacement installation succeeds.

## 为什么

A shared skills directory can contain regular files, third-party links, and broken links. Treating its contents as wholly owned risks deleting user data, while cleaning before replacement installation can leave the user with neither installation.

## 当前证据

`bin/csl-agent-kit.js` scans direct legacy entries without traversing a symlinked parent, classifies ownership from lexical and canonical targets beneath this repository's `skills/` tree, and runs cleanup after plugin installation. `tests/cli-install-output.test.js` verifies owned, external, broken, dry-run, idempotent, parent-symlink, and install-failure cases.

## 适用范围

This pattern applies to the CSL Agent Kit Codex installer and to similar migrations from individually linked skills into one plugin or package.

## 边界与反例

Do not remove regular files, directories, or symlinks targeting another source. A broken symlink is removable only when its stored target still proves package ownership. If ownership cannot be established, preserve the entry for manual review.

## 相关知识

无。
