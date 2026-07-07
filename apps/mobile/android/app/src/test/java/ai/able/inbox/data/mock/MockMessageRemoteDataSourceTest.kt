package ai.able.inbox.data.mock

import ai.able.inbox.util.message
import com.google.common.truth.Truth.assertThat
import java.io.IOException
import java.time.Instant
import kotlinx.coroutines.test.runTest
import org.junit.Test

class MockMessageRemoteDataSourceTest {

    @Test
    fun `fetchMessages returns seed sorted newest first`() = runTest {
        val ds = MockMessageRemoteDataSource(
            seed = listOf(
                message("old", createdAt = Instant.parse("2024-01-10T10:00:00Z")),
                message("new", createdAt = Instant.parse("2024-01-20T10:00:00Z")),
            ),
        )
        assertThat(ds.fetchMessages().map { it.id }).containsExactly("new", "old").inOrder()
    }

    @Test
    fun `default seed exposes the sample data`() = runTest {
        val ds = MockMessageRemoteDataSource()
        assertThat(ds.fetchMessages()).isNotEmpty()
    }

    @Test(expected = IOException::class)
    fun `failNextFetch throws once`() = runTest {
        val ds = MockMessageRemoteDataSource(seed = listOf(message("a")))
        ds.failNextFetch = true
        ds.fetchMessages()
    }

    @Test
    fun `failNextFetch resets after throwing`() = runTest {
        val ds = MockMessageRemoteDataSource(seed = listOf(message("a")))
        ds.failNextFetch = true
        runCatching { ds.fetchMessages() }
        // Second call should succeed.
        assertThat(ds.fetchMessages().map { it.id }).containsExactly("a")
    }

    @Test
    fun `setRead persists across fetches`() = runTest {
        val ds = MockMessageRemoteDataSource(seed = listOf(message("a", readAt = null)))
        ds.setRead("a", read = true)
        assertThat(ds.fetchMessages().first { it.id == "a" }.isRead).isTrue()

        ds.setRead("a", read = false)
        assertThat(ds.fetchMessages().first { it.id == "a" }.isRead).isFalse()
    }

    @Test(expected = NoSuchElementException::class)
    fun `setRead on unknown id throws`() = runTest {
        val ds = MockMessageRemoteDataSource(seed = emptyList())
        ds.setRead("ghost", read = true)
    }
}
