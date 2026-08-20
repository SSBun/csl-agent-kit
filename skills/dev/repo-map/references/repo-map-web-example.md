# Repo Map

## Component Summary

This component controls workspace-scoped project editing in the browser: it gates routes by session, selects the active workspace, and promotes draft project changes into published versions.

## Project Glossary

| Term | Kind | Meaning In This Project | Not The Same As | Source |
|---|---|---|---|---|
| Workspace | domain | The collaboration boundary that determines which projects, members, and permissions are visible. | Project, Account | `workspace/Workspace.ts`, `workspace-access.test.ts` |
| Session | domain/code | The authenticated browser state used to decide whether guarded routes can render. | Server session, analytics session | `auth/SessionStore.ts`, `AuthProvider.test.tsx` |
| Guarded route | code | A route that depends on session and workspace membership before rendering. | Feature flag, API auth | `router/guards.tsx`, `AuthProvider.tsx` |
| Draft state | domain | Client-visible edit state that has not been persisted as a published project version. | Unsaved form input, cache | `project/DraftStore.ts`, `publish-flow.test.tsx` |

## Working Map

### File Structure

| Path | Contains | Notes |
|---|---|---|
| `auth/` | Session store and auth provider | Resolves signed-in browser state. |
| `router/` | Route guards and route tree | Applies session/workspace checks before rendering pages. |
| `workspace/` | Workspace context and membership checks | Selects active workspace and visible resources. |
| `project/draft/` | Draft store and editor state | Holds editable project changes before publish. |
| `project/publish/` | Publish service and cache updates | Promotes draft state into published project data. |

### Modules

| Module | Location | Main Duties |
|---|---|---|
| Auth | `auth/` | Resolve session and expose auth state to routes and UI. |
| Workspace | `workspace/` | Determine current workspace, membership, and workspace-scoped data visibility. |
| Draft editing | `project/draft/` | Store project edits before publish. |
| Publishing | `project/publish/` | Submit draft snapshots and refresh published project state. |

### Key Types

| Type | Location | Main Duties | Main Collaborators |
|---|---|---|---|
| `SessionStore` | `auth/SessionStore.ts` | Store authenticated browser state. | `AuthProvider`, route guards |
| `WorkspaceContext` | `workspace/WorkspaceContext.tsx` | Hold active workspace and membership data. | `ProjectList`, permission gates |
| `DraftStore` | `project/draft/DraftStore.ts` | Hold editable project state before publish. | editor shell, publish service |
| `PublishService` | `project/publish/PublishService.ts` | Submit draft state and refresh published project data. | `DraftStore`, API client |
| `GuardedRoute` | `router/guards.tsx` | Check session and workspace access before rendering children. | `SessionStore`, `WorkspaceContext` |

### Core Flows

```text
Open protected page
  -> SessionStore resolves user
  -> WorkspaceContext selects active workspace
  -> route guard checks membership
  -> screen renders workspace-scoped data
```

```text
Edit project
  -> DraftStore records local change
  -> validation marks draft publishable
  -> PublishService sends draft snapshot
  -> published project view refreshes
```
