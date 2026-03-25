---
label: "refacts"
created_at: "2026-03-25"
author_role: "taxonomy"
confidence: "high"
---

## Problem

There is a mismatch between the external vocabulary and internal code representation for upload targets: the public CLI action input is `files`, but internally the parsed array is named `patterns` (in `UploadActionRequest` and `UploadAssetPlan`), and then the resolved files on disk are again named `files`.

## Goal

Align the internal code vocabulary with the external action input and the conceptual domain. If the input represents glob patterns, `patterns` or `filePatterns` may be the correct canonical term, and error messages should consistently reflect the boundary context.

## Context

`UploadActionRequest` has `patterns: string[]`. `parseFilePatterns` converts the `files` string input into a `string[]` of patterns. `UploadAssetPlan` has `patterns: string[]`. `uploadReleaseAssets` accesses `request.patterns`, passes them to `resolveUploadFiles`, and the result is assigned to a variable named `files`. The input error messages mix these concepts (e.g., `Input 'files' must include at least one path or glob pattern`).

## Evidence

- path: "src/action/request.ts"
  loc: "38: patterns: string[]"
  note: "Internal field uses 'patterns' for the parsed 'files' input."
- path: "action.yml"
  loc: "inputs.files"
  note: "External action API uses 'files' to represent both literal file paths and glob patterns."
- path: "src/domain/release-asset-plan.ts"
  loc: "12: export function parseFilePatterns(value: string | undefined): string[]"
  note: "The adapter/parser function acknowledges both 'files' and 'patterns' in its name."

## Change Scope

- `src/domain/release-asset-plan.ts`
- `src/action/request.ts`
- `src/app/upload-release-assets.ts`
