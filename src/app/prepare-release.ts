import type { PrepareActionRequest } from '../action/request'
import type { ActionResult } from '../action/outputs'
import {
  createGitHubReleaseApi,
  GitHubApiError,
  type GitHubReleaseApi,
} from '../adapters/github/release-api'
import { sleep } from '../adapters/time/sleep'
import {
  computeBackoffDelayMs,
  isConflictStatus,
  isRetryableGitHubStatus,
  releaseMutationRetryPolicy,
} from '../domain/retry-policy'
import type { ReleaseRecord } from '../domain/release-record'

export async function prepareRelease(
  request: PrepareActionRequest,
  api: GitHubReleaseApi = createGitHubReleaseApi(request.token),
): Promise<ActionResult> {
  const metadata = await api.resolveMetadata(request.metadata)

  const existing = selectPrepareRelease(
    request.tag,
    await api.findReleasesByTag(request.repository, request.tag),
  )
  if (existing) {
    const updated = await api.updateRelease(
      request.repository,
      existing.id,
      metadata,
      existing.draft,
    )
    return toActionResult(updated, false)
  }

  if (!request.create) {
    throw new Error(
      `No release exists for tag '${request.tag}'. Set 'create' to true in prepare mode to create a draft release.`,
    )
  }

  for (
    let attempt = 1;
    attempt <= releaseMutationRetryPolicy.maxAttempts;
    attempt += 1
  ) {
    try {
      const created = await api.createDraftRelease(
        request.repository,
        request.tag,
        metadata,
      )
      return toActionResult(created, true)
    } catch (error: unknown) {
      if (!(error instanceof GitHubApiError)) {
        throw error
      }

      if (isConflictStatus(error.status)) {
        const converged = selectPrepareRelease(
          request.tag,
          await api.findReleasesByTag(request.repository, request.tag),
        )
        if (converged) {
          return toActionResult(converged, false)
        }
      }

      const shouldRetry =
        attempt < releaseMutationRetryPolicy.maxAttempts &&
        isRetryableGitHubStatus(error.status)

      if (!shouldRetry) {
        throw error
      }

      await sleep(
        computeBackoffDelayMs(attempt, releaseMutationRetryPolicy.baseDelayMs),
      )
    }
  }

  throw new Error('Failed to prepare release after bounded retry.')
}

function selectPrepareRelease(
  tag: string,
  releases: ReleaseRecord[],
): ReleaseRecord | undefined {
  if (releases.length === 0) {
    return undefined
  }

  if (releases.length > 1) {
    throw new Error(
      `Multiple releases already exist for tag '${tag}'. Prepare mode requires exactly one draft release or no release.`,
    )
  }

  const [release] = releases
  if (!release.draft) {
    throw new Error(
      `Release for tag '${tag}' already exists and is published. Prepare mode only manages draft releases.`,
    )
  }

  return release
}

function toActionResult(
  release: ReleaseRecord,
  created: boolean,
): ActionResult {
  return {
    releaseId: release.id,
    uploadUrl: release.uploadUrl,
    htmlUrl: release.htmlUrl,
    tagName: release.tagName,
    created,
    draft: release.draft,
    uploadedAssets: [],
  }
}
