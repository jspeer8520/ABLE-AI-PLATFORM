//
//  Message.swift
//  ABLEInbox
//
//  Domain model for a unified-inbox message aggregated from an external
//  source (Gmail, Outlook, Slack, Teams).
//
//  API contract (Sprint 3, shared with Android):
//
//      GET http://localhost:4000/api/messages
//      { "messages": [ Message, ... ], "total": 100 }
//
//  The struct is `Codable` so the same type decodes the network payload and
//  encodes into the Core Data offline cache.
//

import Foundation

// MARK: - MessageSource

/// The external provider a message originated from.
///
/// Backed by a lowercased `String` so it round-trips cleanly through JSON and
/// Core Data. Decoding is tolerant: an unknown/new provider decodes to
/// `.unknown` instead of throwing, so a backend change never crashes the app.
enum MessageSource: String, Codable, CaseIterable, Identifiable, Sendable {
    case gmail
    case outlook
    case slack
    case teams
    case unknown

    var id: String { rawValue }

    /// The sources a user can explicitly filter by (excludes `.unknown`).
    static var selectable: [MessageSource] { [.gmail, .outlook, .slack, .teams] }

    /// Human-readable label for UI and VoiceOver.
    var displayName: String {
        switch self {
        case .gmail: return "Gmail"
        case .outlook: return "Outlook"
        case .slack: return "Slack"
        case .teams: return "Teams"
        case .unknown: return "Other"
        }
    }

    /// SF Symbol used to badge the source in the list.
    var systemImageName: String {
        switch self {
        case .gmail: return "envelope.fill"
        case .outlook: return "envelope.badge.fill"
        case .slack: return "number.square.fill"
        case .teams: return "person.2.fill"
        case .unknown: return "questionmark.circle.fill"
        }
    }

    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = MessageSource(rawValue: raw.lowercased()) ?? .unknown
    }
}

// MARK: - Message

/// A single inbox message.
///
/// `Identifiable`/`Hashable` for use in SwiftUI `List`/`ForEach`, `Sendable`
/// so it can cross actor boundaries between the repository and the main-actor
/// view model.
struct Message: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let source: MessageSource
    let sender: String
    let senderEmail: String?
    let subject: String
    let preview: String
    let timestamp: Date
    var isRead: Bool
    var isArchived: Bool

    init(
        id: String,
        source: MessageSource,
        sender: String,
        senderEmail: String? = nil,
        subject: String,
        preview: String,
        timestamp: Date,
        isRead: Bool = false,
        isArchived: Bool = false
    ) {
        self.id = id
        self.source = source
        self.sender = sender
        self.senderEmail = senderEmail
        self.subject = subject
        self.preview = preview
        self.timestamp = timestamp
        self.isRead = isRead
        self.isArchived = isArchived
    }

    // Explicit keys so the wire format is documented and stable regardless of
    // property renames.
    enum CodingKeys: String, CodingKey {
        case id
        case source
        case sender
        case senderEmail
        case subject
        case preview
        case timestamp
        case isRead
        case isArchived
    }

    /// Tolerant decoding: optional read/archive flags default to `false`, and a
    /// missing `senderEmail` is allowed. Keeps the client resilient to a
    /// backend that omits fields.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        source = try c.decodeIfPresent(MessageSource.self, forKey: .source) ?? .unknown
        sender = try c.decode(String.self, forKey: .sender)
        senderEmail = try c.decodeIfPresent(String.self, forKey: .senderEmail)
        subject = try c.decode(String.self, forKey: .subject)
        preview = try c.decodeIfPresent(String.self, forKey: .preview) ?? ""
        timestamp = try c.decode(Date.self, forKey: .timestamp)
        isRead = try c.decodeIfPresent(Bool.self, forKey: .isRead) ?? false
        isArchived = try c.decodeIfPresent(Bool.self, forKey: .isArchived) ?? false
    }
}

// MARK: - API envelope

/// Top-level response envelope for `GET /api/messages`.
struct MessagesResponse: Codable, Sendable {
    let messages: [Message]
    let total: Int
}

// MARK: - Search / display helpers

extension Message {
    /// Case- and diacritic-insensitive match across the fields a user would
    /// reasonably search. Empty/whitespace query matches everything.
    func matches(query: String) -> Bool {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return true }
        let haystacks = [sender, subject, preview, senderEmail ?? ""]
        return haystacks.contains { field in
            field.range(
                of: trimmed,
                options: [.caseInsensitive, .diacriticInsensitive]
            ) != nil
        }
    }

    /// Relative timestamp string ("2h ago") for the list row.
    var relativeTimestamp: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: timestamp, relativeTo: Date())
    }
}
