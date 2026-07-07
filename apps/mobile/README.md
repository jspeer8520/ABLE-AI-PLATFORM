# ABLE Mobile

Native mobile clients for the ABLE AI Platform.

- `ios/` — SwiftUI app (`ABLEInbox`), built with Xcode / Swift Package Manager.
- `android/` — Kotlin + Jetpack Compose app, built with Gradle.

## Not part of the pnpm workspace

This directory is a **native** application and has **no `package.json`**. It is
intentionally excluded from the pnpm workspace (`pnpm-workspace.yaml` lists
`apps/web` explicitly rather than `apps/*`). Do not run `pnpm install` here.

Both clients talk to the Express/JWT API in [`../../backend`](../../backend).

## Build outputs

Generated build artifacts (`.gradle/`, `build/`, `.kotlin/`, Xcode `DerivedData/`,
`*.xcuserstate`, `.build/`, `local.properties`) are gitignored at the repo root and
must never be committed.
