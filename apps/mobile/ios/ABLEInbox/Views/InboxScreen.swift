//
//  InboxScreen.swift
//  ABLEInbox
//
//  The main inbox view. Wires every Sprint 3 feature onto native SwiftUI:
//    • List of messages                → `List` + `MessageListItem`
//    • Pull-to-refresh                 → `.refreshable`
//    • Mark read/unread on tap         → row `onTapGesture` → view model
//    • Swipe to archive                → `.swipeActions`
//    • Search                          → `.searchable` (native search bar)
//    • Filter by source                → toolbar button → `FilterMenu` sheet
//    • Offline caching / cached banner → view model `isShowingCachedData`
//    • Loading state                   → `ProgressView`
//    • Error handling                  → `.alert`
//    • Accessibility                   → labels/hints on all interactive elements
//

import SwiftUI

struct InboxScreen: View {
    @StateObject private var viewModel: InboxViewModel
    @EnvironmentObject private var coordinator: NavigationCoordinator
    @State private var isFilterPresented = false

    init(viewModel: InboxViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        content
            .navigationTitle("Inbox")
            .navigationBarTitleDisplayMode(.large)
            .toolbar { toolbarContent }
            .searchable(
                text: $viewModel.searchText,
                placement: .navigationBarDrawer(displayMode: .automatic),
                prompt: "Search messages"
            )
            .sheet(isPresented: $isFilterPresented) {
                FilterMenu(activeFilters: $viewModel.activeFilters)
            }
            .refreshable { await viewModel.refresh() }
            .task { await viewModel.loadIfNeeded() }
            .alert(item: $viewModel.activeError) { error in
                Alert(
                    title: Text(error.title),
                    message: Text(error.message),
                    dismissButton: .default(Text("OK"))
                )
            }
    }

    // MARK: - Content states

    @ViewBuilder
    private var content: some View {
        switch viewModel.state {
        case .idle, .loading:
            loadingView
        case .failed(let message):
            failureView(message)
        case .empty:
            emptyView(filtered: false)
        case .loaded:
            if viewModel.visibleMessages.isEmpty {
                emptyView(filtered: viewModel.isFiltering)
            } else {
                messageList
            }
        }
    }

    private var messageList: some View {
        List {
            if viewModel.isShowingCachedData {
                offlineBanner
                    .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                    .listRowSeparator(.hidden)
            }

            ForEach(viewModel.visibleMessages) { message in
                MessageListItem(message: message)
                    .onTapGesture { Task { await viewModel.toggleRead(message) } }
                    .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                        Button(role: .destructive) {
                            Task { await viewModel.archive(message) }
                        } label: {
                            Label("Archive", systemImage: "archivebox.fill")
                        }
                        .accessibilityLabel("Archive message from \(message.sender)")
                    }
                    .swipeActions(edge: .leading) {
                        Button {
                            Task { await viewModel.toggleRead(message) }
                        } label: {
                            Label(
                                message.isRead ? "Unread" : "Read",
                                systemImage: message.isRead ? "envelope.badge.fill" : "envelope.open.fill"
                            )
                        }
                        .tint(.accentColor)
                    }
            }
        }
        .listStyle(.plain)
        .animation(.default, value: viewModel.visibleMessages)
    }

    // MARK: - Auxiliary views

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
                .controlSize(.large)
            Text("Loading inbox…")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Loading inbox")
    }

    private func failureView(_ message: String) -> some View {
        ContentUnavailableView {
            Label("Can't load inbox", systemImage: "wifi.exclamationmark")
        } description: {
            Text(message)
        } actions: {
            Button("Try Again") { Task { await viewModel.refresh() } }
                .buttonStyle(.borderedProminent)
        }
    }

    private func emptyView(filtered: Bool) -> some View {
        ContentUnavailableView {
            Label(filtered ? "No matches" : "Inbox zero",
                  systemImage: filtered ? "line.3.horizontal.decrease.circle" : "tray")
        } description: {
            Text(filtered
                 ? "No messages match your search or filters."
                 : "You're all caught up.")
        } actions: {
            if filtered {
                Button("Clear filters") { viewModel.clearFilters() }
            }
        }
    }

    private var offlineBanner: some View {
        HStack(spacing: 8) {
            Image(systemName: "wifi.slash")
            Text("Offline — showing cached messages")
                .font(.footnote.weight(.medium))
            Spacer()
        }
        .foregroundStyle(.secondary)
        .padding(10)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 10))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Offline. Showing cached messages.")
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button {
                isFilterPresented = true
            } label: {
                Image(systemName: viewModel.activeFilters.isEmpty
                      ? "line.3.horizontal.decrease.circle"
                      : "line.3.horizontal.decrease.circle.fill")
            }
            .accessibilityLabel("Filter by source")
            .accessibilityValue(viewModel.activeFilters.isEmpty
                                ? "No filters active"
                                : "\(viewModel.activeFilters.count) filters active")
        }
    }
}

// MARK: - Preview

#Preview("Inbox — mock") {
    let coordinator = NavigationCoordinator.makeMock()
    return NavigationStack {
        InboxScreen(viewModel: coordinator.makeInboxViewModel())
    }
    .environmentObject(coordinator)
}
