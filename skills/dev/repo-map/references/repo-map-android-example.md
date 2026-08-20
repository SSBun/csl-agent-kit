# Repo Map

## Component Summary

This component controls Android authentication entry: it turns login UI events into repository work, persists credentials, and switches navigation into the authenticated graph.

## Project Glossary

| Term | Kind | Meaning In This Project | Not The Same As | Source |
|---|---|---|---|---|
| Session | domain/code | Authenticated app state that controls navigation destinations. | Activity lifecycle, SavedStateHandle | `SessionState.kt`, `AppNavGraphTest.kt` |
| Credential | domain/code | Token material persisted outside Compose state. | Android account, session | `CredentialStore.kt` |
| Auth route | code | Navigation destination for auth screens. | API endpoint | `AppNavGraph.kt` |
| Login intent | domain/code | User action from the login screen that starts auth work. | Android Intent | `LoginViewModel.kt` |

## Working Map

### File Structure

| Path | Contains | Notes |
|---|---|---|
| `feature-auth/` | Login screen and view model | Converts UI events into auth work. |
| `core-network/` | Auth API and DTO mapping | Sends login requests and decodes responses. |
| `core-storage/` | Credential persistence | Stores token material outside Compose state. |
| `navigation/` | App navigation graph and route definitions | Selects signed-in or signed-out destinations. |
| `tests/` | ViewModel, repository, storage, and navigation tests | Documents auth behavior. |

### Modules

| Module | Location | Main Duties |
|---|---|---|
| Auth feature | `feature-auth/` | Own login screen state, validation, and submit actions. |
| Auth data | `core-network/` | Provide auth API calls and response mapping. |
| Storage | `core-storage/` | Save and restore credentials. |
| Navigation | `navigation/` | Select destinations from session state. |

### Key Types

| Type | Location | Main Duties | Main Collaborators |
|---|---|---|---|
| `LoginViewModel` | `feature-auth/LoginViewModel.kt` | Convert login UI events into auth state changes. | `AuthRepository` |
| `AuthRepository` | `feature-auth/AuthRepository.kt` | Coordinate API login and credential persistence. | `AuthApi`, `CredentialStore` |
| `CredentialStore` | `core-storage/CredentialStore.kt` | Persist token material outside ViewModel and Compose state. | encrypted storage |
| `SessionState` | `navigation/SessionState.kt` | Hold authenticated app state used by navigation. | nav graph, repository |
| `AppNavGraph` | `navigation/AppNavGraph.kt` | Select login or authenticated destinations. | `SessionState`, routes |

### Core Flows

```text
Login button
  -> LoginViewModel.onSubmit()
  -> AuthRepository.login()
  -> CredentialStore.save()
  -> SessionState becomes authenticated
  -> AppNavGraph navigates to authenticated destination
```

```text
Process restart
  -> credential restore
  -> SessionState resolves initial auth mode
  -> AppNavGraph chooses start destination
```
