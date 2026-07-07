//
//  RemoteMessageRepository.swift
//  ABLEInbox
//
//  Real implementation of `MessageRepository` backed by URLSession + the
//  Core Data offline cache (`MessageDatabase`).
//
//  Wiring for backend integration (Sprint 3 → 4):
//
//      let repository = RemoteMessageRepository(
//          baseURL: URL(string: "http://localhost:4000")!,
//          cache: MessageDatabase.shared
//      )
//
//  Behavior:
//    • On success  → decodes `MessagesResponse`, writes through to the cache,
//                    returns `.network`.
//    • On offline  → falls back to the cached messages, returns `.cache`
//                    (graceful degradation) or rethrows `.offline` if the cache
//                    is empty.
//    • On HTTP/decode error → maps to `RepositoryError` for the UI alert.
//

import Foundation

/// URLSession-based repository. Uses async/await throughout; no completion
/// handlers. Injectable `URLSession` and `MessageCache` make it fully testable
/// via a stubbed `URLProtocol` (see `MessageRepositoryTests`).
final class RemoteMessageRepository: MessageRepository {

    private let baseURL: URL
    private let session: URLSession
    private let cache: MessageCache?
    private let decoder: JSONDecoder

    init(baseURL: URL, session: URLSession = .shared, cache: MessageCache? = nil) {
        self.baseURL = baseURL
        self.session = session
        self.cache = cache
        self.decoder = RemoteMessageRepository.makeDecoder()
    }

    // MARK: MessageRepository

    func fetchMessages(forceRefresh: Bool) async throws -> FetchResult {
        let request = makeRequest(path: "/api/messages", method: "GET")

        do {
            let (data, response) = try await session.data(for: request)
            try Self.validate(response)

            let envelope: MessagesResponse
            do {
                envelope = try decoder.decode(MessagesResponse.self, from: data)
            } catch {
                throw RepositoryError.decoding
            }

            // Write-through cache so the next offline launch has fresh data.
            if let cache {
                try? await cache.replaceAll(with: envelope.messages)
            }
            return FetchResult(messages: envelope.messages, origin: .network)

        } catch let error as RepositoryError {
            throw error
        } catch {
            // Network-layer failure (no connection, timeout, DNS…).
            return try await fallbackToCache(after: error)
        }
    }

    func setRead(id: String, isRead: Bool) async throws {
        let request = makeRequest(
            path: "/api/messages/\(id)/read",
            method: "PATCH",
            body: ["isRead": isRead]
        )
        _ = try await send(request)
        try? await cache?.setRead(id: id, isRead: isRead)
    }

    func archive(id: String) async throws {
        let request = makeRequest(path: "/api/messages/\(id)/archive", method: "POST")
        _ = try await send(request)
        try? await cache?.archive(id: id)
    }

    // MARK: - Helpers

    private func fallbackToCache(after networkError: Error) async throws -> FetchResult {
        if let cache, let cached = try? await cache.loadAll(), !cached.isEmpty {
            return FetchResult(messages: cached, origin: .cache)
        }
        // No cache to fall back to — treat connectivity errors as offline.
        if (networkError as? URLError)?.code == .notConnectedToInternet
            || (networkError as? URLError)?.code == .networkConnectionLost {
            throw RepositoryError.offline
        }
        throw RepositoryError.unknown
    }

    @discardableResult
    private func send(_ request: URLRequest) async throws -> Data {
        do {
            let (data, response) = try await session.data(for: request)
            try Self.validate(response)
            return data
        } catch let error as RepositoryError {
            throw error
        } catch let urlError as URLError
            where urlError.code == .notConnectedToInternet
            || urlError.code == .networkConnectionLost {
            throw RepositoryError.offline
        } catch {
            throw RepositoryError.unknown
        }
    }

    private func makeRequest(path: String, method: String, body: [String: Any]? = nil) -> URLRequest {
        var request = URLRequest(url: baseURL.appendingPathComponent(path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        }
        return request
    }

    private static func validate(_ response: URLResponse) throws {
        guard let http = response as? HTTPURLResponse else { return }
        guard (200..<300).contains(http.statusCode) else {
            throw RepositoryError.server(status: http.statusCode)
        }
    }

    /// Decoder configured for the backend contract. Accepts ISO-8601 timestamps
    /// (with or without fractional seconds) and epoch seconds as a fallback, so
    /// small backend variations don't break decoding.
    static func makeDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let isoPlain = ISO8601DateFormatter()
        isoPlain.formatOptions = [.withInternetDateTime]

        decoder.dateDecodingStrategy = .custom { d in
            let container = try d.singleValueContainer()
            if let string = try? container.decode(String.self) {
                if let date = iso.date(from: string) ?? isoPlain.date(from: string) {
                    return date
                }
                throw DecodingError.dataCorruptedError(
                    in: container,
                    debugDescription: "Unrecognized date format: \(string)"
                )
            }
            let seconds = try container.decode(Double.self)
            return Date(timeIntervalSince1970: seconds)
        }
        return decoder
    }
}
