//
//  MessageListItem.swift
//  ABLEInbox
//
//  A single inbox row. Native iOS list-cell styling (no Material 3): an unread
//  indicator dot, source glyph, sender/subject/preview stack, and a relative
//  timestamp. Fully VoiceOver-labelled as one element.
//

import SwiftUI

struct MessageListItem: View {
    let message: Message

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            unreadIndicator

            VStack(alignment: .leading, spacing: 3) {
                HStack(alignment: .firstTextBaseline) {
                    Label {
                        Text(message.sender)
                            .font(.subheadline)
                            .fontWeight(message.isRead ? .regular : .semibold)
                            .lineLimit(1)
                    } icon: {
                        Image(systemName: message.source.systemImageName)
                            .font(.caption)
                            .foregroundStyle(.tint)
                    }
                    Spacer(minLength: 8)
                    Text(message.relativeTimestamp)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Text(message.subject)
                    .font(.subheadline)
                    .fontWeight(message.isRead ? .regular : .medium)
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                Text(message.preview)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityHint("Double-tap to toggle read. Swipe with one finger up or down for more actions.")
        .accessibilityAddTraits(message.isRead ? [] : [.isButton])
    }

    // MARK: - Subviews

    @ViewBuilder
    private var unreadIndicator: some View {
        Circle()
            .fill(message.isRead ? Color.clear : Color.accentColor)
            .frame(width: 9, height: 9)
            .padding(.top, 6)
            .accessibilityHidden(true)
    }

    // MARK: - Accessibility

    private var accessibilityLabel: String {
        let status = message.isRead ? "Read" : "Unread"
        return "\(status). From \(message.sender) on \(message.source.displayName). "
             + "Subject: \(message.subject). \(message.preview). \(message.relativeTimestamp)."
    }
}

#Preview {
    List {
        MessageListItem(message: MockMessageRepository.sampleMessages[0])
        MessageListItem(message: MockMessageRepository.sampleMessages[2])
    }
    .listStyle(.plain)
}
