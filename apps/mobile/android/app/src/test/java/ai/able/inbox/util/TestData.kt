package ai.able.inbox.util

import ai.able.inbox.data.model.Message
import ai.able.inbox.data.model.MessageSource
import java.time.Instant

/** Concise builder for [Message]s in tests. */
fun message(
    id: String,
    source: MessageSource = MessageSource.GMAIL,
    sender: String = "Sender $id",
    subject: String = "Subject $id",
    content: String = "Content of $id",
    createdAt: Instant = Instant.parse("2024-01-15T10:30:00Z"),
    readAt: Instant? = null,
    archivedAt: Instant? = null,
): Message = Message(
    id = id,
    source = source,
    senderName = sender,
    subject = subject,
    content = content,
    createdAt = createdAt,
    readAt = readAt,
    archivedAt = archivedAt,
)
