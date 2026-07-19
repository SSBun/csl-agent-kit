# Repo Map Workflow

Use this reference to keep repo maps consistent without loading every detail into the skill entrypoint.

## Resolve Project Roots

1. Run `git rev-parse --show-toplevel` from the working folder.
2. If it succeeds, treat that git root as the project root unless the user scoped a child module.
3. If it fails, check immediate child folders for git repositories with a command such as `find . -maxdepth 2 -type d -name .git -prune`.
4. If child git repositories exist, map each repository separately or ask which repo to focus on when there are too many.
5. If neither the root nor child folders are git repositories, treat the working folder as one loose project and say that no git root was found.

## Define Scope

- If the user named a feature, bug, file, symbol, or module, map that area first.
- If the task is generic, map app/library entry points and top-level domain modules.
- Do not read every file by default.

## Inventory

Use `rg --files`, manifests, README, build files, and test directories.

Identify the project kind before choosing the output format:

- `web`: React, Vue, Svelte, Next.js, SPA, browser UI.
- `backend`: API server, worker, persistence-heavy service, backend package.
- `apple`: `.xcodeproj`, `.xcworkspace`, Swift app targets, SwiftUI, UIKit, AppKit, XCTest.
- `android`: Android Gradle plugins, `AndroidManifest.xml`, Kotlin/Java Android code, Compose, XML layouts.

Collect repeated domain words from directory names, type names, API routes, UI labels, tests, fixtures, docs, and config.

## CodeGraph

- Check availability with `command -v codegraph`.
- Run CodeGraph per project root, not once for a parent folder containing unrelated repos.
- If `.codegraph/` exists, run `codegraph sync <project-root>` or `codegraph status <project-root>`.
- If CodeGraph is installed but not initialized and indexing is reasonable, run `codegraph init <project-root>`.
- Use `codegraph files`, `codegraph query`, `codegraph callers`, `codegraph callees`, and `codegraph impact`.
- Do not run `codegraph uninit` unless the user explicitly asks.
- Treat CodeGraph output as navigation aid, not proof.

## Key Types

Prefer types that sit on boundaries:

- App roots, controllers, services, stores, reducers, models.
- Protocols/interfaces, dependency containers, API clients.
- Persistence layers, coordinators, jobs, commands, event handlers.

For each key type, identify main duty, collaborators, owned state/data, external effects, and tests or fixtures that describe expected behavior.

## Glossary

Define terms from how the project uses them. Tie each entry to evidence such as a file path, type, route, test, fixture, or README section.

Include confusing pairs when present: account/user, project/workspace, task/job, session/run, model/entity, client/server, local/remote, draft/published.

Mark `Unknown` when evidence is insufficient instead of guessing.

## Relationship Tracing

- Start from entry points and follow calls to domain logic.
- For a named task, trace from the user-facing action or failing symbol toward business logic and persistence/API boundaries.
- Use CodeGraph when possible; otherwise use `rg` for type names and method names.

## Stop Condition

Stop when you can define the component summary, relevant vocabulary, file structure, modules, key type duties, and main objective flows.

Do not turn this into `analyze-project`; use that skill only for a durable develop map or source-driven learning guide written under `docs/analysis/`.
