//
//  InboxViewModel.swift
//  ABLEInbox
//
//  MVVM view model for the inbox screen. Owns all inbox state, exposes it via
//  `@Published` for reactive SwiftUI binding, and delegates data access to a
//  `MessageRepository`. Pure UI-state logic lives here (search, filtering,
//  read/archive optimistic updates, error mapping) so it is unit-testable
//  without any SwiftUI.
//
//  Marked `@MainActor`: all published state mutates on the main actor, so the
//  UI never observes a torn update. Repository calls are `await`-ed and hop
//  back to the main actor automatically.
//

import Foundation
import Combine

@MainActor
final class InboxViewModel: ObservableObject {

    // MARK: - Load state

    enum LoadState: Equatable {
        case idle
        case loading
        case loaded
        case empty
        case failed(String)
    }

    // MARK: - Published state

    /// Full, unfiltered set of non-archived messages (source of truth for the UI).
    @Published private(set) var messages: [Message] = []
    @Published private(set) var state: LoadState = .idle
    /// True when the displayed data came from the offline cache, not the network.
    @Published private(set) var isShowingCachedData = false
    /// Transient error surfaced as an alert; setting to non-nil presents it.
    @Published var activeError: InboxError?

    /// User-entered search text (two-way bound to the search field).
    @Published var searchText: String = ""
    /// Currently-selected source filters. Empty ⇒ show all sources.
    @Published var activeFilters: Set<MessageSource> = []

    // MARK: - Derived state

    /// Messages after applying search + source filters, newest first.
    var visibleMessages: [Message] {
        messages
            .filter { !$0.isArchived }
            .filter { activeFilters.isEmpty || activeFilters.contains($0.source) }
            .filter { $0.matches(query: searchText) }
            .sorted { $0.timestamp > $1.timestamp }
    }

    var unreadCount: Int {
        visibleMessages.filter { !$0.isRead }.count
    }

    var isFiltering: Bool {
        !activeFilters.isEmpty || !searchText.trimmingCharacters(in: .whitespaces).isEmpty
    }

    // MARK: - Dependencies

    private let repository: MessageRepository

    init(repository: MessageRepository) {
        self.repository = repository
    }

    // MARK: - Intents

    /// Initial load. No-ops if already populated (call `refresh()` to force).
    func loadIfNeeded() async {
        guard messages.isEmpty, state != .loading else { return }
        await load(showSpinner: true)
    }

    /// Pull-to-refresh. Never shows the full-screen spinner (the refresh control
    /// provides its own affordance).
    func refresh() async {
        await load(showSpinner: false, forceRefresh: true)
    }

    private func load(showSpinner: Bool, forceRefresh: Bool = false) async {
        if showSpinner { state = .loading }
        do {
            let result = try await repository.fetchMessages(forceRefresh: forceRefresh)
            apply(result)
        } catch let error as RepositoryError {
            handle(error)
        } catch {
            handle(.unknown)
        }
    }

    private func apply(_ result: FetchResult) {
        messages = result.messages
        isShowingCachedData = result.origin == .cache
        state = visibleMessages.isEmpty && !isFiltering ? .empty : .loaded

        // A cache-origin result is a soft failure worth surfacing non-blockingly.
        if result.origin == .cache {
            activeError = InboxError(
                title: "Offline",
                message: RepositoryError.offline.errorDescription ?? "Showing cached messages.",
                isBlocking: false
            )
        }
    }

    private func handle(_ error: RepositoryError) {
        // If we already have data on screen, keep it and just alert; otherwise
        // move into the failed state so the UI can show a full-screen retry.
        if messages.isEmpty {
            state = .failed(error.errorDescription ?? "Failed to load inbox.")
        }
        activeError = InboxError(
            title: "Couldn't refresh",
            message: error.errorDescription ?? "Please try again.",
            isBlocking: messages.isEmpty
        )
    }

    // MARK: - Row intents (optimistic)

    /// Toggle read/unread. Updates the UI immediately, then persists; reverts on
    /// failure and surfaces an alert.
    func toggleRead(_ message: Message) async {
        let newValue = !message.isRead
        setReadLocally(id: message.id, isRead: newValue)
        do {
            try await repository.setRead(id: message.id, isRead: newValue)
        } catch {
            setReadLocally(id: message.id, isRead: message.isRead) // revert
            activeError = InboxError(
                title: "Update failed",
                message: "Couldn't update this message. Please try again.",
                isBlocking: false
            )
        }
    }

    /// Archive a message. Removes it optimistically; restores on failure.
    func archive(_ message: Message) async {
        guard let index = messages.firstIndex(where: { $0.id == message.id }) else { return }
        let snapshot = messages[index]
        messages[index].isArchived = true
        recomputeEmptyState()
        do {
            try await repository.archive(id: message.id)
        } catch {
            messages[index] = snapshot // restore
            recomputeEmptyState()
            activeError = InboxError(
                title: "Archive failed",
                message: "Couldn't archive this message. Please try again.",
                isBlocking: false
            )
        }
    }

    func clearFilters() {
        activeFilters.removeAll()
        searchText = ""
    }

    func toggle(filter source: MessageSource) {
        if activeFilters.contains(source) {
            activeFilters.remove(source)
        } else {
            activeFilters.insert(source)
        }
    }

    // MARK: - Private helpers

    private func setReadLocally(id: String, isRead: Bool) {
        guard let index = messages.firstIndex(where: { $0.id == id }) else { return }
        messages[index].isRead = isRead
    }

    private func recomputeEmptyState() {
        guard state != .loading, state != .idle else { return }
        state = visibleMessages.isEmpty && !isFiltering ? .empty : .loaded
    }
}

// MARK: - InboxError

/// A user-presentable error. `isBlocking` distinguishes a full-screen failure
/// (no data on screen) from a dismissible banner-style alert.
struct InboxError: Identifiable, Equatable {
    let id = UUID()
    let title: String
    let message: String
    let isBlocking: Bool
}
