package ai.able.inbox.data.remote

import ai.able.inbox.data.model.MessageSource
import com.google.common.truth.Truth.assertThat
import java.time.Instant
import org.junit.Test

class MessageMappersTest {

    @Test
    fun `maps all fields from the API contract`() {
        val dto = MessageDto(
            id = "msg_1",
            source = "gmail",
            senderName = "Alice",
            subject = "Hi",
            content = "Hello...",
            createdAt = "2024-01-15T10:30:00Z",
            readAt = null,
            archivedAt = null,
        )

        val domain = dto.toDomain()

        assertThat(domain.id).isEqualTo("msg_1")
        assertThat(domain.source).isEqualTo(MessageSource.GMAIL)
        assertThat(domain.senderName).isEqualTo("Alice")
        assertThat(domain.subject).isEqualTo("Hi")
        assertThat(domain.content).isEqualTo("Hello...")
        assertThat(domain.createdAt).isEqualTo(Instant.parse("2024-01-15T10:30:00Z"))
        assertThat(domain.readAt).isNull()
        assertThat(domain.archivedAt).isNull()
        assertThat(domain.isRead).isFalse()
    }

    @Test
    fun `parses optional timestamps when present`() {
        val dto = MessageDto(
            id = "msg_2",
            source = "slack",
            senderName = "Bob",
            subject = "s",
            content = "c",
            createdAt = "2024-01-15T10:30:00Z",
            readAt = "2024-01-15T12:00:00Z",
            archivedAt = "2024-01-16T09:00:00Z",
        )

        val domain = dto.toDomain()

        assertThat(domain.readAt).isEqualTo(Instant.parse("2024-01-15T12:00:00Z"))
        assertThat(domain.archivedAt).isEqualTo(Instant.parse("2024-01-16T09:00:00Z"))
        assertThat(domain.isRead).isTrue()
        assertThat(domain.isArchived).isTrue()
    }

    @Test
    fun `malformed createdAt falls back to epoch and does not throw`() {
        val dto = MessageDto(
            id = "bad",
            source = "gmail",
            senderName = "X",
            subject = "s",
            content = "c",
            createdAt = "not-a-date",
        )

        assertThat(dto.toDomain().createdAt).isEqualTo(Instant.EPOCH)
    }

    @Test
    fun `malformed optional timestamp becomes null`() {
        val dto = MessageDto(
            id = "bad2",
            source = "gmail",
            senderName = "X",
            subject = "s",
            content = "c",
            createdAt = "2024-01-15T10:30:00Z",
            readAt = "garbage",
        )

        assertThat(dto.toDomain().readAt).isNull()
    }

    @Test
    fun `response maps whole list`() {
        val response = MessagesResponse(
            messages = listOf(
                MessageDto("a", "gmail", "A", "s", "c", "2024-01-15T10:30:00Z"),
                MessageDto("b", "teams", "B", "s", "c", "2024-01-15T11:30:00Z"),
            ),
            total = 2,
        )

        val domain = response.toDomain()

        assertThat(domain).hasSize(2)
        assertThat(domain.map { it.id }).containsExactly("a", "b").inOrder()
    }
}
