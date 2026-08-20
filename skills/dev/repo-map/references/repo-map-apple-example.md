# Repo Map

## Component Summary

This component controls the authenticated app shell: it restores credentials, chooses the signed-in or signed-out root flow, and passes login state into feature navigation.

## Project Glossary

| Term | Kind | Meaning In This Project | Not The Same As | Source |
|---|---|---|---|---|
| Session | domain/code | Authenticated app state that chooses signed-in vs signed-out UI. | `URLSession`, scene session | `SessionState.swift`, `RootCoordinatorTests.swift` |
| Credential | domain/code | Token material persisted outside view state. | Account, session | `CredentialStore.swift` |
| App route | code | Internal navigation destination owned by the coordinator. | Deep link URL, API endpoint | `AppRoute.swift` |
| Login flow | domain/code | Coordinated screens and async actions that move the app into a signed-in session. | Login view only | `LoginFlow.swift`, `LoginViewModelTests.swift` |

## Working Map

### File Structure

| Path | Contains | Notes |
|---|---|---|
| `AppCore/` | App container, root coordinator, route definitions | Creates shared dependencies and root navigation. |
| `AuthFeature/` | Login UI and login view model | Converts login screen actions into auth work. |
| `CoreNetworking/` | API client and endpoint definitions | Sends auth requests and decodes responses. |
| `Persistence/` | Credential store and Keychain wrapper | Stores token material outside view state. |
| `Tests/Auth/` | Auth service and login view model tests | Documents login state transitions. |

### Modules

| Module | Location | Main Duties |
|---|---|---|
| Auth feature | `AuthFeature/` | Own login UI state, form validation, login submission, and auth result handling. |
| App core | `AppCore/` | Build dependencies, hold session state, and select the root route tree. |
| Networking | `CoreNetworking/` | Convert service requests into decoded backend responses. |
| Persistence | `Persistence/` | Save and restore credentials. |

### Key Types

| Type | Location | Main Duties | Main Collaborators |
|---|---|---|---|
| `RootCoordinator` | `AppCore/RootCoordinator.swift` | Select signed-in or signed-out root UI. | `SessionState`, `AppRoute` |
| `SessionState` | `AppCore/SessionState.swift` | Store and publish authenticated app state. | root coordinator, feature gates |
| `LoginViewModel` | `AuthFeature/LoginViewModel.swift` | Translate login form events into auth service calls and screen state. | `AuthService`, `SessionState` |
| `AuthService` | `AuthFeature/AuthService.swift` | Request backend auth and convert successful responses into session credentials. | `APIClient`, `CredentialStore` |
| `CredentialStore` | `Persistence/CredentialStore.swift` | Save, load, and clear credential material. | Keychain wrapper |

### Core Flows

```text
Login button
  -> LoginViewModel.submit()
  -> AuthService.login()
  -> CredentialStore.save()
  -> SessionState.signIn()
  -> RootCoordinator selects signed-in tree
```

```text
App launch
  -> AppContainer builds stores/services
  -> CredentialStore attempts restore
  -> SessionState resolves initial auth mode
  -> RootCoordinator chooses initial route tree
```
