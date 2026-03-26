---
label: "refacts"
implementation_ready: false
---

## Goal

Unify terminology and ensure a single source of truth for domain concepts.

## Problem

There are several inconsistencies and unused elements within the domain models:

### Ambiguous Release ID

The release identifier has ambiguous names (`release_id`, `releaseId`, `id`) in different contexts.

### Pattern Mismatch

External input is `files`, internally parsed array is `patterns`, and resolved files are again `files`.

### Inconsistent Tag Terminology

`tag` and `tag_name` are used interchangeably.

### Unused Domain Models

Duplicate definitions exist for core domain models representing request states (`UploadAssetPlan` and `ReleaseTarget`), with the actual definitions remaining completely unused while transport-level DTOs duplicate their fields.

## Context

Consistent naming for canonical identifiers and domain concepts avoids ambiguity. Currently, `ReleaseRecord` has `id: number` but `GitHubReleaseApi` uses `releaseId: number`. `UploadActionRequest` uses `patterns` for the parsed `files` string input, and error messages mix these concepts. The term `tag` and `tag_name` are used interchangeably at the CLI boundary and within domain models. Finally, `UploadAssetPlan` and `ReleaseTarget` are defined but unused, as `ActionRequest` duplicates all these fields.

## Evidence

- source_event: "ambiguous_release_id_naming_taxonomy.md"
  path: "src/domain/release-record.ts"
  loc: "10: id: number"
  note: "Uses generic 'id' for the release identifier."
- source_event: "files_vs_patterns_mismatch_taxonomy.md"
  path: "src/action/request.ts"
  loc: "38: patterns: string[]"
  note: "Internal field uses 'patterns' for the parsed 'files' input."
- source_event: "files_vs_patterns_mismatch_taxonomy.md"
  path: "src/domain/release-asset-plan.ts"
  loc: "12: export function parseFilePatterns(value: string | undefined): string[]"
  note: "Acknowledges both 'files' and 'patterns'."
- source_event: "inconsistent_tag_terminology_taxonomy.md"
  path: "src/domain/release-target.ts"
  loc: "PrepareReleaseTarget.tag: string"
  note: "Uses `tag`, while `ReleaseRecord` uses `tagName`."
- source_event: "inconsistent_tag_terminology_taxonomy.md"
  path: "src/domain/release-record.ts"
  loc: "11: tagName: string"
  note: "Domain representation uses `tagName`."
- source_event: "unused_domain_models_data_arch.md"
  path: "src/domain/release-asset-plan.ts"
  loc: "1-7"
  note: "`UploadAssetPlan` is defined but never used anywhere in the codebase."
- source_event: "unused_domain_models_data_arch.md"
  path: "src/domain/release-target.ts"
  loc: "1-7"
  note: "`ReleaseTarget` and `PrepareReleaseTarget` are defined but completely unused."
- source_event: "unused_domain_models_data_arch.md"
  path: "src/action/request.ts"
  loc: "15-38"
  note: "`ActionRequest` types duplicate all fields from the unused domain models instead of composing them."

## Change Scope

- `src/domain/release-record.ts`
- `src/domain/release-target.ts`
- `src/domain/release-asset-plan.ts`
- `src/action/request.ts`
- `src/app/upload-release-assets.ts`

## Constraints

- Ensure changes are backward compatible with existing action inputs.

## Acceptance Criteria

- Consistent naming for release ID (`releaseId`), tag (`tagName`), and upload patterns (`patterns`).
- Domain concepts (`UploadAssetPlan`, `ReleaseTarget`) are used instead of duplicating fields directly into transport action requests.
