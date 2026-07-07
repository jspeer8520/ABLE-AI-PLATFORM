package ai.able.inbox.data.mock

import ai.able.inbox.data.model.Message
import ai.able.inbox.data.model.MessageSource
import java.time.Instant
import java.time.temporal.ChronoUnit

/**
 * Deterministic sample data used until the real backend is wired in.
 *
 * Timestamps are computed relative to a fixed [baseInstant] so the data is
 * stable across runs (important for previews and screenshot tests). The set
 * intentionally spans all sources plus read/unread/archived states.
 */
object MockMessages {

    /** Fixed reference point so mock timestamps are reproducible. */
    val baseInstant: Instant = Instant.parse("2024-01-15T10:30:00Z")

    val sample: List<Message> = listOf(
        Message(
            id = "msg_1",
            source = MessageSource.GMAIL,
            senderName = "Alice Nguyen",
            subject = "Q1 planning notes",
            content = "Hi team, I've collected our Q1 objectives. Can everyone review the " +
                "draft and add comments before Friday? Thanks!",
            createdAt = baseInstant,
            readAt = null,
            archivedAt = null,
        ),
        Message(
            id = "msg_2",
            source = MessageSource.OUTLOOK,
            senderName = "Bruno Costa",
            subject = "Invoice #4821",
            content = "Please find attached the invoice for last month's services. Payment " +
                "terms are net 30.",
            createdAt = baseInstant.minus(2, ChronoUnit.HOURS),
            readAt = baseInstant.minus(1, ChronoUnit.HOURS),
            archivedAt = null,
        ),
        Message(
            id = "msg_3",
            source = MessageSource.SLACK,
            senderName = "Carla Diaz",
            subject = "#engineering",
            content = "Deploy to staging is green ✅ — kicking off the smoke tests now.",
            createdAt = baseInstant.minus(5, ChronoUnit.HOURS),
            readAt = null,
            archivedAt = null,
        ),
        Message(
            id = "msg_4",
            source = MessageSource.TEAMS,
            senderName = "David Okafor",
            subject = "Sync moved",
            content = "Heads up: I pushed our 1:1 to 3pm tomorrow. Let me know if that clashes.",
            createdAt = baseInstant.minus(1, ChronoUnit.DAYS),
            readAt = baseInstant.minus(20, ChronoUnit.HOURS),
            archivedAt = null,
        ),
        Message(
            id = "msg_5",
            source = MessageSource.GMAIL,
            senderName = "Emma Larsson",
            subject = "Re: Design review",
            content = "The updated mocks look great. One small note on the empty state — " +
                "let's make the CTA more prominent.",
            createdAt = baseInstant.minus(2, ChronoUnit.DAYS),
            readAt = null,
            archivedAt = null,
        ),
        Message(
            id = "msg_6",
            source = MessageSource.SLACK,
            senderName = "Frank Müller",
            subject = "#random",
            content = "Anyone up for lunch? Trying the new place around the corner.",
            createdAt = baseInstant.minus(3, ChronoUnit.DAYS),
            readAt = baseInstant.minus(3, ChronoUnit.DAYS),
            // Already archived — should not appear in the default inbox view.
            archivedAt = baseInstant.minus(2, ChronoUnit.DAYS),
        ),
        Message(
            id = "msg_7",
            source = MessageSource.OUTLOOK,
            senderName = "Grace Park",
            subject = "Security review scheduled",
            content = "Your requested security review is booked for next Tuesday at 11:00. " +
                "Agenda attached.",
            createdAt = baseInstant.minus(4, ChronoUnit.DAYS),
            readAt = null,
            archivedAt = null,
        ),
        Message(
            id = "msg_8",
            source = MessageSource.TEAMS,
            senderName = "Hassan Ali",
            subject = "Standup summary",
            content = "Recap: API contract frozen, mobile inbox in progress, backend caching " +
                "next. No blockers reported.",
            createdAt = baseInstant.minus(6, ChronoUnit.DAYS),
            readAt = baseInstant.minus(5, ChronoUnit.DAYS),
            archivedAt = null,
        ),
    )
}
