# ABLE iOS — Inbox (Sprint 3)

Native SwiftUI implementation of the unified inbox. MVVM, async/await, Core Data
offline cache. Ships with a **mock repository** (hardcoded data); swap to the
real URLSession client when the backend `GET /api/messages` endpoint is live.

## Layout

```
apps/mobile/ios/
├── Package.swift                       # SPM: ABLEInbox library + test target (iOS 17+)
├── ABLEInbox/
│   ├── App/ABLEInboxApp.swift          # @main entry + composition root wiring
│   ├── Models/Message.swift            # Codable domain model + API envelope
│   ├── Repository/
│   │   ├── MessageRepository.swift     # protocol + MockMessageRepository (active)
│   │   └── RemoteMessageRepository.swift # real URLSession client + cache write-through
│   ├── ViewModels/InboxViewModel.swift # @MainActor MVVM state
│   ├── Views/
│   │   ├── InboxScreen.swift           # main List screen (all features wired)
│   │   ├── MessageListItem.swift       # row cell
│   │   ├── SearchBar.swift             # inline search field
│   │   └── FilterMenu.swift            # source filter sheet
│   ├── Data/MessageDatabase.swift      # Core Data cache (in-code model)
│   └── Navigation/NavigationCoordinator.swift # nav stack + DI factory
└── ABLEInboxTests/
    ├── InboxViewModelTests.swift       # view model unit tests (fake repo)
    └── MessageRepositoryTests.swift    # API-contract integration (stubbed URLProtocol) + Core Data
```

## API contract (shared with Android)

```
GET http://localhost:4000/api/messages
{ "messages": [ Message, ... ], "total": 100 }
```

Decoding is tolerant: unknown `source` → `.unknown`, missing `isRead`/`isArchived`
→ `false`, ISO-8601 with/without fractional seconds and epoch seconds all accepted.

## Features

List · pull-to-refresh · tap to toggle read/unread · swipe to archive (and
leading swipe to toggle read) · search · filter by source · offline Core Data
cache with graceful fallback + banner · loading spinner · error alerts ·
native iOS styling · full VoiceOver labelling.

## Backend integration (Sprint 4)

One-line swap. In `ABLEInboxApp.swift`:

```swift
// Sprint 3 (current):
@StateObject private var coordinator = NavigationCoordinator.makeMock()

// Sprint 4 (backend live):
@StateObject private var coordinator = NavigationCoordinator.makeLive()
//                                     └─ RemoteMessageRepository + MessageDatabase.shared
```

`makeLive()` defaults to `http://localhost:4000`. No other code changes needed —
`RemoteMessageRepository` already implements the full `MessageRepository`
protocol the UI depends on.

## Tests

```bash
# Requires macOS + Xcode (SwiftUI / Core Data / XCTest for iOS)
xcodebuild test -scheme ABLEInbox -destination 'platform=iOS Simulator,name=iPhone 15'
# or, once added to the Xcode workspace, ⌘U
```

`MessageRepositoryTests` exercises the real `RemoteMessageRepository` through a
stubbed `URLProtocol`, so the live client path is covered today; when the
backend ships, only the stub is removed.

> **Note:** these targets build and run on **macOS with Xcode** only — SwiftUI,
> Core Data (iOS store types), and the iOS XCTest host are unavailable in the
> Linux CI container, so the tests cannot be executed from this environment.
