package ai.able.inbox.ui.inbox

import ai.able.inbox.data.MessageRepository
import ai.able.inbox.data.RefreshResult
import ai.able.inbox.data.model.MessageSource
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Owns and exposes the [InboxUiState] for the inbox screen. It merges the
 * repository's message stream with UI-only concerns (search text, selected
 * source, refresh/offline flags, transient messages) into a single state flow.
 *
 * All backend access goes through [MessageRepository], so the ViewModel is
 * tested against a fake repository with no Android or network dependencies.
 */
class InboxViewModel(
    private val repository: MessageRepository,
) : ViewModel() {

    private val filters = MutableStateFlow(Filters())
    private val control = MutableStateFlow(ControlState())

    val uiState: StateFlow<InboxUiState> = combine(
        repository.observeMessages(),
        filters,
        control,
    ) { messages, f, c ->
        // Archived messages never appear in the inbox view.
        val inbox = messages.filterNot { it.isArchived }
        val visible = inbox
            .filter { f.source == null || it.source == f.source }
            .filter { it.matches(f.query) }

        InboxUiState(
            messages = visible,
            isLoading = c.isLoading,
            isRefreshing = c.isRefreshing,
            searchQuery = f.query,
            selectedSource = f.source,
            isOffline = c.isOffline,
            unreadCount = inbox.count { !it.isRead },
            userMessage = c.userMessage,
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(STOP_TIMEOUT_MILLIS),
        initialValue = InboxUiState(),
    )

    init {
        refresh(isInitial = true)
    }

    // --- Intents ----------------------------------------------------------

    fun onSearchQueryChange(query: String) {
        filters.update { it.copy(query = query) }
    }

    fun onClearSearch() = onSearchQueryChange("")

    /** Selecting the already-selected source toggles back to "All". */
    fun onSourceSelected(source: MessageSource?) {
        filters.update { current ->
            current.copy(source = if (current.source == source) null else source)
        }
    }

    fun onMessageOpened(id: String) {
        viewModelScope.launch {
            repository.markAsRead(id).onFailure {
                // The optimistic local update already succeeded; only surface a
                // note if the upstream sync failed.
                control.update { it.copy(userMessage = UserMessage("Couldn't sync read status")) }
            }
        }
    }

    fun onArchive(id: String) {
        viewModelScope.launch {
            repository.archive(id).onSuccess {
                control.update {
                    it.copy(userMessage = UserMessage("Message archived", undoArchiveId = id))
                }
            }
        }
    }

    fun onUndoArchive(id: String) {
        viewModelScope.launch {
            repository.unarchive(id)
            control.update { it.copy(userMessage = null) }
        }
    }

    fun refresh(isInitial: Boolean = false) {
        viewModelScope.launch {
            control.update {
                if (isInitial) it.copy(isLoading = true) else it.copy(isRefreshing = true)
            }
            when (val result = repository.refresh()) {
                RefreshResult.Success ->
                    control.update { it.copy(isLoading = false, isRefreshing = false, isOffline = false) }
                RefreshResult.Offline ->
                    control.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            isOffline = true,
                            userMessage = if (isInitial) null else UserMessage("Offline — showing cached messages"),
                        )
                    }
                is RefreshResult.Error ->
                    control.update {
                        it.copy(
                            isLoading = false,
                            isRefreshing = false,
                            userMessage = UserMessage("Couldn't refresh: ${result.cause.message ?: "unknown error"}"),
                        )
                    }
            }
        }
    }

    /** Clears a consumed transient [UserMessage] so it isn't shown twice. */
    fun onUserMessageShown() {
        control.update { it.copy(userMessage = null) }
    }

    private data class Filters(
        val query: String = "",
        val source: MessageSource? = null,
    )

    private data class ControlState(
        val isLoading: Boolean = true,
        val isRefreshing: Boolean = false,
        val isOffline: Boolean = false,
        val userMessage: UserMessage? = null,
    )

    companion object {
        private const val STOP_TIMEOUT_MILLIS = 5_000L

        /** Factory so the ViewModel can receive its [repository] dependency. */
        fun provideFactory(repository: MessageRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    require(modelClass.isAssignableFrom(InboxViewModel::class.java)) {
                        "Unknown ViewModel class ${modelClass.name}"
                    }
                    return InboxViewModel(repository) as T
                }
            }
    }
}
