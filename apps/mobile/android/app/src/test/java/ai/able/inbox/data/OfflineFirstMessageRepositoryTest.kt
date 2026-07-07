package ai.able.inbox.data

import ai.able.inbox.data.local.InMemoryMessageLocalDataSource
import ai.able.inbox.data.mock.MockMessageRemoteDataSource
import ai.able.inbox.util.FakeNetworkMonitor
import ai.able.inbox.util.message
import com.google.common.truth.Truth.assertThat
import java.time.Instant
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Test

class OfflineFirstMessageRepositoryTest {

    private val fixedNow = Instant.parse("2024-02-01T00:00:00Z")

    private fun repo(
        seed: List<ai.able.inbox.data.model.Message> = listOf(message("a"), message("b")),
        online: Boolean = true,
        local: InMemoryMessageLocalDataSource = InMemoryMessageLocalDataSource(),
    ): Triple<OfflineFirstMessageRepository, MockMessageRemoteDataSource, FakeNetworkMonitor> {
        val remote = MockMessageRemoteDataSource(seed = seed)
        val monitor = FakeNetworkMonitor(online = online)
        val repository = OfflineFirstMessageRepository(
            remote = remote,
            local = local,
            networkMonitor = monitor,
            now = { fixedNow },
        )
        return Triple(repository, remote, monitor)
    }

    @Test
    fun `refresh online loads remote into cache and returns Success`() = runTest {
        val (repository, _, _) = repo(seed = listOf(message("a"), message("b")))
        val result = repository.refresh()
        assertThat(result).isEqualTo(RefreshResult.Success)
        assertThat(repository.observeMessages().first().map { it.id })
            .containsExactly("a", "b")
    }

    @Test
    fun `refresh offline returns Offline and keeps existing cache`() = runTest {
        val local = InMemoryMessageLocalDataSource(listOf(message("cached")))
        val (repository, _, _) = repo(online = false, local = local)
        val result = repository.refresh()
        assertThat(result).isEqualTo(RefreshResult.Offline)
        assertThat(repository.observeMessages().first().map { it.id }).containsExactly("cached")
    }

    @Test
    fun `refresh error is captured and cache preserved`() = runTest {
        val local = InMemoryMessageLocalDataSource(listOf(message("cached")))
        val (repository, remote, _) = repo(local = local)
        remote.failNextFetch = true
        val result = repository.refresh()
        assertThat(result).isInstanceOf(RefreshResult.Error::class.java)
        assertThat(repository.observeMessages().first().map { it.id }).containsExactly("cached")
    }

    @Test
    fun `markAsRead sets readAt optimistically in cache`() = runTest {
        val (repository, _, _) = repo(seed = listOf(message("a", readAt = null)))
        repository.refresh()
        val result = repository.markAsRead("a")
        assertThat(result.isSuccess).isTrue()
        val stored = repository.observeMessages().first().first { it.id == "a" }
        assertThat(stored.readAt).isEqualTo(fixedNow)
    }

    @Test
    fun `markAsRead on already-read message is a no-op success`() = runTest {
        val (repository, _, _) = repo(seed = listOf(message("a", readAt = Instant.EPOCH)))
        repository.refresh()
        assertThat(repository.markAsRead("a").isSuccess).isTrue()
    }

    @Test
    fun `markAsRead on unknown id fails`() = runTest {
        val (repository, _, _) = repo()
        repository.refresh()
        assertThat(repository.markAsRead("ghost").isFailure).isTrue()
    }

    @Test
    fun `archive sets archivedAt and unarchive clears it`() = runTest {
        val (repository, _, _) = repo(seed = listOf(message("a")))
        repository.refresh()

        repository.archive("a")
        assertThat(repository.observeMessages().first().first { it.id == "a" }.archivedAt)
            .isEqualTo(fixedNow)

        repository.unarchive("a")
        assertThat(repository.observeMessages().first().first { it.id == "a" }.archivedAt)
            .isNull()
    }

    @Test
    fun `refresh preserves locally-archived state not known to backend`() = runTest {
        val (repository, _, _) = repo(seed = listOf(message("a"), message("b")))
        repository.refresh()
        repository.archive("a")

        // A second refresh pulls fresh (non-archived) data from remote, but the
        // local archive on "a" must survive.
        repository.refresh()
        val a = repository.observeMessages().first().first { it.id == "a" }
        assertThat(a.isArchived).isTrue()
    }
}
