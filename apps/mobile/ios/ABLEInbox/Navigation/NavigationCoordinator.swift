//
//  NavigationCoordinator.swift
//  ABLEInbox
//
//  App-level navigation state and composition root. Owns the navigation stack
//  and is the single place where concrete dependencies (repository, cache) are
//  chosen — swapping the mock for the real client is a one-line change here.
//

import SwiftUI

/// Destinations reachable from the inbox. Extend as Sprint 4+ adds screens.
enum Route: Hashable {
    case messageDetail(Message)
}

/// Observable navigation + dependency container injected into the view tree.
@MainActor
final class NavigationCoordinator: ObservableObject {

    /// The current NavigationStack path.
    @Published var path = NavigationPath()

    /// The repository backing the inbox. Injected so previews/tests can supply
    /// a mock and production can supply the real client.
    let messageRepository: MessageRepository

    init(messageRepository: MessageRepository) {
        self.messageRepository = messageRepository
    }

    // MARK: - Factory (composition root)

    /// Sprint 3 configuration — hardcoded mock data, no backend dependency.
    static func makeMock() -> NavigationCoordinator {
        NavigationCoordinator(messageRepository: MockMessageRepository())
    }

    /// Sprint 4 configuration — real URLSession client + Core Data cache.
    ///
    /// To integrate with the backend, use this instead of `makeMock()` in
    /// `ABLEInboxApp`:
    ///
    ///     @StateObject private var coordinator = NavigationCoordinator.makeLive()
    ///
    static func makeLive(
        baseURL: URL = URL(string: "http://localhost:4000")!
    ) -> NavigationCoordinator {
        let repository = RemoteMessageRepository(
            baseURL: baseURL,
            session: .shared,
            cache: MessageDatabase.shared
        )
        return NavigationCoordinator(messageRepository: repository)
    }

    // MARK: - Navigation intents

    func open(_ route: Route) { path.append(route) }
    func pop() { if !path.isEmpty { path.removeLast() } }
    func popToRoot() { path = NavigationPath() }

    /// Builds a view model wired to this coordinator's repository.
    func makeInboxViewModel() -> InboxViewModel {
        InboxViewModel(repository: messageRepository)
    }
}
