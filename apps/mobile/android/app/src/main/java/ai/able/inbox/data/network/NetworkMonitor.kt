package ai.able.inbox.data.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.conflate
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOf

/**
 * Reports device connectivity so the repository can decide between a live
 * refresh and serving cached data. Modelled as an interface with a fake in
 * tests, keeping the offline logic fully unit-testable.
 */
interface NetworkMonitor {
    /** Emits the current online state and every subsequent change. */
    val isOnline: Flow<Boolean>
}

/** Always-online monitor, useful for previews and simple test setups. */
object AlwaysOnlineNetworkMonitor : NetworkMonitor {
    override val isOnline: Flow<Boolean> = flowOf(true)
}

/**
 * [NetworkMonitor] backed by the platform [ConnectivityManager]. Emits `true`
 * while a network with [NetworkCapabilities.NET_CAPABILITY_VALIDATED] is
 * available.
 */
class ConnectivityNetworkMonitor(
    private val context: Context,
) : NetworkMonitor {

    override val isOnline: Flow<Boolean> = flow {
        val manager = context.getSystemService(ConnectivityManager::class.java)
        if (manager == null) {
            emit(true) // Fail open: assume online if we cannot query connectivity.
            return@flow
        }
        emit(manager.isCurrentlyOnline())
        emitAll(manager.connectivityEvents())
    }.conflate().distinctUntilChanged()

    private fun ConnectivityManager.isCurrentlyOnline(): Boolean {
        val caps = getNetworkCapabilities(activeNetwork) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
            caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }

    private fun ConnectivityManager.connectivityEvents(): Flow<Boolean> =
        kotlinx.coroutines.flow.callbackFlow {
            val callback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    trySend(isCurrentlyOnline())
                }

                override fun onLost(network: Network) {
                    trySend(isCurrentlyOnline())
                }

                override fun onCapabilitiesChanged(
                    network: Network,
                    caps: NetworkCapabilities,
                ) {
                    trySend(isCurrentlyOnline())
                }
            }
            registerDefaultNetworkCallback(callback)
            awaitClose { unregisterNetworkCallback(callback) }
        }
}

// Small helper so `emitAll` reads naturally above without an extra import line.
private suspend fun <T> kotlinx.coroutines.flow.FlowCollector<T>.emitAll(source: Flow<T>) =
    source.collect { emit(it) }
