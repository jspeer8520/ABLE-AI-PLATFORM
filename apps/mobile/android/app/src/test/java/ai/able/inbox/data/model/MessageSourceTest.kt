package ai.able.inbox.data.model

import com.google.common.truth.Truth.assertThat
import org.junit.Test

class MessageSourceTest {

    @Test
    fun `fromWire resolves known sources ignoring case`() {
        assertThat(MessageSource.fromWire("gmail")).isEqualTo(MessageSource.GMAIL)
        assertThat(MessageSource.fromWire("OUTLOOK")).isEqualTo(MessageSource.OUTLOOK)
        assertThat(MessageSource.fromWire("Slack")).isEqualTo(MessageSource.SLACK)
        assertThat(MessageSource.fromWire("teams")).isEqualTo(MessageSource.TEAMS)
    }

    @Test
    fun `fromWire falls back to UNKNOWN for unrecognised or null`() {
        assertThat(MessageSource.fromWire("discord")).isEqualTo(MessageSource.UNKNOWN)
        assertThat(MessageSource.fromWire(null)).isEqualTo(MessageSource.UNKNOWN)
        assertThat(MessageSource.fromWire("")).isEqualTo(MessageSource.UNKNOWN)
    }
}
