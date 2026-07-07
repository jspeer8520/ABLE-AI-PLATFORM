package ai.able.inbox.data

import ai.able.inbox.data.local.MessageLocalDataSource
import ai.able.inbox.data.model.Message
import ai.able.inbox.data.network.NetworkMonitor
import ai.able.inbox.data.remote.MessageRemoteDataSource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import java.time.Instant

/**
 * Offline-first [MessageRepository].
 *
 * The local cache is the source of truth the UI observes. The network only
 * ever updates the cache:
 *  - [refresh] pulls from the remote source into the cache, but only when the
 *    device is online; otherwise it serves whatever is cached.
 *  - Mutations ([markAsRead], [archive]) update the cache optimistically so the
 *    UI reacts instantly, then attempt to sync upstream.
 *
 * `archive` is currently cache-only: the provided API contract exposes read
 * state but no archive endpoint, so archived state lives on-device until a
 * future endpoint exists. This is called out here rather than faked.
 *
 * [now] is injected so archive timestamps are deterministic in tests.
 */
class OfflineFirstMessageRepository(
    private val remote: MessageRemoteDataSource,
    private val local: MessageLocalDataSource,
    private val networkMonitor: NetworkMonitor,
    private val now: () -> Instant = Instant::now,
) : MessageRepository {

    override fun observeMessages(): Flow<List<Message>> = local.observeMessages()

    override suspend fun refresh(): RefreshResult {
        val online = networkMonitor.isOnline.first()
        if (!online) return RefreshResult.Offline
        return try {
            val fresh = remote.fetchMessages()
            // Preserve local-only archive state that the backend does not know
            // about, so a refresh never resurrects a message the user archived.
            val locallyArchived = local.current()
                .filter { it.isArchived }
                .associate { it.id to it.archivedAt }
            val merged = fresh.map { message ->
                locallyArchived[message.id]?.let { message.copy(archivedAt = it) } ?: message
            }
            local.replaceAll(merged)
            RefreshResult.Success
        } catch (t: Throwable) {
            RefreshResult.Error(t)
        }
    }

    override suspend fun markAsRead(id: String): Result<Unit> {
        val target = local.current().firstOrNull { it.id == id }
            ?: return Result.failure(NoSuchElementException("Unknown message $id"))
        if (target.isRead) return Result.success(Unit)

        // Optimistic local update first for instant UI feedback.
        local.upsert(target.copy(readAt = now()))
        return runCatching { remote.setRead(id, read = true) }
    }

    override suspend fun archive(id: String): Result<Unit> {
        val target = local.current().firstOrNull { it.id == id }
            ?: return Result.failure(NoSuchElementException("Unknown message $id"))
        local.upsert(target.copy(archivedAt = now()))
        return Result.success(Unit)
    }

    override suspend fun unarchive(id: String): Result<Unit> {
        val target = local.current().firstOrNull { it.id == id }
            ?: return Result.failure(NoSuchElementException("Unknown message $id"))
        local.upsert(target.copy(archivedAt = null))
        return Result.success(Unit)
    }
}
