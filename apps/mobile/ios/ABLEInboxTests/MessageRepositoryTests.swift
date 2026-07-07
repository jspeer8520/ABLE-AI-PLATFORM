//
//  MessageRepositoryTests.swift
//  ABLEInboxTests
//
//  Repository-layer tests:
//    • MockMessageRepository behavior (seed, delay, injected failure, mutation).
//    • RemoteMessageRepository as an "API integration" test against the real
//      `GET /api/messages` contract, using a stubbed `URLProtocol` so no live
//      backend is required. This is exactly what will exercise the real client
//      once the backend endpoint ships — only the stub is removed.
//    • MessageDatabase (Core Data) round-trip using an in-memory store.
//

import XCTest
@testable import ABLEInbox

final class MessageRepositoryTests: XCTestCase {

    // MARK: - Mock repository

    func testMockRepositoryReturnsSeededMessages() async throws {
        let repo = MockMessageRepository()
        let result = try await repo.fetchMessages()
        XCTAssertFalse(result.messages.isEmpty)
        XCTAssertEqual(result.origin, .network)
    }

    func testMockRepositoryInjectedFailure() async {
        let repo = MockMessageRepository(behavior: .init(failNextFetch: .server(status: 503)))
        do {
            _ = try await repo.fetchMessages()
            XCTFail("Expected failure")
        } catch let error as RepositoryError {
            XCTAssertEqual(error, .server(status: 503))
        } catch {
            XCTFail("Wrong error type: \(error)")
        }
    }

    func testMockRepositoryForceOfflineReportsCacheOrigin() async throws {
        let repo = MockMessageRepository(behavior: .init(forceOffline: true))
        let result = try await repo.fetchMessages()
        XCTAssertEqual(result.origin, .cache)
    }

    func testMockRepositoryMutationsPersist() async throws {
        let seed = [
            Message(id: "a", source: .gmail, sender: "S", subject: "Sub",
                    preview: "P", timestamp: Date(timeIntervalSince1970: 0), isRead: false)
        ]
        let repo = MockMessageRepository(seed: seed)

        try await repo.setRead(id: "a", isRead: true)
        try await repo.archive(id: "a")

        let after = try await repo.fetchMessages().messages.first { $0.id == "a" }
        XCTAssertEqual(after?.isRead, true)
        XCTAssertEqual(after?.isArchived, true)
    }

    // MARK: - Remote repository (API contract integration)

    /// The exact wire format from the Sprint 3 contract:
    /// `{ "messages": [...], "total": N }`.
    private static let contractJSON = """
    {
      "messages": [
        {
          "id": "srv-1",
          "source": "gmail",
          "sender": "Server Sender",
          "senderEmail": "srv@example.com",
          "subject": "Hello from the API",
          "preview": "This came over the wire",
          "timestamp": "2024-07-03T10:15:30Z",
          "isRead": false,
          "isArchived": false
        },
        {
          "id": "srv-2",
          "source": "Slack",
          "sender": "#general",
          "subject": "Fractional seconds + case-insensitive source",
          "preview": "Testing tolerant decoding",
          "timestamp": "2024-07-03T09:00:00.500Z"
        }
      ],
      "total": 2
    }
    """

    private func makeStubbedRepository(
        status: Int = 200,
        body: String = contractJSON,
        error: URLError? = nil
    ) -> RemoteMessageRepository {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [StubURLProtocol.self]
        StubURLProtocol.stub = .init(statusCode: status, body: Data(body.utf8), error: error)
        let session = URLSession(configuration: config)
        return RemoteMessageRepository(
            baseURL: URL(string: "http://localhost:4000")!,
            session: session,
            cache: nil
        )
    }

    func testRemoteRepositoryDecodesContract() async throws {
        let repo = makeStubbedRepository()
        let result = try await repo.fetchMessages()

        XCTAssertEqual(result.origin, .network)
        XCTAssertEqual(result.messages.count, 2)

        let first = result.messages[0]
        XCTAssertEqual(first.id, "srv-1")
        XCTAssertEqual(first.source, .gmail)
        XCTAssertEqual(first.senderEmail, "srv@example.com")
        XCTAssertFalse(first.isRead)

        // Tolerant decoding: capitalized source + fractional seconds + missing flags.
        let second = result.messages[1]
        XCTAssertEqual(second.source, .slack)
        XCTAssertEqual(second.preview, "Testing tolerant decoding")
        XCTAssertFalse(second.isRead, "Missing isRead defaults to false")
    }

    func testRemoteRepositoryServerErrorMaps() async {
        let repo = makeStubbedRepository(status: 500)
        do {
            _ = try await repo.fetchMessages()
            XCTFail("Expected server error")
        } catch let error as RepositoryError {
            XCTAssertEqual(error, .server(status: 500))
        } catch {
            XCTFail("Wrong error: \(error)")
        }
    }

    func testRemoteRepositoryMalformedBodyMapsToDecoding() async {
        let repo = makeStubbedRepository(body: "{ not json ]")
        do {
            _ = try await repo.fetchMessages()
            XCTFail("Expected decoding error")
        } catch let error as RepositoryError {
            XCTAssertEqual(error, .decoding)
        } catch {
            XCTFail("Wrong error: \(error)")
        }
    }

    func testRemoteRepositoryOfflineWithoutCacheThrowsOffline() async {
        let repo = makeStubbedRepository(error: URLError(.notConnectedToInternet))
        do {
            _ = try await repo.fetchMessages()
            XCTFail("Expected offline error")
        } catch let error as RepositoryError {
            XCTAssertEqual(error, .offline)
        } catch {
            XCTFail("Wrong error: \(error)")
        }
    }

    func testRemoteRepositoryOfflineFallsBackToCache() async throws {
        let cache = MessageDatabase.inMemory()
        try await cache.replaceAll(with: MockMessageRepository.sampleMessages)

        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [StubURLProtocol.self]
        StubURLProtocol.stub = .init(statusCode: 0, body: Data(), error: URLError(.notConnectedToInternet))
        let session = URLSession(configuration: config)
        let repo = RemoteMessageRepository(
            baseURL: URL(string: "http://localhost:4000")!,
            session: session,
            cache: cache
        )

        let result = try await repo.fetchMessages()
        XCTAssertEqual(result.origin, .cache, "Should gracefully degrade to cache")
        XCTAssertFalse(result.messages.isEmpty)
    }

    func testRemoteRepositoryWritesThroughToCacheOnSuccess() async throws {
        let cache = MessageDatabase.inMemory()

        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [StubURLProtocol.self]
        StubURLProtocol.stub = .init(statusCode: 200, body: Data(Self.contractJSON.utf8), error: nil)
        let session = URLSession(configuration: config)
        let repo = RemoteMessageRepository(
            baseURL: URL(string: "http://localhost:4000")!,
            session: session,
            cache: cache
        )

        _ = try await repo.fetchMessages()
        let cached = try await cache.loadAll()
        XCTAssertEqual(cached.count, 2, "Successful fetch should populate the cache")
    }

    // MARK: - Core Data cache

    func testCacheRoundTrip() async throws {
        let cache = MessageDatabase.inMemory()
        try await cache.replaceAll(with: MockMessageRepository.sampleMessages)

        let loaded = try await cache.loadAll()
        XCTAssertEqual(loaded.count, MockMessageRepository.sampleMessages.filter { !$0.isArchived }.count)
        // Sorted newest first.
        XCTAssertTrue(zip(loaded, loaded.dropFirst()).allSatisfy { $0.timestamp >= $1.timestamp })
    }

    func testCacheReplaceAllOverwrites() async throws {
        let cache = MessageDatabase.inMemory()
        try await cache.replaceAll(with: MockMessageRepository.sampleMessages)
        try await cache.replaceAll(with: [
            Message(id: "only", source: .teams, sender: "X", subject: "Y",
                    preview: "Z", timestamp: Date(timeIntervalSince1970: 100))
        ])
        let loaded = try await cache.loadAll()
        XCTAssertEqual(loaded.map(\.id), ["only"])
    }

    func testCacheSetReadAndArchive() async throws {
        let cache = MessageDatabase.inMemory()
        let msg = Message(id: "m1", source: .gmail, sender: "A", subject: "B",
                          preview: "C", timestamp: Date(timeIntervalSince1970: 10), isRead: false)
        try await cache.replaceAll(with: [msg])

        try await cache.setRead(id: "m1", isRead: true)
        let afterRead = try await cache.loadAll().first
        XCTAssertEqual(afterRead?.isRead, true)

        try await cache.archive(id: "m1")
        let afterArchive = try await cache.loadAll()
        XCTAssertTrue(afterArchive.isEmpty, "Archived messages are excluded from loadAll")
    }

    func testCacheClear() async throws {
        let cache = MessageDatabase.inMemory()
        try await cache.replaceAll(with: MockMessageRepository.sampleMessages)
        try await cache.clear()
        let loaded = try await cache.loadAll()
        XCTAssertTrue(loaded.isEmpty)
    }
}

// MARK: - URLProtocol stub

/// Intercepts requests so the real `URLSession`/`RemoteMessageRepository` path
/// is exercised end-to-end without a live server. Swapping this out for the
/// real backend requires no changes to production code.
final class StubURLProtocol: URLProtocol {

    struct Stub {
        let statusCode: Int
        let body: Data
        let error: URLError?
    }

    /// nonisolated(unsafe): tests set this serially before each request; the
    /// stub is single-threaded per test.
    nonisolated(unsafe) static var stub: Stub?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let stub = StubURLProtocol.stub else {
            client?.urlProtocol(self, didFailWithError: URLError(.unknown))
            return
        }

        if let error = stub.error {
            client?.urlProtocol(self, didFailWithError: error)
            return
        }

        let response = HTTPURLResponse(
            url: request.url!,
            statusCode: stub.statusCode,
            httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": "application/json"]
        )!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: stub.body)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}
}
