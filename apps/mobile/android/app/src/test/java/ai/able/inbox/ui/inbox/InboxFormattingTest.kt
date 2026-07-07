package ai.able.inbox.ui.inbox

import ai.able.inbox.data.model.MessageSource
import com.google.common.truth.Truth.assertThat
import java.time.Instant
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import org.junit.Test

class InboxFormattingTest {

    private val zone = ZoneId.of("UTC")
    private val now = Instant.parse("2024-01-15T15:00:00Z")

    @Test
    fun `same day renders a time`() {
        val ts = Instant.parse("2024-01-15T09:05:00Z")
        val result = InboxFormatting.relativeTimestamp(ts, now, zone)
        // Contains AM/PM marker — locale specific but always has a colon time.
        assertThat(result).contains(":")
    }

    @Test
    fun `within the past week renders a weekday abbreviation`() {
        val ts = now.minus(3, ChronoUnit.DAYS)
        val result = InboxFormatting.relativeTimestamp(ts, now, zone)
        assertThat(result).matches("[A-Za-z]{3}")
    }

    @Test
    fun `older than a week renders a short date`() {
        val ts = now.minus(30, ChronoUnit.DAYS)
        val result = InboxFormatting.relativeTimestamp(ts, now, zone)
        // "MMM d" — includes a digit for the day of month.
        assertThat(result).containsMatch("\\d")
    }

    @Test
    fun `initial takes first letter uppercased`() {
        assertThat(InboxFormatting.initial("alice")).isEqualTo("A")
        assertThat(InboxFormatting.initial("  bob")).isEqualTo("B")
        assertThat(InboxFormatting.initial("")).isEqualTo("?")
    }

    @Test
    fun `every source has a distinct-ish colour and none crash`() {
        MessageSource.entries.forEach { source ->
            // Simply ensure it returns without throwing for all sources.
            InboxFormatting.sourceColor(source)
        }
        assertThat(InboxFormatting.sourceColor(MessageSource.GMAIL))
            .isNotEqualTo(InboxFormatting.sourceColor(MessageSource.SLACK))
    }
}
