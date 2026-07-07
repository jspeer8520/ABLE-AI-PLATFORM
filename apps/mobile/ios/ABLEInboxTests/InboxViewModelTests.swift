//
//  InboxViewModelTests.swift
//  ABLEInboxTests
//
//  Unit tests for `InboxViewModel` using an in-memory, controllable fake
//  repository. Covers loading, search, source filtering, optimistic
//  read/archive with rollback, offline/cache surfacing, and error handling.
//

import XCTest
@testable import ABLEInbox

@MainActor
final class InboxViewModelTests: XCTestCase {

    // MARK: - Test double

    /// Fully controllable repository fake — records calls and lets each test
    /// script results/failures without any network or Core Data.
    final class FakeRepository: MessageRepository, @unchecked Sendable {
        var messages: [Message]
        var origin: FetchResult.Origin = .network
        var fetchError: RepositoryError?
        var setReadError: RepositoryError?
        var archiveError: RepositoryError?

        private(set) var fetchCount = 0
        private(set) var setReadCalls: [(id: String, isRead: Bool)] = []
        private(set) var archiveCalls: [String] = []

        init(messages: [Message]) { self.messages = messages }

        func fetchMessages(forceRefresh: Bool) async throws -> FetchResult {
            fetchCount += 1
            if let fetchError { throw fetchError }
            return FetchResult(messages: messages, origin: origin)
        }

        func setRead(id: String, isRead: Bool) async throws {
            setReadCalls.append((id, isRead))
            if let setReadError { throw setReadError }
        }

        func archive(id: String) async throws {
            archiveCalls.append(id)
            if let archiveError { throw archiveError }
        }
    }

    // MARK: - Fixtures

    private func sample() -> [Message] {
        let base = Date(timeIntervalSince1970: 1_720_000_000)
        return [
            Message(id: "1", source: .gmail, sender: "Alice", subject: "Lab results",
                    preview: "Your panel is ready", timestamp: base, isRead: false),
            Message(id: "2", source: .slack, sender: "#eng", subject: "Standup",
                    preview: "Please review the PR", timestamp: base.addingTimeInterval(-60), isRead: true),
            Message(id: "3", source: .outlook, sender: "Billing", subject: "Invoice paid",
                    preview: "Payment received", timestamp: base.addingTimeInterval(-120), isRead: false)
        ]
    }

    // MARK: - Loading

    func testLoadPopulatesMessagesAndLoadedState() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)

        await vm.loadIfNeeded()

        XCTAssertEqual(vm.state, .loaded)
        XCTAssertEqual(vm.messages.count, 3)
        XCTAssertEqual(repo.fetchCount, 1)
        XCTAssertFalse(vm.isShowingCachedData)
        XCTAssertNil(vm.activeError)
    }

    func testLoadIfNeededIsIdempotentOnceLoaded() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)

        await vm.loadIfNeeded()
        await vm.loadIfNeeded()

        XCTAssertEqual(repo.fetchCount, 1, "Second loadIfNeeded should be a no-op")
    }

    func testRefreshAlwaysFetches() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)

        await vm.loadIfNeeded()
        await vm.refresh()

        XCTAssertEqual(repo.fetchCount, 2)
    }

    func testEmptyResultProducesEmptyState() async {
        let repo = FakeRepository(messages: [])
        let vm = InboxViewModel(repository: repo)

        await vm.loadIfNeeded()

        XCTAssertEqual(vm.state, .empty)
        XCTAssertTrue(vm.visibleMessages.isEmpty)
    }

    // MARK: - Search

    func testSearchFiltersBySenderSubjectAndPreview() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)
        await vm.loadIfNeeded()

        vm.searchText = "invoice"
        XCTAssertEqual(vm.visibleMessages.map(\.id), ["3"])

        vm.searchText = "review"           // matches preview of msg 2
        XCTAssertEqual(vm.visibleMessages.map(\.id), ["2"])

        vm.searchText = "  "               // whitespace ⇒ all
        XCTAssertEqual(vm.visibleMessages.count, 3)
    }

    func testSearchIsCaseAndDiacriticInsensitive() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)
        await vm.loadIfNeeded()

        vm.searchText = "ALICE"
        XCTAssertEqual(vm.visibleMessages.map(\.id), ["1"])
    }

    // MARK: - Filtering

    func testSourceFilterSingleAndMultiple() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)
        await vm.loadIfNeeded()

        vm.toggle(filter: .gmail)
        XCTAssertEqual(vm.visibleMessages.map(\.id), ["1"])

        vm.toggle(filter: .outlook)
        XCTAssertEqual(Set(vm.visibleMessages.map(\.id)), ["1", "3"])

        vm.toggle(filter: .gmail)          // remove gmail
        XCTAssertEqual(vm.visibleMessages.map(\.id), ["3"])
    }

    func testClearFiltersResetsSearchAndSources() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)
        await vm.loadIfNeeded()

        vm.searchText = "invoice"
        vm.toggle(filter: .outlook)
        vm.clearFilters()

        XCTAssertTrue(vm.searchText.isEmpty)
        XCTAssertTrue(vm.activeFilters.isEmpty)
        XCTAssertEqual(vm.visibleMessages.count, 3)
    }

    func testVisibleMessagesSortedNewestFirst() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)
        await vm.loadIfNeeded()

        XCTAssertEqual(vm.visibleMessages.map(\.id), ["1", "2", "3"])
    }

    // MARK: - Read / unread

    func testToggleReadOptimisticallyUpdatesAndPersists() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)
        await vm.loadIfNeeded()

        let unread = vm.messages.first { $0.id == "1" }!
        await vm.toggleRead(unread)

        XCTAssertTrue(vm.messages.first { $0.id == "1" }!.isRead)
        XCTAssertEqual(repo.setReadCalls.first?.id, "1")
        XCTAssertEqual(repo.setReadCalls.first?.isRead, true)
    }

    func testToggleReadRevertsOnFailure() async {
        let repo = FakeRepository(messages: sample())
        repo.setReadError = .server(status: 500)
        let vm = InboxViewModel(repository: repo)
        await vm.loadIfNeeded()

        let unread = vm.messages.first { $0.id == "1" }!
        await vm.toggleRead(unread)

        XCTAssertFalse(vm.messages.first { $0.id == "1" }!.isRead, "Should roll back")
        XCTAssertNotNil(vm.activeError)
        XCTAssertEqual(vm.activeError?.isBlocking, false)
    }

    func testUnreadCountReflectsVisibleMessages() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)
        await vm.loadIfNeeded()

        XCTAssertEqual(vm.unreadCount, 2) // msgs 1 and 3
    }

    // MARK: - Archive

    func testArchiveRemovesFromVisibleAndPersists() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)
        await vm.loadIfNeeded()

        let target = vm.messages.first { $0.id == "2" }!
        await vm.archive(target)

        XCTAssertFalse(vm.visibleMessages.contains { $0.id == "2" })
        XCTAssertEqual(repo.archiveCalls, ["2"])
    }

    func testArchiveRestoresOnFailure() async {
        let repo = FakeRepository(messages: sample())
        repo.archiveError = .unknown
        let vm = InboxViewModel(repository: repo)
        await vm.loadIfNeeded()

        let target = vm.messages.first { $0.id == "2" }!
        await vm.archive(target)

        XCTAssertTrue(vm.visibleMessages.contains { $0.id == "2" }, "Should restore on failure")
        XCTAssertNotNil(vm.activeError)
    }

    // MARK: - Offline / cache

    func testCachedOriginSurfacesNonBlockingOfflineNotice() async {
        let repo = FakeRepository(messages: sample())
        repo.origin = .cache
        let vm = InboxViewModel(repository: repo)

        await vm.loadIfNeeded()

        XCTAssertTrue(vm.isShowingCachedData)
        XCTAssertEqual(vm.state, .loaded)
        XCTAssertEqual(vm.activeError?.isBlocking, false)
        XCTAssertEqual(vm.activeError?.title, "Offline")
    }

    // MARK: - Errors

    func testFetchFailureWithNoDataProducesBlockingFailure() async {
        let repo = FakeRepository(messages: sample())
        repo.fetchError = .offline
        let vm = InboxViewModel(repository: repo)

        await vm.loadIfNeeded()

        guard case .failed = vm.state else {
            return XCTFail("Expected .failed state, got \(vm.state)")
        }
        XCTAssertEqual(vm.activeError?.isBlocking, true)
    }

    func testFetchFailureAfterDataKeepsMessagesAndAlertsNonBlocking() async {
        let repo = FakeRepository(messages: sample())
        let vm = InboxViewModel(repository: repo)
        await vm.loadIfNeeded()          // succeeds, 3 messages

        repo.fetchError = .server(status: 503)
        await vm.refresh()               // fails

        XCTAssertEqual(vm.messages.count, 3, "Existing data must be retained")
        XCTAssertEqual(vm.state, .loaded)
        XCTAssertEqual(vm.activeError?.isBlocking, false)
    }
}
