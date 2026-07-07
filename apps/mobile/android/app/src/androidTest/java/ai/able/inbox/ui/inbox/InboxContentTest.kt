package ai.able.inbox.ui.inbox

import ai.able.inbox.data.model.MessageSource
import ai.able.inbox.ui.inbox.components.SEARCH_FIELD_TAG
import ai.able.inbox.ui.theme.AbleInboxTheme
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.remember
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import ai.able.inbox.util.message
import java.time.Instant
import org.junit.Rule
import org.junit.Test

/**
 * Instrumented Compose UI test for the stateless [InboxContent]. Runs on a
 * device/emulator (androidTest); complements the JVM unit tests which cover the
 * ViewModel and data layers.
 */
class InboxContentTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val messages = listOf(
        message("a", source = MessageSource.GMAIL, sender = "Alice", subject = "Hello"),
        message("b", source = MessageSource.SLACK, sender = "Bob", subject = "Standup"),
    )

    private fun setContent(
        state: InboxUiState,
        onSearchQueryChange: (String) -> Unit = {},
        onMessageOpened: (String) -> Unit = {},
    ) {
        composeRule.setContent {
            AbleInboxTheme {
                val host = remember { SnackbarHostState() }
                InboxContent(
                    state = state,
                    snackbarHostState = host,
                    onSearchQueryChange = onSearchQueryChange,
                    onClearSearch = {},
                    onSourceSelected = {},
                    onMessageOpened = onMessageOpened,
                    onArchive = {},
                    onRefresh = {},
                    now = Instant.parse("2024-01-15T12:00:00Z"),
                )
            }
        }
    }

    @Test
    fun rendersMessagesAndUnreadCount() {
        setContent(InboxUiState(messages = messages, isLoading = false, unreadCount = 2))
        composeRule.onNodeWithText("Alice").assertIsDisplayed()
        composeRule.onNodeWithText("Bob").assertIsDisplayed()
        composeRule.onNodeWithText("Inbox · 2 unread").assertIsDisplayed()
    }

    @Test
    fun typingInSearchInvokesCallback() {
        val captured = StringBuilder()
        setContent(
            InboxUiState(messages = messages, isLoading = false),
            onSearchQueryChange = { captured.append(it) },
        )
        composeRule.onNodeWithTag(SEARCH_FIELD_TAG).performTextInput("Bob")
        assert(captured.toString().contains("Bob"))
    }

    @Test
    fun tappingMessageInvokesOpenCallback() {
        var opened: String? = null
        setContent(
            InboxUiState(messages = messages, isLoading = false),
            onMessageOpened = { opened = it },
        )
        composeRule.onNodeWithText("Alice").performClick()
        assert(opened == "a")
    }

    @Test
    fun emptyStateShownWhenNoMessages() {
        setContent(InboxUiState(messages = emptyList(), isLoading = false))
        composeRule.onNodeWithText("Inbox zero").assertIsDisplayed()
    }

    @Test
    fun filteredEmptyStateShownWhenSearchHasNoMatches() {
        setContent(
            InboxUiState(
                messages = emptyList(),
                isLoading = false,
                searchQuery = "zzz",
            ),
        )
        composeRule.onNodeWithText("No matches").assertIsDisplayed()
    }
}
