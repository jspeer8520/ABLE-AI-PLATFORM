package ai.able.inbox.data.model

import ai.able.inbox.util.message
import com.google.common.truth.Truth.assertThat
import java.time.Instant
import org.junit.Test

class MessageTest {

    @Test
    fun `isRead reflects readAt presence`() {
        assertThat(message("a", readAt = null).isRead).isFalse()
        assertThat(message("a", readAt = Instant.EPOCH).isRead).isTrue()
    }

    @Test
    fun `isArchived reflects archivedAt presence`() {
        assertThat(message("a", archivedAt = null).isArchived).isFalse()
        assertThat(message("a", archivedAt = Instant.EPOCH).isArchived).isTrue()
    }

    @Test
    fun `preview collapses whitespace and truncates with ellipsis`() {
        val msg = message("a", content = "line one\n\n   line   two   that keeps going")
        val preview = msg.preview(maxChars = 12)
        assertThat(preview).endsWith("…")
        assertThat(preview).doesNotContain("\n")
        assertThat(preview.length).isAtMost(13) // 12 chars + ellipsis
    }

    @Test
    fun `preview returns full text when under limit`() {
        val msg = message("a", content = "short")
        assertThat(msg.preview(maxChars = 20)).isEqualTo("short")
    }

    @Test
    fun `matches is case-insensitive across sender subject and content`() {
        val msg = message(
            "a",
            sender = "Alice",
            subject = "Quarterly report",
            content = "Numbers look great",
        )
        assertThat(msg.matches("alice")).isTrue()
        assertThat(msg.matches("QUARTERLY")).isTrue()
        assertThat(msg.matches("great")).isTrue()
        assertThat(msg.matches("nonexistent")).isFalse()
    }

    @Test
    fun `blank query matches everything`() {
        val msg = message("a")
        assertThat(msg.matches("")).isTrue()
        assertThat(msg.matches("   ")).isTrue()
    }
}
