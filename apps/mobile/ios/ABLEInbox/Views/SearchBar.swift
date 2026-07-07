//
//  SearchBar.swift
//  ABLEInbox
//
//  Native-feeling inline search field for the inbox. Used inside the list
//  header (the screen also wires the system `.searchable` modifier; this
//  component is provided per the Sprint 3 spec and is reused for the compact
//  in-content search affordance).
//

import SwiftUI

struct SearchBar: View {
    @Binding var text: String
    var placeholder: String = "Search messages"

    @FocusState private var isFocused: Bool

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)

            TextField(placeholder, text: $text)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.search)
                .focused($isFocused)
                .accessibilityLabel("Search messages")
                .accessibilityHint("Filters the inbox as you type")

            if !text.isEmpty {
                Button {
                    text = ""
                    isFocused = true
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Clear search")
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

#Preview {
    struct Wrapper: View {
        @State private var text = ""
        var body: some View {
            VStack(spacing: 16) {
                SearchBar(text: $text)
                SearchBar(text: .constant("lab results"))
            }
            .padding()
        }
    }
    return Wrapper()
}
