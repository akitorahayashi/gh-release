---
label: "refacts"
created_at: "2026-03-25"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The release identifier has ambiguous and generic names in different contexts: `release_id` (action input/output), `releaseId` (action requests, action results, and adapter method signatures), and simply `id` inside `ReleaseRecord`. Additionally, `ReleaseAssetRecord` uses `id` for its own identifier.

## Goal

Establish consistent naming for the canonical identifier of a release to avoid ambiguity when working across domain records, adapter methods, and action payloads.

## Context

`ReleaseRecord` has `id: number`. `ReleaseAssetRecord` has `id: number`. However, `GitHubReleaseApi` uses `releaseId: number` as arguments, and `ActionResult` uses `releaseId: number`. A generic `id` inside a record is idiomatic in some systems, but can be confusing when passed around alongside an asset `id`. Consistent use of `releaseId` vs `id` needs taxonomy definition.

## Evidence

- path: "src/domain/release-record.ts"
  loc: "10: id: number"
  note: "Uses generic 'id' for the release identifier."
- path: "src/action/outputs.ts"
  loc: "5: releaseId: number"
  note: "Uses specific 'releaseId'."
- path: "src/adapters/github/release-api.ts"
  loc: "updateRelease(..., releaseId: number, ...)"
  note: "Uses specific 'releaseId' in method signature."

## Change Scope

- `src/domain/release-record.ts`
