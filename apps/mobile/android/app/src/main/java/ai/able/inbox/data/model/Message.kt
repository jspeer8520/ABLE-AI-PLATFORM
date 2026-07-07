package ai.able.inbox.data.model

import java.time.Instant

/**
 * Domain model for a single inbox message.
 *
 * This is intentionally decoupled from the network DTO ([ai.able.inbox.data.remote.MessageDto])
 * so the UI never depends on the wire format. Timestamps are modelled as
 * [Instant]s rather than raw strings so the UI layer can format them for the
 * device locale/timezone.
 */
data class Message(
    val id: String,
    val source: MessageSource,
    val senderName: String,
    val subject: String,
    val content: String,
    val createdAt: Instant,
    val readAt: Instant? = null,
    val archivedAt: Instant? = null,
) {
    val isRead: Boolean get() = readAt != null
    val isArchived: Boolean get() = archivedAt != null

    /** Short single-line preview of the body used in the list row. */
    fun preview(maxChars: Int = 120): String {
        val collapsed = content.replace(Regex("\\s+"), " ").trim()
        return if (collapsed.length <= maxChars) collapsed
        else collapsed.take(maxChars).trimEnd() + "…"
    }

    /**
     * Case-insensitive match against sender, subject and body. Used by the
     * in-memory search filter so results are available offline.
     */
    fun matches(query: String): Boolean {
        if (query.isBlank()) return true
        val q = query.trim()
        return senderName.contains(q, ignoreCase = true) ||
            subject.contains(q, ignoreCase = true) ||
            content.contains(q, ignoreCase = true)
    }
}
