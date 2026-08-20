---
name: repo-map
description: Build a lightweight map and project glossary before exploring an unknown repository or unfamiliar module. Use for quick orientation, entry-point discovery, broad code exploration, feature work in a new codebase, or shared vocabulary for key concepts, types, responsibilities, and call relationships. Do not use for a durable systematic project or component report. Use CodeGraph when available.
---

# Repo Map

Build a compact, objective structure map and shared glossary before editing or deep-diving. This is quick orientation work, not a durable systematic analysis, full audit, or recommendation document.

## Output Contract

Respond in chat unless the user asks for a file. If saving, write `docs/analysis/repo-map.md` in the target repo.

Include:

- Component summary: 1-3 sentences about what the scoped component does.
- Project glossary: 8-20 repo-specific domain/code terms, with source paths.
- Working map: file structure, modules, key types, and core data/control flows.

Exclude subjective opinions, risks, recommendations, confidence ratings, open questions, and audit findings.

## Workflow

1. Resolve git roots first. If the working folder contains multiple child repos, map them separately.
2. Define scope from the user's feature, bug, file, symbol, or module. Do not read every file by default.
3. Inventory manifests, READMEs, tests, entry points, and domain-heavy filenames with `rg --files`.
4. Use CodeGraph when available for callers, callees, impact, and symbol lookup. Confirm important conclusions by reading files.
5. Identify boundary types: app roots, controllers, services, stores, reducers, models, protocols, dependency containers, API clients, persistence layers, and coordinators.
6. Build a small glossary from project usage, marking inferred terms explicitly.
7. Trace relationships from entry points to domain logic and persistence/API/UI boundaries.
8. Stop once the map is useful for the next task.

## References

Read `references/repo-map-workflow.md` for detailed root detection, CodeGraph, glossary, and relationship tracing rules.

Choose the closest format guide:

- `references/repo-map-web-example.md` - web frontend.
- `references/repo-map-backend-example.md` - backend service or worker.
- `references/repo-map-apple-example.md` - iOS, macOS, SwiftUI, UIKit, AppKit, XCTest.
- `references/repo-map-android-example.md` - Android, Gradle, Kotlin, Java, Compose, XML layouts.

## Rules

- Use this before broad exploration of an unknown repo or unfamiliar module.
- Keep the map small enough to guide action.
- Include concrete file/module paths when they clarify responsibility.
- Favor file/type names over architecture labels.
- Do not modify source files unless the user explicitly asks for implementation.
- If the map reveals a matching SOP or skill, mention it before continuing.
