---
label: "refacts"
created_at: "2024-03-25"
author_role: "data_arch"
confidence: "high"
---

## Problem

The upload process requires passing an entire `ReleaseRecord` object when only the `releaseId` is actually needed, representing excessive data coupling.

## Goal

Reduce data coupling by requiring only the minimum necessary identifier (the `releaseId`) rather than the entire aggregate record.

## Context

In `uploadReleaseAsset`, the `GitHubReleaseApi` requires the entire `ReleaseRecord` object to be passed as an argument. However, inspecting the implementation of `uploadReleaseAsset` reveals that the only field actually accessed on the `ReleaseRecord` is its `id` (`release.id`). This unnecessarily broadens the function signature, making it harder to test and creating a false dependency on having a full release object when only an ID is needed.

## Evidence

- path: "src/adapters/github/release-api.ts"
  loc: "35"
  note: "`GitHubReleaseApi.uploadReleaseAsset` signature requires a full `ReleaseRecord` object."
- path: "src/adapters/github/release-api.ts"
  loc: "203"
  note: "The implementation only accesses `release.id` and ignores all other fields on the object."
- path: "src/app/upload-release-assets.ts"
  loc: "57"
  note: "The caller must pass the full `release` object to `uploadReleaseAsset`."

## Change Scope

- `src/adapters/github/release-api.ts`
- `src/app/upload-release-assets.ts`
