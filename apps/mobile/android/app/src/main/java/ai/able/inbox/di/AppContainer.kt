package ai.able.inbox.di

import ai.able.inbox.BuildConfig
import ai.able.inbox.data.MessageRepository
import ai.able.inbox.data.OfflineFirstMessageRepository
import ai.able.inbox.data.local.InMemoryMessageLocalDataSource
import ai.able.inbox.data.mock.MockMessageRemoteDataSource
import ai.able.inbox.data.network.ConnectivityNetworkMonitor
import ai.able.inbox.data.network.NetworkMonitor
import ai.able.inbox.data.remote.ApiMessageRemoteDataSource
import ai.able.inbox.data.remote.MessageApi
import ai.able.inbox.data.remote.MessageRemoteDataSource
import android.content.Context
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

/**
 * Minimal manual dependency-injection container. Kept deliberately small
 * (no Hilt) to avoid an extra framework for a single-screen app.
 *
 * Swapping the mock backend for the real API is a ONE-LINE change here: set
 * [useMockBackend] to `false`. Everything above the [MessageRemoteDataSource]
 * boundary — repository, ViewModel, UI, tests — is unaffected.
 */
class AppContainer(
    private val context: Context,
    private val useMockBackend: Boolean = true,
) {

    val networkMonitor: NetworkMonitor by lazy {
        ConnectivityNetworkMonitor(context.applicationContext)
    }

    private val remoteDataSource: MessageRemoteDataSource by lazy {
        if (useMockBackend) {
            MockMessageRemoteDataSource(latencyMillis = 600L)
        } else {
            ApiMessageRemoteDataSource(buildMessageApi())
        }
    }

    val messageRepository: MessageRepository by lazy {
        OfflineFirstMessageRepository(
            remote = remoteDataSource,
            local = InMemoryMessageLocalDataSource(),
            networkMonitor = networkMonitor,
        )
    }

    private fun buildMessageApi(): MessageApi {
        val json = Json {
            ignoreUnknownKeys = true
            coerceInputValues = true
        }
        val client = OkHttpClient.Builder().build()
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(client)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
            .create(MessageApi::class.java)
    }
}
