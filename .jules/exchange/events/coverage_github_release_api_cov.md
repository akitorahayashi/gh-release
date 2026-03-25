---
label: "tests"
created_at: "2024-05-24"
author_role: "cov"
confidence: "high"
---

## Problem

The `src/adapters/github/release-api.ts` file, which is the core integration point with GitHub's API, has very low test coverage (28.13% line, 45.45% branch).

## Goal

Increase test coverage for `release-api.ts` to ensure critical external interactions are validated and prevent silent regressions.

## Context

The `GitHubReleaseApi` is responsible for all external mutation and querying of GitHub Releases. Currently, its coverage is significantly lower than the rest of the application (28% vs ~64% average), leaving major state transitions (create, update, delete, upload) largely untested at the adapter boundary. High coverage here without mocking the external dependency directly is difficult, but covering the adapter's behavior (error mapping, pagination, payload mapping) is crucial.

## Evidence

- path: "src/adapters/github/release-api.ts"
  loc: "Entire file"
  note: "Coverage report shows 28.13% line coverage (65/231 lines) and 45.45% branch coverage (5/11 branches)."
- path: "tests/adapters/release-api.test.ts"
  loc: "Entire file"
  note: "Only contains tests for `resolveMetadata` and `findReleasesByTag`. Critical functions like `createDraftRelease`, `updateRelease`, `getReleaseById`, `listReleaseAssets`, `deleteReleaseAsset`, and `uploadReleaseAsset` are entirely untested."

## Change Scope

- `src/adapters/github/release-api.ts`
- `tests/adapters/release-api.test.ts`
