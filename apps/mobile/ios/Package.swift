// swift-tools-version: 5.9
//
//  Package.swift
//  ABLEInbox
//
//  Swift Package Manager manifest for the iOS inbox module. Structured as a
//  library + test target so the code is reviewable and unit-testable in
//  isolation; the `@main App` type is compiled into the host iOS app target
//  when integrated into the Xcode workspace.
//
//  Requires iOS 17 for `ContentUnavailableView`, `.searchable` drawer, and
//  modern Swift concurrency isolation.
//

import PackageDescription

let package = Package(
    name: "ABLEInbox",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(name: "ABLEInbox", targets: ["ABLEInbox"])
    ],
    targets: [
        .target(
            name: "ABLEInbox",
            path: "ABLEInbox"
        ),
        .testTarget(
            name: "ABLEInboxTests",
            dependencies: ["ABLEInbox"],
            path: "ABLEInboxTests"
        )
    ]
)
