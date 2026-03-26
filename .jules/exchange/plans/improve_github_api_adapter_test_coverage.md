---
label: "tests"
---

## Goal

Increase test coverage for `src/adapters/github/release-api.ts` to ensure critical external interactions are validated and prevent silent regressions.

## Current State

The `GitHubReleaseApi` is responsible for all external mutation and querying of GitHub Releases. Currently, its coverage is significantly lower than the rest of the application (28% vs ~64% average), leaving major state transitions (create, update, delete, upload) largely untested at the adapter boundary. Critical functions like `createDraftRelease`, `updateRelease`, `getReleaseById`, `listReleaseAssets`, `deleteReleaseAsset`, and `uploadReleaseAsset` are entirely untested.

- `src/adapters/github/release-api.ts`: Coverage report shows 28.13% line coverage (65/231 lines) and 45.45% branch coverage (5/11 branches).
- `tests/adapters/release-api.test.ts`: Only contains tests for `resolveMetadata` and `findReleasesByTag`. Critical functions like `createDraftRelease`, `updateRelease`, `getReleaseById`, `listReleaseAssets`, `deleteReleaseAsset`, and `uploadReleaseAsset` are entirely untested.

## Plan

### 1. Setup test environment for `tests/adapters/release-api.test.ts`
- Mock `@actions/github` and its `getOctokit` method to return an object with mock methods for the required `rest.repos` operations (`createRelease`, `updateRelease`, `getRelease`, `listReleaseAssets`, `deleteReleaseAsset`, `uploadReleaseAsset`).
- Mock `node:fs/promises` `readFile` to simulate reading binary files for the `uploadReleaseAsset` test without actual file system access.

### 2. Add tests for `createDraftRelease`
- Test successful creation mapping properties correctly from the input metadata to the GitHub API request payload.
- Test correct mapping of the GitHub API response payload to the application's `ReleaseRecord` domain model.
- Test proper handling and re-throwing of GitHub API errors as `GitHubApiError`.

### 3. Add tests for `updateRelease`
- Test successful update, ensuring parameters like `draft`, `name`, `body`, and generated notes flags are passed correctly.
- Test mapping of the response.
- Test error handling.

### 4. Add tests for `getReleaseById`
- Test successful retrieval by ID.
- Test mapping of the response.
- Test error handling.

### 5. Add tests for `listReleaseAssets`
- Test fetching a single page of assets.
- Test pagination by simulating multiple pages of responses (100 items per page) until a smaller page is returned.
- Test mapping of the response payloads to `ReleaseAssetRecord`.
- Test error handling.

### 6. Add tests for `deleteReleaseAsset`
- Test successful deletion by ID.
- Test error handling.

### 7. Add tests for `uploadReleaseAsset`
- Test reading binary data using the mocked `readFile`.
- Test uploading the data with correct release ID and file name.
- Test mapping of the response payload to `ReleaseAssetRecord`.
- Test error handling.

### 8. Add tests for error mapping function (`toGitHubApiError`)
- Ensure errors thrown from the octokit mock with a `status` property are correctly mapped to `GitHubApiError` with the status attached.

## Acceptance Criteria

- Test coverage for `src/adapters/github/release-api.ts` reaches acceptable levels (comparable to application average of ~64%).
- Core functions (`createDraftRelease`, `updateRelease`, `getReleaseById`, `listReleaseAssets`, `deleteReleaseAsset`, `uploadReleaseAsset`) are tested.
- Error mapping (`toGitHubApiError`) is verified.
- Pagination logic for `listReleaseAssets` is verified.
- Tests do not make real network calls or interact with the real file system.

## Risks

- Mocking `@actions/github` and `octokit` might become out of sync with actual GitHub API behavior if the `@actions/github` library is updated, leading to tests passing while real integration fails.
- Incomplete mock implementations could miss edge cases in the real API responses.
