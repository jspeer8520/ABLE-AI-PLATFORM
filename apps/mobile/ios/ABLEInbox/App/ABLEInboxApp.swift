//
//  ABLEInboxApp.swift
//  ABLEInbox
//
//  Application entry point. Builds the composition root and hosts the inbox
//  inside a `NavigationStack`.
//
//  Sprint 3: uses `NavigationCoordinator.makeMock()` (hardcoded data).
//  Sprint 4: switch to `NavigationCoordinator.makeLive()` once the backend
//  `GET /api/messages` endpoint is available — no other change required.
//

import SwiftUI

@main
struct ABLEInboxApp: App {
    // Swap `.makeMock()` → `.makeLive()` to integrate the real backend.
    @StateObject private var coordinator = NavigationCoordinator.makeMock()

    var body: some Scene {
        WindowGroup {
            NavigationStack(path: $coordinator.path) {
                InboxScreen(viewModel: coordinator.makeInboxViewModel())
                    .navigationDestination(for: Route.self) { route in
                        switch route {
                        case .messageDetail(let message):
                            MessageDetailScreen(message: message)
                        }
                    }
            }
            .environmentObject(coordinator)
            .tint(.accentColor)
        }
    }
}

/// Lightweight placeholder detail screen so `Route.messageDetail` resolves.
/// Sprint 4 will replace this with the full thread view.
struct MessageDetailScreen: View {
    let message: Message

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                Label(message.source.displayName, systemImage: message.source.systemImageName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(message.subject).font(.title2).bold()
                Text("From \(message.sender)").font(.subheadline).foregroundStyle(.secondary)
                Divider()
                Text(message.preview).font(.body)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
        }
        .navigationTitle("Message")
        .navigationBarTitleDisplayMode(.inline)
    }
}
