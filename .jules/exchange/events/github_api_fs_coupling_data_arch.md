---
label: "refacts"
created_at: "2024-03-25"
author_role: "data_arch"
confidence: "high"
---

## Problem

The GitHub API adapter has a direct dependency on local file system operations inside its metadata resolution process.

## Goal

Decouple the API adapter from local file operations to maintain strict boundary sovereignty and prevent the infrastructure layer from containing hidden side-effects.

## Context

The `GitHubReleaseApi` is responsible for interacting with the remote GitHub REST API. However, its implementation of `resolveMetadata` dynamically imports and invokes `readReleaseBodyFromPath` from `../fs/release-files.js`. This creates an invisible coupling where an API abstraction suddenly triggers local file I/O operations, violating the principle of keeping domain models and adapters independent of unrelated transport/infrastructure concerns. The resolution of metadata (including file reading) should occur before invoking the API layer.

## Evidence

- path: "src/adapters/github/release-api.ts"
  loc: "220-224"
  note: "`resolveMetadata` dynamically imports `../fs/release-files.js` to read files, tightly coupling the GitHub API adapter to the file system."
- path: "src/adapters/github/release-api.ts"
  loc: "206-210"
  note: "The `GitHubReleaseApi` interface defines `resolveMetadata`, requiring any API implementation to know how to resolve local file metadata."

## Change Scope

- `src/adapters/github/release-api.ts`
- `src/app/prepare-release.ts`
- `src/app/publish-release.ts`
