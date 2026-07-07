package ai.able.inbox.data.remote

import ai.able.inbox.data.model.Message
import ai.able.inbox.data.model.MessageSource
import java.time.Instant
import java.time.format.DateTimeParseException

/**
 * Maps a network [MessageDto] into the [Message] domain model.
 *
 * Timestamp parsing is defensive: a malformed or absent `createdAt` falls back
 * to [Instant.EPOCH] rather than throwing, so a single bad record never breaks
 * the whole list. Optional timestamps that fail to parse are treated as null.
 */
fun MessageDto.toDomain(): Message = Message(
    id = id,
    source = MessageSource.fromWire(source),
    senderName = senderName,
    subject = subject,
    content = content,
    createdAt = parseInstantOrNull(createdAt) ?: Instant.EPOCH,
    readAt = parseInstantOrNull(readAt),
    archivedAt = parseInstantOrNull(archivedAt),
)

fun MessagesResponse.toDomain(): List<Message> = messages.map { it.toDomain() }

private fun parseInstantOrNull(raw: String?): Instant? {
    if (raw.isNullOrBlank()) return null
    return try {
        Instant.parse(raw)
    } catch (_: DateTimeParseException) {
        null
    }
}
