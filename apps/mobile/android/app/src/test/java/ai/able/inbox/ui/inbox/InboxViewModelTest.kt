package ai.able.inbox.ui.inbox

import ai.able.inbox.data.RefreshResult
import ai.able.inbox.data.model.MessageSource
import ai.able.inbox.util.FakeMessageRepository
import ai.able.inbox.util.MainDispatcherRule
import ai.able.inbox.util.message
import app.cash.turbine.test
import com.google.common.truth.Truth.assertThat
import java.io.IOException
import java.time.Instant
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class InboxViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private val seed = listOf(
        message("a", source = MessageSource.GMAIL, sender = "Alice", subject = "Hello"),
        message("b", source = MessageSource.SLACK, sender = "Bob", subject = "Standup"),
        message("c", source = MessageSource.GMAIL, sender = "Carol", subject = "Report", readAt = Instant.EPOCH),
    )

    private fun viewModel(
        repo: FakeMessageRepository = FakeMessageRepository(seed),
    ): Pair<InboxViewModel, FakeMessageRepository> = InboxViewModel(repo) to repo

    @Test
    fun `initial state triggers a refresh and exposes messages`() = runTest {
        val (vm, repo) = viewModel()
        vm.uiState.test {
            val state = awaitItem()
            assertThat(state.messages.map { it.id }).containsExactly("a", "b", "c")
            assertThat(repo.refreshCount).isEqualTo(1)
            assertThat(state.isLoading).isFalse()
        }
    }

    @Test
    fun `unread count excludes read messages`() = runTest {
        val (vm, _) = viewModel()
        vm.uiState.test {
            assertThat(awaitItem().unreadCount).isEqualTo(2) // a and b unread, c read
        }
    }

    @Test
    fun `search filters by query across fields`() = runTest {
        val (vm, _) = viewModel()
        vm.uiState.test {
            skipItems(1)
            vm.onSearchQueryChange("bob")
            val state = awaitItem()
            assertThat(state.messages.map { it.id }).containsExactly("b")
            assertThat(state.searchQuery).isEqualTo("bob")
        }
    }

    @Test
    fun `clearing search restores all messages`() = runTest {
        val (vm, _) = viewModel()
        vm.uiState.test {
            skipItems(1)
            vm.onSearchQueryChange("bob")
            skipItems(1)
            vm.onClearSearch()
            assertThat(awaitItem().messages).hasSize(3)
        }
    }

    @Test
    fun `source filter narrows to a single source`() = runTest {
        val (vm, _) = viewModel()
        vm.uiState.test {
            skipItems(1)
            vm.onSourceSelected(MessageSource.GMAIL)
            val state = awaitItem()
            assertThat(state.messages.map { it.id }).containsExactly("a", "c")
            assertThat(state.selectedSource).isEqualTo(MessageSource.GMAIL)
        }
    }

    @Test
    fun `selecting the active source again clears the filter`() = runTest {
        val (vm, _) = viewModel()
        vm.uiState.test {
            skipItems(1)
            vm.onSourceSelected(MessageSource.GMAIL)
            skipItems(1)
            vm.onSourceSelected(MessageSource.GMAIL)
            assertThat(awaitItem().selectedSource).isNull()
        }
    }

    @Test
    fun `archived messages are excluded from the inbox`() = runTest {
        val (vm, repo) = viewModel()
        vm.uiState.test {
            skipItems(1)
            vm.onArchive("a")
            // Two emissions may occur (list change + snackbar message); take the
            // one where the archived item is gone.
            val state = awaitItem()
            assertThat(state.messages.map { it.id }).doesNotContain("a")
            assertThat(repo.archived).containsExactly("a")
        }
    }

    @Test
    fun `opening a message marks it read`() = runTest {
        val (vm, repo) = viewModel()
        vm.uiState.test {
            skipItems(1)
            vm.onMessageOpened("a")
            awaitItem() // read-state update propagates
            assertThat(repo.markedRead).containsExactly("a")
        }
    }

    @Test
    fun `offline refresh surfaces offline flag`() = runTest {
        val repo = FakeMessageRepository(seed).apply { nextRefreshResult = RefreshResult.Offline }
        val (vm, _) = viewModel(repo)
        vm.uiState.test {
            // Eventually the offline flag is set after refresh completes.
            val states = mutableListOf(awaitItem())
            while (!states.last().isOffline && states.size < 5) states.add(awaitItem())
            assertThat(states.last().isOffline).isTrue()
        }
    }

    @Test
    fun `refresh error produces a user message`() = runTest {
        val repo = FakeMessageRepository(seed).apply {
            nextRefreshResult = RefreshResult.Error(IOException("boom"))
        }
        val (vm, _) = viewModel(repo)
        vm.uiState.test {
            val states = mutableListOf(awaitItem())
            while (states.last().userMessage == null && states.size < 5) states.add(awaitItem())
            assertThat(states.last().userMessage?.text).contains("boom")
        }
    }

    @Test
    fun `onUserMessageShown clears the transient message`() = runTest {
        val repo = FakeMessageRepository(seed).apply {
            nextRefreshResult = RefreshResult.Error(IOException("boom"))
        }
        val (vm, _) = viewModel(repo)
        vm.uiState.test {
            val states = mutableListOf(awaitItem())
            while (states.last().userMessage == null && states.size < 5) states.add(awaitItem())
            vm.onUserMessageShown()
            assertThat(awaitItem().userMessage).isNull()
        }
    }

    @Test
    fun `undo archive restores the message`() = runTest {
        val (vm, repo) = viewModel()
        vm.uiState.test {
            skipItems(1)
            vm.onArchive("a")
            skipItems(1)
            vm.onUndoArchive("a")
            val states = mutableListOf(awaitItem())
            while (!states.last().messages.any { it.id == "a" } && states.size < 5) {
                states.add(awaitItem())
            }
            assertThat(states.last().messages.map { it.id }).contains("a")
            assertThat(repo.unarchived).containsExactly("a")
        }
    }
}
