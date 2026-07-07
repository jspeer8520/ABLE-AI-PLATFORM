# Keep kotlinx.serialization generated serializers for our DTOs.
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**

-keepclassmembers class ai.able.inbox.data.remote.** {
    *** Companion;
}
-keepclasseswithmembers class ai.able.inbox.data.remote.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Retrofit / OkHttp defaults.
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keepattributes Signature
-keepattributes Exceptions
