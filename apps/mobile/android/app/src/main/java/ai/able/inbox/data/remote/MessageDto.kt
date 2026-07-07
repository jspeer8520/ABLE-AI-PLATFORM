package ai.able.inbox.data.remote

import kotlinx.serialization.Serializable

/**
 * Wire models mirroring the ABLE messages API contract:
 *
 *   GET   /api/messages                  -> [MessagesResponse]
 *   PATCH /api/messages/{id}/read        -> body [MarkReadRequest], resp [MutationResponse]
 *
 * These map 1:1 to the JSON and are deliberately nullable where the backend
 * may omit or null a field (`readAt`, `archivedAt`).
 */
@Serializable
data class MessagesResponse(
    val messages: List<MessageDto> = emptyList(),
    val total: Int = 0,
)

@Serializable
data class MessageDto(
    val id: String,
    val source: String,
    val senderName: String,
    val subject: String,
    val content: String,
    val createdAt: String,
    val readAt: String? = null,
    val archivedAt: String? = null,
)

@Serializable
data class MarkReadRequest(
    val read: Boolean,
)

@Serializable
data class MutationResponse(
    val success: Boolean,
)
