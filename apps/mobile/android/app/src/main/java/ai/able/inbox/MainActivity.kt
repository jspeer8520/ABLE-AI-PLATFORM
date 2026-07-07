package ai.able.inbox

import ai.able.inbox.ui.inbox.InboxScreen
import ai.able.inbox.ui.inbox.InboxViewModel
import ai.able.inbox.ui.theme.AbleInboxTheme
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val container = (application as AbleApplication).container

        setContent {
            AbleInboxTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                ) {
                    val viewModel: InboxViewModel = viewModel(
                        factory = InboxViewModel.provideFactory(container.messageRepository),
                    )
                    InboxScreen(viewModel = viewModel)
                }
            }
        }
    }
}
