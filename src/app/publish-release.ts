import type { ActionResult } from '../action/outputs'
import type { PublishActionRequest } from '../action/request'
import {
  createGitHubReleaseApi,
  type GitHubReleaseApi,
} from '../adapters/github/release-api'

export async function publishRelease(
  request: PublishActionRequest,
  api: GitHubReleaseApi = createGitHubReleaseApi(request.token),
): Promise<ActionResult> {
  if (!request.publish) {
    throw new Error("Mode 'publish' requires input 'publish' to be true.")
  }

  const release = await api.getReleaseById(
    request.repository,
    request.releaseId,
  )
  const metadata = await api.resolveMetadata(request.metadata)
  const updated = await api.updateRelease(
    request.repository,
    release.id,
    metadata,
    false,
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
