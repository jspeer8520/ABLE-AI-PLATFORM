package ai.able.inbox.ui.inbox.components

import ai.able.inbox.data.model.Message
import ai.able.inbox.data.model.MessageSource
import ai.able.inbox.ui.inbox.InboxFormatting
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import java.time.Instant

/**
 * A single inbox row: source-coloured avatar, sender + timestamp, subject,
 * body preview and an unread indicator. Unread rows are weighted more heavily.
 */
@Composable
fun MessageListItem(
    message: Message,
    now: Instant,
    modifier: Modifier = Modifier,
) {
    val unread = !message.isRead
    val emphasis = if (unread) FontWeight.SemiBold else FontWeight.Normal
    val statusText = if (unread) "unread" else "read"

    Row(
        modifier = modifier
            .fillMaxWidth()
            .semantics {
                contentDescription =
                    "$statusText message from ${message.senderName}, ${message.subject}"
            }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.Top,
    ) {
        SourceAvatar(message.senderName, message.source)

        Spacer(Modifier.width(12.dp))

        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = message.senderName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = emphasis,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = InboxFormatting.relativeTimestamp(message.createdAt, now),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                )
                if (unread) {
                    Spacer(Modifier.width(6.dp))
                    Box(
                        Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary),
                    )
                }
            }

            Text(
                text = message.subject,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = emphasis,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                text = message.preview(),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
        }
    }
}

@Composable
private fun SourceAvatar(senderName: String, source: MessageSource) {
    val color = InboxFormatting.sourceColor(source)
    Surface(
        modifier = Modifier.size(40.dp),
        shape = CircleShape,
        color = color.copy(alpha = 0.15f),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = InboxFormatting.initial(senderName),
                style = MaterialTheme.typography.titleMedium,
                color = darken(color),
            )
        }
    }
}

/** Slightly darkened source colour for legible text on the tinted avatar. */
private fun darken(color: Color, factor: Float = 0.7f): Color =
    Color(
        red = color.red * factor,
        green = color.green * factor,
        blue = color.blue * factor,
        alpha = 1f,
    )
