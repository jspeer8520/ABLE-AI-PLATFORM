package ai.able.inbox.data

import ai.able.inbox.data.model.Message
import kotlinx.coroutines.flow.Flow

/**
 * The single dependency the UI layer has on the data layer. Implementations
 * decide where messages come from (mock, cache, network) — the ViewModel only
 * observes a [Flow] and issues intents.
 *
 * Swapping the mock backend for the real API is a DI-only change: the same
 * [MessageRepository] implementation ([OfflineFirstMessageRepository]) is used
 * with a different [ai.able.inbox.data.remote.MessageRemoteDataSource].
 */
interface MessageRepository {

    /**
     * Observes the cached messages, newest first. Emits immediately with
     * whatever is cached (possibly empty) and re-emits on every change.
     */
    fun observeMessages(): Flow<List<Message>>

    /**
     * Attempts to refresh from the network into the cache.
     * Never throws — the outcome is encoded in [RefreshResult].
     */
    suspend fun refresh(): RefreshResult

    /** Marks a message as read (optimistic locally, then synced upstream). */
    suspend fun markAsRead(id: String): Result<Unit>

    /** Archives a message locally so it drops out of the inbox view. */
    suspend fun archive(id: String): Result<Unit>

    /** Reverses an [archive], used to power undo. */
    suspend fun unarchive(id: String): Result<Unit>
}

/** Outcome of a [MessageRepository.refresh] attempt. */
sealed interface RefreshResult {
    /** Network fetch succeeded and the cache was updated. */
    data object Success : RefreshResult

    /** Device is offline; the existing cache is being served instead. */
    data object Offline : RefreshResult

    /** Network was attempted but failed; cache (if any) is preserved. */
    data class Error(val cause: Throwable) : RefreshResult
}
