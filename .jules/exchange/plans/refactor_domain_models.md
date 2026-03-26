---
label: "refacts"
---

## Goal

Unify terminology and ensure a single source of truth for domain concepts.

## Current State

Currently, the domain models define concepts that are either unused, duplicated, or ambiguously named.
- `src/domain/release-record.ts`: Uses generic `id` for the release identifier, which conflicts with `releaseId` elsewhere.
- `src/domain/release-target.ts`: Defines `ReleaseTarget` and `PrepareReleaseTarget` which are completely unused. It also uses `tag` while other parts use `tagName`.
- `src/domain/release-asset-plan.ts`: Defines `UploadAssetPlan` which is defined but never used. It also acknowledges both `files` and `patterns`.
- `src/action/request.ts`: `ActionRequest` types duplicate all fields from the unused domain models instead of composing them. Uses `patterns` for parsed `files` input.
- `src/app/upload-release-assets.ts`: Requires updates to reflect the unified domain models.

## Plan

1. Rename `id` to `releaseId` in `ReleaseRecord` (`src/domain/release-record.ts`) and `ReleaseAssetRecord` if appropriate, or ensure clear usage. Since `ReleaseRecord` represents a GitHub release, rename `id` to `releaseId` for clarity and consistency with external APIs (like `GitHubReleaseApi`).
2. Rename `tag` to `tagName` in `PrepareReleaseTarget` (`src/domain/release-target.ts`) to match `ReleaseRecord`.
3. Integrate `ReleaseTarget` and `PrepareReleaseTarget` into `PrepareActionRequest`, `UploadActionRequest`, and `PublishActionRequest` in `src/action/request.ts` to prevent duplication of `repository` and `tag`/`tagName` fields.
4. Integrate `UploadAssetPlan` into `UploadActionRequest` in `src/action/request.ts` to prevent duplication of `releaseId`, `patterns`, `overwrite`, `failOnUnmatchedFiles`, and `workingDirectory`.
5. Update `src/app/upload-release-assets.ts`, `src/app/prepare-release.ts`, and `src/app/publish-release.ts` to use the composed fields from `ActionRequest` correctly.
6. Standardize the use of `patterns` for the internal array of strings instead of `files` in variable names and comments where appropriate.
7. Update all affected tests to reflect the new structure and naming conventions.
8. Update any relevant documentation to reflect the terminology changes (e.g., `releaseId`, `tagName`, `patterns`).

## Acceptance Criteria

- Consistent naming for release ID (`releaseId`), tag (`tagName`), and upload patterns (`patterns`) across the domain and action boundaries.
- Domain concepts (`UploadAssetPlan`, `ReleaseTarget`, `PrepareReleaseTarget`) are used instead of duplicating fields directly into transport action requests.
- All existing tests pass with the updated structure.
- No unused domain models exist in `src/domain/`.

## Risks

- Breaking changes to external API consumers if the action's input/output contracts are inadvertently modified. (Mitigation: Ensure changes are strictly internal refactoring and backwards compatible with existing action inputs).
- Unintended regressions in the release preparation, uploading, or publishing logic due to field composition changes. (Mitigation: Rely on existing comprehensive test suite and add tests if gaps are found).
