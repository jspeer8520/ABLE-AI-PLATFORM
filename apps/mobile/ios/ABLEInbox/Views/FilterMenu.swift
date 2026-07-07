//
//  FilterMenu.swift
//  ABLEInbox
//
//  Source filter presented as a native modal sheet. Lets the user toggle any
//  combination of Gmail / Outlook / Slack / Teams. An empty selection means
//  "All sources".
//

import SwiftUI

struct FilterMenu: View {
    /// The currently-active source filters (two-way bound to the view model).
    @Binding var activeFilters: Set<MessageSource>
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(MessageSource.selectable) { source in
                        Button {
                            toggle(source)
                        } label: {
                            HStack {
                                Label(source.displayName, systemImage: source.systemImageName)
                                    .foregroundStyle(.primary)
                                Spacer()
                                if activeFilters.contains(source) {
                                    Image(systemName: "checkmark")
                                        .foregroundStyle(.tint)
                                        .fontWeight(.semibold)
                                }
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityElement(children: .combine)
                        .accessibilityAddTraits(activeFilters.contains(source) ? [.isSelected] : [])
                        .accessibilityHint(activeFilters.contains(source) ? "Selected. Double-tap to remove filter." : "Double-tap to filter by \(source.displayName).")
                    }
                } header: {
                    Text("Filter by source")
                } footer: {
                    Text(activeFilters.isEmpty
                         ? "Showing messages from all sources."
                         : "Showing \(activeFilters.count) selected source\(activeFilters.count == 1 ? "" : "s").")
                }
            }
            .navigationTitle("Filter")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Clear") { activeFilters.removeAll() }
                        .disabled(activeFilters.isEmpty)
                        .accessibilityHint("Removes all source filters")
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func toggle(_ source: MessageSource) {
        if activeFilters.contains(source) {
            activeFilters.remove(source)
        } else {
            activeFilters.insert(source)
        }
    }
}

#Preview {
    struct Wrapper: View {
        @State private var filters: Set<MessageSource> = [.gmail, .slack]
        var body: some View { FilterMenu(activeFilters: $filters) }
    }
    return Wrapper()
}
