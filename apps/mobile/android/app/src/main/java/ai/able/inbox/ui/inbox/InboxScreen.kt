package ai.able.inbox.ui.inbox

import ai.able.inbox.data.model.Message
import ai.able.inbox.ui.inbox.components.InboxEmptyState
import ai.able.inbox.ui.inbox.components.InboxSearchBar
import ai.able.inbox.ui.inbox.components.MessageListItem
import ai.able.inbox.ui.inbox.components.OfflineBanner
import ai.able.inbox.ui.inbox.components.SourceFilterChips
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Archive
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.SwipeToDismissBox
import androidx.compose.material3.SwipeToDismissBoxValue
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.rememberSwipeToDismissBoxState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import java.time.Instant

/**
 * Stateful inbox entry point. Binds the [InboxViewModel] to the stateless
 * [InboxContent] and wires snackbar / undo handling.
 */
@Composable
fun InboxScreen(
    viewModel: InboxViewModel,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    // Surface transient one-shot messages (archive confirmation, errors) and
    // offer undo where applicable.
    LaunchedEffect(state.userMessage) {
        val message = state.userMessage ?: return@LaunchedEffect
        val result = snackbarHostState.showSnackbar(
            message = message.text,
            actionLabel = message.undoArchiveId?.let { "Undo" },
            duration = SnackbarDuration.Short,
        )
        if (result == SnackbarResult.ActionPerformed && message.undoArchiveId != null) {
            viewModel.onUndoArchive(message.undoArchiveId)
        }
        viewModel.onUserMessageShown()
    }

    InboxContent(
        state = state,
        snackbarHostState = snackbarHostState,
        onSearchQueryChange = viewModel::onSearchQueryChange,
        onClearSearch = viewModel::onClearSearch,
        onSourceSelected = viewModel::onSourceSelected,
        onMessageOpened = viewModel::onMessageOpened,
        onArchive = viewModel::onArchive,
        onRefresh = { viewModel.refresh() },
        modifier = modifier,
    )
}

/**
 * Stateless inbox UI. Everything is passed in, so it renders identically in
 * previews and Compose UI tests without a ViewModel.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InboxContent(
    state: InboxUiState,
    snackbarHostState: SnackbarHostState,
    onSearchQueryChange: (String) -> Unit,
    onClearSearch: () -> Unit,
    onSourceSelected: (ai.able.inbox.data.model.MessageSource?) -> Unit,
    onMessageOpened: (String) -> Unit,
    onArchive: (String) -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
    now: Instant = Instant.now(),
) {
    Scaffold(
        modifier = modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = {
                    val suffix = if (state.unreadCount > 0) " · ${state.unreadCount} unread" else ""
                    Text("Inbox$suffix")
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
    ) { padding ->
        Column(Modifier.padding(padding)) {
            InboxSearchBar(
                query = state.searchQuery,
                onQueryChange = onSearchQueryChange,
                onClear = onClearSearch,
            )
            SourceFilterChips(
                sources = state.availableSources,
                selected = state.selectedSource,
                onSelect = onSourceSelected,
            )
            if (state.isOffline) OfflineBanner()

            PullToRefreshBox(
                isRefreshing = state.isRefreshing,
                onRefresh = onRefresh,
                modifier = Modifier.fillMaxSize(),
            ) {
                when {
                    state.isLoading -> LoadingState()
                    state.isEmpty -> InboxEmptyState(filtered = state.isFilteredEmpty)
                    else -> MessageList(
                        messages = state.messages,
                        now = now,
                        onMessageOpened = onMessageOpened,
                        onArchive = onArchive,
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MessageList(
    messages: List<Message>,
    now: Instant,
    onMessageOpened: (String) -> Unit,
    onArchive: (String) -> Unit,
) {
    LazyColumn(Modifier.fillMaxSize()) {
        items(messages, key = { it.id }) { message ->
            val dismissState = rememberSwipeToDismissBoxState(
                confirmValueChange = { value ->
                    if (value != SwipeToDismissBoxValue.Settled) {
                        onArchive(message.id)
                        true
                    } else {
                        false
                    }
                },
            )

            SwipeToDismissBox(
                state = dismissState,
                backgroundContent = { ArchiveSwipeBackground() },
            ) {
                MessageListItem(
                    message = message,
                    now = now,
                    modifier = Modifier
                        .background(MaterialTheme.colorScheme.surface)
                        .clickable { onMessageOpened(message.id) },
                )
            }
            HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
        }
    }
}

@Composable
private fun ArchiveSwipeBackground() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.primary)
            .padding(horizontal = 24.dp),
        contentAlignment = Alignment.CenterStart,
    ) {
        Icon(
            Icons.Default.Archive,
            contentDescription = "Archive",
            tint = MaterialTheme.colorScheme.onPrimary,
        )
    }
}

@Composable
private fun LoadingState() {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}
