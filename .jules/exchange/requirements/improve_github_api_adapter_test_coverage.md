---
label: "tests"
implementation_ready: false
---

## Goal

Increase test coverage for `src/adapters/github/release-api.ts` to ensure critical external interactions are validated and prevent silent regressions.

## Problem

The `src/adapters/github/release-api.ts` file, which is the core integration point with GitHub's API, has very low test coverage (28.13% line, 45.45% branch). Critical functions like `createDraftRelease`, `updateRelease`, `getReleaseById`, `listReleaseAssets`, `deleteReleaseAsset`, and `uploadReleaseAsset` are entirely untested.

## Context

The `GitHubReleaseApi` is responsible for all external mutation and querying of GitHub Releases. Currently, its coverage is significantly lower than the rest of the application (28% vs ~64% average), leaving major state transitions (create, update, delete, upload) largely untested at the adapter boundary. High coverage here without mocking the external dependency directly is difficult, but covering the adapter's behavior (error mapping, pagination, payload mapping) is crucial.

## Evidence

- source_event: "coverage_github_release_api_cov.md"
  path: "src/adapters/github/release-api.ts"
  loc: "Entire file"
  note: "Coverage report shows 28.13% line coverage (65/231 lines) and 45.45% branch coverage (5/11 branches)."
- source_event: "coverage_github_release_api_cov.md"
  path: "tests/adapters/release-api.test.ts"
  loc: "Entire file"
  note: "Only contains tests for `resolveMetadata` and `findReleasesByTag`. Critical functions like `createDraftRelease`, `updateRelease`, `getReleaseById`, `listReleaseAssets`, `deleteReleaseAsset`, and `uploadReleaseAsset` are entirely untested."

## Change Scope

- `src/adapters/github/release-api.ts`
- `tests/adapters/release-api.test.ts`

## Constraints

- Test external behavior (error mapping, pagination, payload mapping) without making real network calls.

## Acceptance Criteria

- Test coverage for `src/adapters/github/release-api.ts` reaches acceptable levels (comparable to application average of ~64%).
- Core functions (`createDraftRelease`, `updateRelease`, `getReleaseById`, `listReleaseAssets`, `deleteReleaseAsset`, `uploadReleaseAsset`) are tested.
