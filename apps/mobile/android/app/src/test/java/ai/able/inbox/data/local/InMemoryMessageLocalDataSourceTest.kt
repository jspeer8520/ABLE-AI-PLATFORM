package ai.able.inbox.data.local

import ai.able.inbox.util.message
import app.cash.turbine.test
import com.google.common.truth.Truth.assertThat
import java.time.Instant
import kotlinx.coroutines.test.runTest
import org.junit.Test

class InMemoryMessageLocalDataSourceTest {

    private val older = message("old", createdAt = Instant.parse("2024-01-10T10:00:00Z"))
    private val newer = message("new", createdAt = Instant.parse("2024-01-15T10:00:00Z"))

    @Test
    fun `starts empty and reports no data`() {
        val ds = InMemoryMessageLocalDataSource()
        assertThat(ds.current()).isEmpty()
        assertThat(ds.hasData()).isFalse()
    }

    @Test
    fun `replaceAll sorts newest first`() = runTest {
        val ds = InMemoryMessageLocalDataSource()
        ds.replaceAll(listOf(older, newer))
        assertThat(ds.current().map { it.id }).containsExactly("new", "old").inOrder()
        assertThat(ds.hasData()).isTrue()
    }

    @Test
    fun `upsert updates existing message in place`() = runTest {
        val ds = InMemoryMessageLocalDataSource(listOf(newer, older))
        ds.upsert(newer.copy(subject = "changed"))
        val updated = ds.current().first { it.id == "new" }
        assertThat(updated.subject).isEqualTo("changed")
        assertThat(ds.current()).hasSize(2)
    }

    @Test
    fun `upsert inserts new message and re-sorts`() = runTest {
        val ds = InMemoryMessageLocalDataSource(listOf(older))
        ds.upsert(newer)
        assertThat(ds.current().map { it.id }).containsExactly("new", "old").inOrder()
    }

    @Test
    fun `observeMessages emits initial and subsequent states`() = runTest {
        val ds = InMemoryMessageLocalDataSource(listOf(older))
        ds.observeMessages().test {
            assertThat(awaitItem().map { it.id }).containsExactly("old")
            ds.upsert(newer)
            assertThat(awaitItem().map { it.id }).containsExactly("new", "old").inOrder()
        }
    }
}
