package ai.able.inbox.data.local

import ai.able.inbox.data.model.Message
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * Local cache that acts as the single source of truth the UI observes.
 *
 * In an offline-first architecture the UI always renders from the cache; the
 * network only ever *updates* the cache. This interface is backed by an
 * in-memory [InMemoryMessageLocalDataSource] today and can be swapped for a
 * Room-backed implementation later without touching the repository or UI.
 */
interface MessageLocalDataSource {

    /** Emits the cached messages and re-emits on every mutation. */
    fun observeMessages(): Flow<List<Message>>

    /** Current snapshot without observing. */
    fun current(): List<Message>

    /** Replaces the entire cache (e.g. after a successful network refresh). */
    suspend fun replaceAll(messages: List<Message>)

    /** Inserts or updates a single message, preserving ordering rules. */
    suspend fun upsert(message: Message)

    /** Whether the cache has ever been populated. */
    fun hasData(): Boolean
}

/**
 * Thread-safe in-memory cache. Messages are always exposed newest-first.
 */
class InMemoryMessageLocalDataSource(
    initial: List<Message> = emptyList(),
) : MessageLocalDataSource {

    private val state = MutableStateFlow(initial.sortedByDescending { it.createdAt })

    override fun observeMessages(): Flow<List<Message>> = state.asStateFlow()

    override fun current(): List<Message> = state.value

    override suspend fun replaceAll(messages: List<Message>) {
        state.value = messages.sortedByDescending { it.createdAt }
    }

    override suspend fun upsert(message: Message) {
        state.update { existing ->
            (existing.filterNot { it.id == message.id } + message)
                .sortedByDescending { it.createdAt }
        }
    }

    override fun hasData(): Boolean = state.value.isNotEmpty()
}
