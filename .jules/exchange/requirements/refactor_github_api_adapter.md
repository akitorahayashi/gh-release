---
label: "refacts"
implementation_ready: false
---

## Goal

Decouple the API adapter from local file operations, reduce data coupling, and improve type safety.

## Problem

The `GitHubReleaseApi` has several structural issues:

### File System Coupling

It has a direct dependency on local file system operations inside its metadata resolution process.

### Excessive Data Coupling

The upload process requires passing an entire `ReleaseRecord` object when only the `releaseId` is actually needed, making the signature unnecessarily broad.

### Unsafe Type Assertions

Bypassing the type checker with `data: assetData as unknown as string` when uploading release assets using Octokit hides type mismatches.

## Context

`resolveMetadata` dynamically imports and invokes `readReleaseBodyFromPath` from `../fs/release-files.js`. This creates an invisible coupling where an API abstraction suddenly triggers local file I/O operations. For uploads, passing the entire record when only the `id` is used creates a false dependency. Bypassing types using `as unknown as string` can cause runtime issues if the underlying API changes or behaves unexpectedly with binary data masquerading as a string.

## Evidence

- source_event: "github_api_fs_coupling_data_arch.md"
  path: "src/adapters/github/release-api.ts"
  loc: "220-224"
  note: "`resolveMetadata` dynamically imports `../fs/release-files.js` to read files, tightly coupling the GitHub API adapter to the file system."
- source_event: "github_api_fs_coupling_data_arch.md"
  path: "src/adapters/github/release-api.ts"
  loc: "206-210"
  note: "The `GitHubReleaseApi` interface defines `resolveMetadata`, requiring any API implementation to know how to resolve local file metadata."
- source_event: "excessive_data_coupling_upload_data_arch.md"
  path: "src/adapters/github/release-api.ts"
  loc: "35"
  note: "`GitHubReleaseApi.uploadReleaseAsset` signature requires a full `ReleaseRecord` object."
- source_event: "excessive_data_coupling_upload_data_arch.md"
  path: "src/adapters/github/release-api.ts"
  loc: "203"
  note: "The implementation only accesses `release.id` and ignores all other fields on the object."
- source_event: "excessive_data_coupling_upload_data_arch.md"
  path: "src/app/upload-release-assets.ts"
  loc: "57"
  note: "The caller must pass the full `release` object to `uploadReleaseAsset`."
- source_event: "unsafe_type_assertion_typescripter.md"
  path: "src/adapters/github/release-api.ts"
  loc: "line 218"
  note: "data: assetData as unknown as string"

## Change Scope

- `src/adapters/github/release-api.ts`
- `src/app/upload-release-assets.ts`
- `src/app/prepare-release.ts`
- `src/app/publish-release.ts`

## Constraints

- Refactor external interface and models without changing observable runtime behavior.

## Acceptance Criteria

- `resolveMetadata` is removed from `GitHubReleaseApi` and file reading occurs prior to API layer invocation.
- `uploadReleaseAsset` function signature accepts a `releaseId: number` instead of a full `ReleaseRecord`.
- The `as unknown as string` type assertion in `uploadReleaseAsset` is replaced with safe validation or the correct type definition.
