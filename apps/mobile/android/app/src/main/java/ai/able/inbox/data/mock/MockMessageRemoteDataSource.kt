package ai.able.inbox.data.mock

import ai.able.inbox.data.model.Message
import ai.able.inbox.data.remote.MessageRemoteDataSource
import kotlinx.coroutines.delay
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * In-memory [MessageRemoteDataSource] that stands in for the backend until the
 * real API is available. It simulates:
 *  - network latency ([latencyMillis]),
 *  - a toggleable failure mode ([failNextFetch]) to exercise error handling,
 *  - server-side persistence of read state across fetches.
 *
 * State mutations are guarded by a [Mutex] so concurrent coroutine access is
 * safe. This class is deterministic and fully unit-testable.
 */
class MockMessageRemoteDataSource(
    seed: List<Message> = MockMessages.sample,
    private val latencyMillis: Long = 0L,
) : MessageRemoteDataSource {

    private val mutex = Mutex()
    private val store: MutableMap<String, Message> =
        seed.associateBy { it.id }.toMutableMap()

    /** When true, the next [fetchMessages] call throws to simulate an outage. */
    @Volatile
    var failNextFetch: Boolean = false

    override suspend fun fetchMessages(): List<Message> {
        if (latencyMillis > 0) delay(latencyMillis)
        if (failNextFetch) {
            failNextFetch = false
            throw java.io.IOException("Simulated network failure")
        }
        return mutex.withLock { store.values.sortedByDescending { it.createdAt } }
    }

    override suspend fun setRead(id: String, read: Boolean) {
        if (latencyMillis > 0) delay(latencyMillis)
        mutex.withLock {
            val current = store[id] ?: throw NoSuchElementException("Unknown message $id")
            store[id] = current.copy(
                readAt = if (read) (current.readAt ?: MockMessages.baseInstant) else null,
            )
        }
    }
}
