package ai.able.inbox.ui.inbox

import ai.able.inbox.data.model.MessageSource
import androidx.compose.ui.graphics.Color
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

/**
 * UI formatting helpers kept out of composables so they are plain,
 * unit-testable functions.
 */
object InboxFormatting {

    private val timeFormatter = DateTimeFormatter.ofPattern("h:mm a", Locale.getDefault())
    private val dayFormatter = DateTimeFormatter.ofPattern("EEE", Locale.getDefault())
    private val dateFormatter = DateTimeFormatter.ofPattern("MMM d", Locale.getDefault())

    /**
     * Formats [timestamp] relative to [now] the way inbox apps do:
     *  - today            -> time ("10:30 AM")
     *  - within a week     -> weekday ("Tue")
     *  - otherwise         -> short date ("Jan 15")
     */
    fun relativeTimestamp(
        timestamp: Instant,
        now: Instant = Instant.now(),
        zone: ZoneId = ZoneId.systemDefault(),
    ): String {
        val then = timestamp.atZone(zone)
        val current = now.atZone(zone)
        return when {
            then.toLocalDate() == current.toLocalDate() -> timeFormatter.format(then)
            ChronoUnit.DAYS.between(then.toLocalDate(), current.toLocalDate()) in 1..6 ->
                dayFormatter.format(then)
            else -> dateFormatter.format(then)
        }
    }

    /** Stable accent colour per source for the leading avatar/badge. */
    fun sourceColor(source: MessageSource): Color = when (source) {
        MessageSource.GMAIL -> Color(0xFFEA4335)
        MessageSource.OUTLOOK -> Color(0xFF0A66C2)
        MessageSource.SLACK -> Color(0xFF611F69)
        MessageSource.TEAMS -> Color(0xFF5059C9)
        MessageSource.UNKNOWN -> Color(0xFF6B6B6B)
    }

    /** Single-letter avatar fallback derived from the sender name. */
    fun initial(senderName: String): String =
        senderName.trim().firstOrNull()?.uppercase() ?: "?"
}
