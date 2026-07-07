package ai.able.inbox.data.model

/**
 * The upstream integration a [Message] originated from.
 *
 * [wireValue] is the lowercase identifier used by the ABLE API (`source` field),
 * kept separate from the enum name so the API contract and Kotlin naming can
 * evolve independently.
 */
enum class MessageSource(val wireValue: String, val displayName: String) {
    GMAIL("gmail", "Gmail"),
    OUTLOOK("outlook", "Outlook"),
    SLACK("slack", "Slack"),
    TEAMS("teams", "Teams"),
    UNKNOWN("unknown", "Other");

    companion object {
        /**
         * Resolves a wire value (e.g. `"gmail"`) to a [MessageSource], falling
         * back to [UNKNOWN] for sources this client build does not recognise.
         * This keeps the client forward-compatible with new backend sources.
         */
        fun fromWire(value: String?): MessageSource =
            entries.firstOrNull { it.wireValue.equals(value, ignoreCase = true) } ?: UNKNOWN
    }
}
