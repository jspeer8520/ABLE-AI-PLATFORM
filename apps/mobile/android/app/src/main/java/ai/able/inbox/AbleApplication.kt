package ai.able.inbox

import ai.able.inbox.di.AppContainer
import android.app.Application

/**
 * Application entry point. Constructs the [AppContainer] once and exposes it to
 * the rest of the app. While the backend is being built we run against the
 * mock data source (`useMockBackend = true`).
 */
class AbleApplication : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(context = this, useMockBackend = true)
    }
}
