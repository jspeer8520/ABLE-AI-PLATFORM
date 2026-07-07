//
//  MessageRepository.swift
//  ABLEInbox
//
//  Data-access abstraction for inbox messages.
//
//  `MessageRepository` is the protocol the view model depends on. Two
//  implementations are provided:
//
//    • MockMessageRepository  – hardcoded data, used for Sprint 3 UI work and
//                               unit tests. Currently the active implementation.
//    • RemoteMessageRepository – real URLSession client + Core Data cache.
//                               Ready to swap in once the backend
//                               `GET /api/messages` route ships.
//
//  Swapping is a one-line change in the composition root
//  (see `NavigationCoordinator`): replace `MockMessageRepository()` with
//  `RemoteMessageRepository(...)`.
//

import Foundation

// MARK: - Errors

/// Errors surfaced by a repository, mapped to user-facing copy by the view model.
enum RepositoryError: LocalizedError, Equatable, Sendable {
    case offline
    case server(status: Int)
    case decoding
    case cache(String)
    case unknown

    var errorDescription: String? {
        switch self {
        case .offline:
            return "You're offline. Showing cached messages."
        case .server(let status):
            return "The server returned an error (\(status)). Please try again."
        case .decoding:
            return "We couldn't read the inbox response. Please try again."
        case .cache(let detail):
            return "Local storage error: \(detail)"
        case .unknown:
            return "Something went wrong. Please try again."
        }
    }
}

// MARK: - Fetch result

/// The outcome of a fetch, distinguishing live network data from a graceful
/// fallback to the offline cache so the UI can show an "offline" banner.
struct FetchResult: Sendable {
    enum Origin: Sendable { case network, cache }
    let messages: [Message]
    let origin: Origin
}

// MARK: - Protocol

/// Abstraction over inbox data access. All methods are `async` and may throw
/// `RepositoryError`. Conformers must be safe to call from the main actor.
protocol MessageRepository: Sendable {
    /// Fetch the current inbox.
    /// - Parameter forceRefresh: when `true`, bypasses any short-lived in-memory
    ///   cache and hits the source of truth (network for the remote impl).
    func fetchMessages(forceRefresh: Bool) async throws -> FetchResult

    /// Persist a read/unread change.
    func setRead(id: String, isRead: Bool) async throws

    /// Archive a message.
    func archive(id: String) async throws
}

extension MessageRepository {
    func fetchMessages() async throws -> FetchResult {
        try await fetchMessages(forceRefresh: false)
    }
}

// MARK: - Mock implementation

/// In-memory repository returning hardcoded messages. Backing store is an
/// `actor` so concurrent read/mutate calls from the UI are data-race free.
final class MockMessageRepository: MessageRepository {

    /// Simulated latency and failure injection for exercising loading / error
    /// states during development and tests.
    struct Behavior: Sendable {
        var artificialDelay: Duration = .zero
        var failNextFetch: RepositoryError? = nil
        var forceOffline: Bool = false
        static let immediate = Behavior()
    }

    private let store: Store
    private let behavior: Behavior

    init(seed: [Message] = MockMessageRepository.sampleMessages,
         behavior: Behavior = .immediate) {
        self.store = Store(messages: seed)
        self.behavior = behavior
    }

    func fetchMessages(forceRefresh: Bool) async throws -> FetchResult {
        if behavior.artificialDelay > .zero {
            try? await Task.sleep(for: behavior.artificialDelay)
        }
        if let failure = behavior.failNextFetch {
            throw failure
        }
        let messages = await store.all()
        return FetchResult(
            messages: messages,
            origin: behavior.forceOffline ? .cache : .network
        )
    }

    func setRead(id: String, isRead: Bool) async throws {
        await store.setRead(id: id, isRead: isRead)
    }

    func archive(id: String) async throws {
        await store.archive(id: id)
    }

    /// Serializes access to the mutable message list.
    private actor Store {
        private var messages: [Message]
        init(messages: [Message]) { self.messages = messages }

        func all() -> [Message] { messages }

        func setRead(id: String, isRead: Bool) {
            guard let i = messages.firstIndex(where: { $0.id == id }) else { return }
            messages[i].isRead = isRead
        }

        func archive(id: String) {
            guard let i = messages.firstIndex(where: { $0.id == id }) else { return }
            messages[i].isArchived = true
        }
    }
}

// MARK: - Sample data

extension MockMessageRepository {
    /// Deterministic sample inbox spanning every source and both read states.
    /// Timestamps are anchored to a fixed reference date so snapshots and tests
    /// are stable.
    static let sampleMessages: [Message] = {
        let reference = Date(timeIntervalSince1970: 1_720_000_000) // 2024-07-03
        func ago(_ minutes: Int) -> Date { reference.addingTimeInterval(-Double(minutes) * 60) }

        return [
            Message(
                id: "msg-001",
                source: .gmail,
                sender: "Dr. Amara Okafor",
                senderEmail: "amara.okafor@clinic.example",
                subject: "Lab results ready for review",
                preview: "Hi, your latest panel came back within normal range. Let's schedule a follow-up.",
                timestamp: ago(12),
                isRead: false
            ),
            Message(
                id: "msg-002",
                source: .slack,
                sender: "#sprint-3-inbox",
                subject: "Casey mentioned you",
                preview: "@you can you review the iOS inbox PR before standup?",
                timestamp: ago(35),
                isRead: false
            ),
            Message(
                id: "msg-003",
                source: .outlook,
                sender: "Billing — ABLE AI",
                senderEmail: "billing@able.example",
                subject: "Invoice #2041 paid",
                preview: "Thanks! Your payment of $49.00 was received. No action needed.",
                timestamp: ago(90),
                isRead: true
            ),
            Message(
                id: "msg-004",
                source: .teams,
                sender: "Platform Standup",
                subject: "Meeting notes — July 3",
                preview: "Backend messages endpoint targeted for Friday. iOS + Android UI in parallel.",
                timestamp: ago(180),
                isRead: true
            ),
            Message(
                id: "msg-005",
                source: .gmail,
                sender: "GitHub",
                senderEmail: "notifications@github.example",
                subject: "[ABLE-AI-PLATFORM] CI passed on main",
                preview: "All checks have passed for commit 2890c35.",
                timestamp: ago(240),
                isRead: false
            ),
            Message(
                id: "msg-006",
                source: .slack,
                sender: "#design-system",
                subject: "New accessibility tokens",
                preview: "Dynamic Type ramps updated. Please re-test VoiceOver on the inbox list.",
                timestamp: ago(320),
                isRead: true
            ),
            Message(
                id: "msg-007",
                source: .outlook,
                sender: "Jordan Lee",
                senderEmail: "jordan.lee@partner.example",
                subject: "Re: Integration timeline",
                preview: "Sounds good — we'll swap the mock client once the endpoint is live.",
                timestamp: ago(500),
                isRead: false
            ),
            Message(
                id: "msg-008",
                source: .teams,
                sender: "Security Bot",
                subject: "No secrets detected in latest push",
                preview: "Scan complete. 0 findings. .env files correctly ignored.",
                timestamp: ago(720),
                isRead: true
            )
        ]
    }()
}
