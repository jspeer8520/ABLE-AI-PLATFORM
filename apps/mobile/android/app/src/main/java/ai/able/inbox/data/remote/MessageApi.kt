package ai.able.inbox.data.remote

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path

/**
 * Retrofit definition of the ABLE messages API.
 *
 *   GET   /api/messages
 *   PATCH /api/messages/{id}/read
 *
 * This interface is what the real [ApiMessageRemoteDataSource] talks to once
 * the backend is available; until then [MockMessageRemoteDataSource] is used
 * in its place. See [ai.able.inbox.di.AppContainer].
 */
interface MessageApi {

    @GET("api/messages")
    suspend fun getMessages(): MessagesResponse

    @PATCH("api/messages/{id}/read")
    suspend fun markRead(
        @Path("id") id: String,
        @Body body: MarkReadRequest,
    ): MutationResponse
}
