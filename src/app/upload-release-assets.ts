import type { ActionResult } from '../action/outputs'
import type { UploadActionRequest } from '../action/request'
import {
  createGitHubReleaseApi,
  type GitHubReleaseApi,
} from '../adapters/github/release-api'
import { resolveUploadFiles } from '../adapters/fs/release-files'
import { ensureUploadHasPatterns } from '../domain/release-asset-plan'

export async function uploadReleaseAssets(
  request: UploadActionRequest,
  api: GitHubReleaseApi = createGitHubReleaseApi(request.token),
): Promise<ActionResult> {
  ensureUploadHasPatterns(request.patterns)

  const release = await api.getReleaseById(
    request.repository,
    request.releaseId,
  )
  const files = await resolveUploadFiles(
    request.patterns,
    request.workingDirectory,
  )

  if (files.length === 0) {
    if (request.failOnUnmatchedFiles) {
      throw new Error(
        "No files matched input 'files' and 'fail_on_unmatched_files' is true.",
      )
    }

    return {
      releaseId: release.id,
      uploadUrl: release.uploadUrl,
      htmlUrl: release.htmlUrl,
      tagName: release.tagName,
      created: false,
      draft: release.draft,
      uploadedAssets: [],
    }
  }

  const existingAssets = await api.listReleaseAssets(
    request.repository,
    release.id,
  )
  const existingByName = new Map(
    existingAssets.map((asset) => [asset.name, asset]),
  )
  const uploadedAssets = []

  for (const file of files) {
    const existing = existingByName.get(file.name)
    if (existing) {
      if (!request.overwrite) {
        throw new Error(
          `Asset '${file.name}' already exists and overwrite is disabled.`,
        )
      }
      await api.deleteReleaseAsset(request.repository, existing.id)
    }

    const uploaded = await api.uploadReleaseAsset(
      request.repository,
      release,
      file.name,
      file.path,
    )
    uploadedAssets.push(uploaded)
  }

  const refreshedRelease = await api.getReleaseById(
    request.repository,
    release.id,
  )

  return {
    releaseId: refreshedRelease.id,
    uploadUrl: refreshedRelease.uploadUrl,
    htmlUrl: refreshedRelease.htmlUrl,
    tagName: refreshedRelease.tagName,
    created: false,
    draft: refreshedRelease.draft,
    uploadedAssets,
  }
}
