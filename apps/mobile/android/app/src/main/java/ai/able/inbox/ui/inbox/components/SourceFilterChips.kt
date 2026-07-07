package ai.able.inbox.ui.inbox.components

import ai.able.inbox.data.model.MessageSource
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * Horizontally-scrolling row of source filter chips plus an "All" chip.
 * Selecting the active source again clears the filter (handled upstream).
 */
@Composable
fun SourceFilterChips(
    sources: List<MessageSource>,
    selected: MessageSource?,
    onSelect: (MessageSource?) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .horizontalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        FilterChip(
            selected = selected == null,
            onClick = { onSelect(null) },
            label = { Text("All") },
        )
        sources.forEach { source ->
            FilterChip(
                selected = selected == source,
                onClick = { onSelect(source) },
                label = { Text(source.displayName) },
                colors = FilterChipDefaults.filterChipColors(),
            )
        }
    }
}
