---
label: "refacts"
created_at: "2024-03-25"
author_role: "data_arch"
confidence: "high"
---

## Problem

Duplicate definitions exist for core domain models representing request states, with the actual definitions remaining completely unused while transport-level DTOs duplicate their fields.

## Goal

Ensure a single source of truth for domain concepts by utilizing the defined domain models instead of duplicating their fields directly into transport action requests.

## Context

The repository defines `UploadAssetPlan` and `ReleaseTarget` (with `PrepareReleaseTarget`) as core domain representations for release targets and upload plans. However, these are never imported or used. Instead, `ActionRequest` definitions in `src/action/request.ts` duplicate all these fields (e.g. `UploadActionRequest` duplicates `releaseId`, `patterns`, `overwrite`, `failOnUnmatchedFiles`, `workingDirectory`), causing the persistence/transport boundary to bypass the domain boundary entirely.

## Evidence

- path: "src/domain/release-asset-plan.ts"
  loc: "1-7"
  note: "`UploadAssetPlan` is defined but never used anywhere in the codebase."
- path: "src/domain/release-target.ts"
  loc: "1-7"
  note: "`ReleaseTarget` and `PrepareReleaseTarget` are defined but completely unused."
- path: "src/action/request.ts"
  loc: "15-38"
  note: "`ActionRequest` types duplicate all fields from the unused domain models instead of composing them."

## Change Scope

- `src/domain/release-asset-plan.ts`
- `src/domain/release-target.ts`
- `src/action/request.ts`
