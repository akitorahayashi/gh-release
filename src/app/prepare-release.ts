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

export async function prepareRelease(
  request: PrepareActionRequest,
  api: GitHubReleaseApi = createGitHubReleaseApi(request.token),
): Promise<ActionResult> {
  const metadata = await api.resolveMetadata(request.metadata)

  const existing = await api.getReleaseByTag(request.repository, request.tag)
  if (existing) {
    if (!existing.draft) {
      throw new Error(
        `Release for tag '${request.tag}' already exists and is published. Prepare mode only manages draft releases.`,
      )
    }

    const updated = await api.updateRelease(
      request.repository,
      existing.id,
      metadata,
      existing.draft,
    )
    return {
      releaseId: updated.id,
      uploadUrl: updated.uploadUrl,
      htmlUrl: updated.htmlUrl,
      tagName: updated.tagName,
      created: false,
      draft: updated.draft,
      uploadedAssets: [],
    }
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
      return {
        releaseId: created.id,
        uploadUrl: created.uploadUrl,
        htmlUrl: created.htmlUrl,
        tagName: created.tagName,
        created: true,
        draft: created.draft,
        uploadedAssets: [],
      }
    } catch (error: unknown) {
      if (!(error instanceof GitHubApiError)) {
        throw error
      }

      if (isConflictStatus(error.status)) {
        const converged = await api.getReleaseByTag(
          request.repository,
          request.tag,
        )
        if (converged) {
          return {
            releaseId: converged.id,
            uploadUrl: converged.uploadUrl,
            htmlUrl: converged.htmlUrl,
            tagName: converged.tagName,
            created: false,
            draft: converged.draft,
            uploadedAssets: [],
          }
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
