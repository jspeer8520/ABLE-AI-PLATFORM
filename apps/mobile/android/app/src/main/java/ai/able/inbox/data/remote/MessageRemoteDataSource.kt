package ai.able.inbox.data.remote

import ai.able.inbox.data.model.Message

/**
 * Abstraction over the network source of messages. The repository depends on
 * this interface, never on Retrofit directly, so the mock and real
 * implementations are fully interchangeable and unit-testable.
 */
interface MessageRemoteDataSource {

    /** Fetches the full message list. Throws on transport/parse failure. */
    suspend fun fetchMessages(): List<Message>

    /** Marks a message read/unread upstream. Throws on failure. */
    suspend fun setRead(id: String, read: Boolean)
}

/**
 * Production [MessageRemoteDataSource] backed by [MessageApi] (Retrofit).
 * Swapping the mock for this class in the DI container is the only change
 * needed to go live against the real backend.
 */
class ApiMessageRemoteDataSource(
    private val api: MessageApi,
) : MessageRemoteDataSource {

    override suspend fun fetchMessages(): List<Message> =
        api.getMessages().toDomain()

    override suspend fun setRead(id: String, read: Boolean) {
        val response = api.markRead(id, MarkReadRequest(read = read))
        check(response.success) { "Server rejected read update for message $id" }
    }
}
