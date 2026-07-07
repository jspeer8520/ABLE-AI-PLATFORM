package ai.able.inbox.util

import ai.able.inbox.data.MessageRepository
import ai.able.inbox.data.RefreshResult
import ai.able.inbox.data.model.Message
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.update
import java.time.Instant

/**
 * In-memory [MessageRepository] test double. Lets ViewModel tests drive the
 * message stream and inspect intent calls without any real data sources.
 */
class FakeMessageRepository(
    initial: List<Message> = emptyList(),
) : MessageRepository {

    private val messages = MutableStateFlow(initial)

    /** Result the next [refresh] call returns. */
    var nextRefreshResult: RefreshResult = RefreshResult.Success

    /** Records ids passed to [markAsRead], in call order. */
    val markedRead = mutableListOf<String>()
    val archived = mutableListOf<String>()
    val unarchived = mutableListOf<String>()
    var refreshCount = 0
        private set

    /** Test hook to push a new message list into the observed stream. */
    fun emit(newMessages: List<Message>) {
        messages.value = newMessages
    }

    override fun observeMessages(): Flow<List<Message>> = messages

    override suspend fun refresh(): RefreshResult {
        refreshCount++
        return nextRefreshResult
    }

    override suspend fun markAsRead(id: String): Result<Unit> {
        markedRead += id
        messages.update { list ->
            list.map { if (it.id == id) it.copy(readAt = it.readAt ?: Instant.EPOCH) else it }
        }
        return Result.success(Unit)
    }

    override suspend fun archive(id: String): Result<Unit> {
        archived += id
        messages.update { list ->
            list.map { if (it.id == id) it.copy(archivedAt = Instant.EPOCH) else it }
        }
        return Result.success(Unit)
    }

    override suspend fun unarchive(id: String): Result<Unit> {
        unarchived += id
        messages.update { list ->
            list.map { if (it.id == id) it.copy(archivedAt = null) else it }
        }
        return Result.success(Unit)
    }
}
