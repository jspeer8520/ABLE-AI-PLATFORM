//
//  MessageDatabase.swift
//  ABLEInbox
//
//  Core Data-backed offline cache for inbox messages.
//
//  The managed object model is built *in code* (no .xcdatamodeld file) so the
//  cache is fully self-contained, reviewable in one place, and unit-testable
//  with an in-memory store. All work runs on a private background context;
//  the public API is an `actor`-isolated `MessageCache` so callers never touch
//  Core Data on the main thread.
//

import Foundation
import CoreData

// MARK: - Cache protocol

/// Storage abstraction the repository depends on. Kept separate from Core Data
/// so tests can inject an in-memory fake without a persistent store.
protocol MessageCache: Sendable {
    /// Replace the entire cached set (used after a successful network fetch).
    func replaceAll(with messages: [Message]) async throws
    /// Load all non-archived cached messages, newest first.
    func loadAll() async throws -> [Message]
    /// Update the read flag for one message.
    func setRead(id: String, isRead: Bool) async throws
    /// Mark one message archived.
    func archive(id: String) async throws
    /// Remove everything (e.g. on sign-out).
    func clear() async throws
}

// MARK: - MessageDatabase

/// Concrete Core Data implementation of `MessageCache`.
///
/// Construct with `.persistent(...)` for the app or `.inMemory()` for tests.
final class MessageDatabase: MessageCache {

    static let shared = MessageDatabase.persistent()

    private let container: NSPersistentContainer

    private init(container: NSPersistentContainer) {
        self.container = container
    }

    // MARK: Factories

    static func persistent(name: String = "ABLEInbox") -> MessageDatabase {
        let container = NSPersistentContainer(name: name, managedObjectModel: Self.model)
        container.loadPersistentStores { _, error in
            if let error {
                // A failed store load is unrecoverable for the cache. We log and
                // continue with a nil store; the repository degrades to network-
                // only rather than crashing the app.
                assertionFailure("Core Data store failed to load: \(error)")
            }
        }
        return MessageDatabase(container: container)
    }

    static func inMemory(name: String = "ABLEInboxTest") -> MessageDatabase {
        let container = NSPersistentContainer(name: name, managedObjectModel: Self.model)
        let description = NSPersistentStoreDescription()
        description.type = NSInMemoryStoreType
        description.shouldAddStoreAsynchronously = false
        container.persistentStoreDescriptions = [description]
        container.loadPersistentStores { _, error in
            precondition(error == nil, "In-memory store must load: \(String(describing: error))")
        }
        return MessageDatabase(container: container)
    }

    // MARK: MessageCache

    func replaceAll(with messages: [Message]) async throws {
        try await perform { context in
            // Clear then insert. `NSBatchDeleteRequest` isn't supported by the
            // in-memory store, so delete via fetch to keep tests and app aligned.
            let existing = try context.fetch(Self.fetchRequest())
            existing.forEach(context.delete)
            for message in messages {
                Self.upsert(message, into: context)
            }
            try context.save()
        }
    }

    func loadAll() async throws -> [Message] {
        try await perform { context in
            let request = Self.fetchRequest()
            request.predicate = NSPredicate(format: "isArchived == NO")
            request.sortDescriptors = [NSSortDescriptor(key: "timestamp", ascending: false)]
            return try context.fetch(request).map(Self.decode)
        }
    }

    func setRead(id: String, isRead: Bool) async throws {
        try await mutate(id: id) { $0.setValue(isRead, forKey: "isRead") }
    }

    func archive(id: String) async throws {
        try await mutate(id: id) { $0.setValue(true, forKey: "isArchived") }
    }

    func clear() async throws {
        try await perform { context in
            try context.fetch(Self.fetchRequest()).forEach(context.delete)
            try context.save()
        }
    }

    // MARK: - Internals

    /// Runs `body` on the container's background context and bridges Core Data's
    /// completion-style API to async/await, mapping any throw to
    /// `RepositoryError.cache`.
    private func perform<T>(_ body: @escaping (NSManagedObjectContext) throws -> T) async throws -> T {
        let context = container.newBackgroundContext()
        context.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
        return try await withCheckedThrowingContinuation { continuation in
            context.perform {
                do {
                    continuation.resume(returning: try body(context))
                } catch {
                    continuation.resume(throwing: RepositoryError.cache(error.localizedDescription))
                }
            }
        }
    }

    private func mutate(id: String, _ change: @escaping (NSManagedObject) -> Void) async throws {
        try await perform { context in
            let request = Self.fetchRequest()
            request.predicate = NSPredicate(format: "id == %@", id)
            request.fetchLimit = 1
            guard let object = try context.fetch(request).first else { return }
            change(object)
            try context.save()
        }
    }

    // MARK: - Managed object model (built in code)

    private static let entityName = "CachedMessage"

    /// Programmatic `NSManagedObjectModel` describing a single `CachedMessage`
    /// entity mirroring the `Message` struct.
    private static let model: NSManagedObjectModel = {
        let entity = NSEntityDescription()
        entity.name = entityName
        entity.managedObjectClassName = NSStringFromClass(NSManagedObject.self)

        func attr(_ name: String, _ type: NSAttributeType, optional: Bool = false) -> NSAttributeDescription {
            let a = NSAttributeDescription()
            a.name = name
            a.attributeType = type
            a.isOptional = optional
            return a
        }

        entity.properties = [
            attr("id", .stringAttributeType),
            attr("source", .stringAttributeType),
            attr("sender", .stringAttributeType),
            attr("senderEmail", .stringAttributeType, optional: true),
            attr("subject", .stringAttributeType),
            attr("preview", .stringAttributeType),
            attr("timestamp", .dateAttributeType),
            attr("isRead", .booleanAttributeType),
            attr("isArchived", .booleanAttributeType)
        ]

        // Unique constraint on id so `upsert` de-duplicates.
        entity.uniquenessConstraints = [["id"]]

        let model = NSManagedObjectModel()
        model.entities = [entity]
        return model
    }()

    private static func fetchRequest() -> NSFetchRequest<NSManagedObject> {
        NSFetchRequest<NSManagedObject>(entityName: entityName)
    }

    private static func upsert(_ message: Message, into context: NSManagedObjectContext) {
        let object = NSEntityDescription.insertNewObject(forEntityName: entityName, into: context)
        object.setValue(message.id, forKey: "id")
        object.setValue(message.source.rawValue, forKey: "source")
        object.setValue(message.sender, forKey: "sender")
        object.setValue(message.senderEmail, forKey: "senderEmail")
        object.setValue(message.subject, forKey: "subject")
        object.setValue(message.preview, forKey: "preview")
        object.setValue(message.timestamp, forKey: "timestamp")
        object.setValue(message.isRead, forKey: "isRead")
        object.setValue(message.isArchived, forKey: "isArchived")
    }

    private static func decode(_ object: NSManagedObject) -> Message {
        Message(
            id: object.value(forKey: "id") as? String ?? UUID().uuidString,
            source: MessageSource(rawValue: object.value(forKey: "source") as? String ?? "") ?? .unknown,
            sender: object.value(forKey: "sender") as? String ?? "",
            senderEmail: object.value(forKey: "senderEmail") as? String,
            subject: object.value(forKey: "subject") as? String ?? "",
            preview: object.value(forKey: "preview") as? String ?? "",
            timestamp: object.value(forKey: "timestamp") as? Date ?? Date(timeIntervalSince1970: 0),
            isRead: object.value(forKey: "isRead") as? Bool ?? false,
            isArchived: object.value(forKey: "isArchived") as? Bool ?? false
        )
    }
}
