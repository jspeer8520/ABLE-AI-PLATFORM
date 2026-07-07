package ai.able.inbox.ui.inbox

import ai.able.inbox.data.model.Message
import ai.able.inbox.data.model.MessageSource

/**
 * Immutable snapshot the [ai.able.inbox.ui.inbox.InboxScreen] renders from.
 * Everything the UI needs is derived here so the composable stays declarative.
 */
data class InboxUiState(
    /** Visible messages after archive/source/search filtering, newest first. */
    val messages: List<Message> = emptyList(),
    /** True during the very first load before any cache is available. */
    val isLoading: Boolean = true,
    /** True while a pull-to-refresh / manual refresh is in flight. */
    val isRefreshing: Boolean = false,
    val searchQuery: String = "",
    /** Selected source filter, or null for "All". */
    val selectedSource: MessageSource? = null,
    /** Sources offered as filter chips. */
    val availableSources: List<MessageSource> = DEFAULT_SOURCES,
    /** True when serving cached data because the device is offline. */
    val isOffline: Boolean = false,
    /** Unread count across the whole (non-archived) inbox. */
    val unreadCount: Int = 0,
    /** Transient message for a snackbar (e.g. archive confirmation / error). */
    val userMessage: UserMessage? = null,
) {
    /** True when there are no messages to show for the current filters. */
    val isEmpty: Boolean get() = messages.isEmpty() && !isLoading

    /** True when the empty state is due to filtering rather than no data. */
    val isFilteredEmpty: Boolean
        get() = isEmpty && (searchQuery.isNotBlank() || selectedSource != null)

    companion object {
        val DEFAULT_SOURCES: List<MessageSource> = listOf(
            MessageSource.GMAIL,
            MessageSource.OUTLOOK,
            MessageSource.SLACK,
            MessageSource.TEAMS,
        )
    }
}

/**
 * A one-shot message for the UI, optionally with an undo action targeting a
 * specific message id (used for swipe-to-archive undo).
 */
data class UserMessage(
    val text: String,
    val undoArchiveId: String? = null,
)
