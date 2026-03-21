import * as github from '@actions/github'
import type {
  ReleaseMetadataInput,
  ResolvedReleaseMetadata,
} from '../../domain/release-metadata'
import type {
  ReleaseAssetRecord,
  ReleaseRecord,
} from '../../domain/release-record'
import { mapRelease, mapReleaseAsset } from './release-mapper'

export interface GitHubReleaseApi {
  getReleaseByTag(
    repository: string,
    tag: string,
  ): Promise<ReleaseRecord | undefined>
  createDraftRelease(
    repository: string,
    tag: string,
    metadata: ResolvedReleaseMetadata,
  ): Promise<ReleaseRecord>
  updateRelease(
    repository: string,
    releaseId: number,
    metadata: ResolvedReleaseMetadata,
    draft: boolean,
  ): Promise<ReleaseRecord>
  getReleaseById(repository: string, releaseId: number): Promise<ReleaseRecord>
  listReleaseAssets(
    repository: string,
    releaseId: number,
  ): Promise<ReleaseAssetRecord[]>
  deleteReleaseAsset(repository: string, assetId: number): Promise<void>
  uploadReleaseAsset(
    repository: string,
    release: ReleaseRecord,
    fileName: string,
    filePath: string,
  ): Promise<ReleaseAssetRecord>
  resolveMetadata(
    metadata: ReleaseMetadataInput,
  ): Promise<ResolvedReleaseMetadata>
}

export class GitHubApiError extends Error {
  public readonly status?: number

  public constructor(message: string, status?: number) {
    super(message)
    this.name = 'GitHubApiError'
    this.status = status
  }
}

export function createGitHubReleaseApi(token: string): GitHubReleaseApi {
  const octokit = github.getOctokit(token)

  async function getReleaseByTag(
    repository: string,
    tag: string,
  ): Promise<ReleaseRecord | undefined> {
    const { owner, repo } = parseRepository(repository)
    try {
      const response = await octokit.rest.repos.getReleaseByTag({
        owner,
        repo,
        tag,
      })
      return mapRelease(response.data)
    } catch (error: unknown) {
      const status = extractStatus(error)
      if (status === 404) {
        return undefined
      }
      throw toGitHubApiError(error)
    }
  }

  async function createDraftRelease(
    repository: string,
    tag: string,
    metadata: ResolvedReleaseMetadata,
  ): Promise<ReleaseRecord> {
    const { owner, repo } = parseRepository(repository)
    try {
      const response = await octokit.rest.repos.createRelease({
        owner,
        repo,
        tag_name: tag,
        draft: true,
        name: metadata.name,
        body: metadata.body,
        generate_release_notes: metadata.generateNotes,
        prerelease: metadata.prerelease,
        make_latest: metadata.makeLatest,
      })
      return mapRelease(response.data)
    } catch (error: unknown) {
      throw toGitHubApiError(error)
    }
  }

  async function updateRelease(
    repository: string,
    releaseId: number,
    metadata: ResolvedReleaseMetadata,
    draft: boolean,
  ): Promise<ReleaseRecord> {
    const { owner, repo } = parseRepository(repository)
    try {
      const response = await octokit.rest.repos.updateRelease({
        owner,
        repo,
        release_id: releaseId,
        draft,
        name: metadata.name,
        body: metadata.body,
        generate_release_notes: metadata.generateNotes,
        prerelease: metadata.prerelease,
        make_latest: metadata.makeLatest,
      })
      return mapRelease(response.data)
    } catch (error: unknown) {
      throw toGitHubApiError(error)
    }
  }

  async function getReleaseById(
    repository: string,
    releaseId: number,
  ): Promise<ReleaseRecord> {
    const { owner, repo } = parseRepository(repository)
    try {
      const response = await octokit.rest.repos.getRelease({
        owner,
        repo,
        release_id: releaseId,
      })
      return mapRelease(response.data)
    } catch (error: unknown) {
      throw toGitHubApiError(error)
    }
  }

  async function listReleaseAssets(
    repository: string,
    releaseId: number,
  ): Promise<ReleaseAssetRecord[]> {
    const { owner, repo } = parseRepository(repository)
    try {
      const assets: ReleaseAssetRecord[] = []
      let page = 1

      while (true) {
        const response = await octokit.rest.repos.listReleaseAssets({
          owner,
          repo,
          release_id: releaseId,
          per_page: 100,
          page,
        })

        assets.push(...response.data.map(mapReleaseAsset))

        if (response.data.length < 100) {
          return assets
        }

        page += 1
      }
    } catch (error: unknown) {
      throw toGitHubApiError(error)
    }
  }

  async function deleteReleaseAsset(
    repository: string,
    assetId: number,
  ): Promise<void> {
    const { owner, repo } = parseRepository(repository)
    try {
      await octokit.rest.repos.deleteReleaseAsset({
        owner,
        repo,
        asset_id: assetId,
      })
    } catch (error: unknown) {
      throw toGitHubApiError(error)
    }
  }

  async function uploadReleaseAsset(
    repository: string,
    release: ReleaseRecord,
    fileName: string,
    filePath: string,
  ): Promise<ReleaseAssetRecord> {
    const { owner, repo } = parseRepository(repository)
    try {
      const assetData = await readBinary(filePath)
      const uploadResponse = await octokit.rest.repos.uploadReleaseAsset({
        owner,
        repo,
        release_id: release.id,
        name: fileName,
        // Octokit runtime accepts Buffer, but current type narrows data to string.
        data: assetData as unknown as string,
      })
      return mapReleaseAsset(uploadResponse.data)
    } catch (error: unknown) {
      throw toGitHubApiError(error)
    }
  }

  async function resolveMetadata(
    metadata: ReleaseMetadataInput,
  ): Promise<ResolvedReleaseMetadata> {
    if (metadata.bodyPath) {
      const { readReleaseBodyFromPath } = await import('../fs/release-files.js')
      const resolvedBody = await readReleaseBodyFromPath(metadata.bodyPath)
      return {
        name: metadata.name,
        body: resolvedBody,
        generateNotes: metadata.generateNotesProvided
          ? metadata.generateNotes
          : undefined,
        prerelease: metadata.prereleaseProvided
          ? metadata.prerelease
          : undefined,
        makeLatest: metadata.makeLatestProvided
          ? metadata.makeLatest
          : undefined,
      }
    }

    return {
      name: metadata.name,
      body: metadata.body,
      generateNotes: metadata.generateNotesProvided
        ? metadata.generateNotes
        : undefined,
      prerelease: metadata.prereleaseProvided ? metadata.prerelease : undefined,
      makeLatest: metadata.makeLatestProvided ? metadata.makeLatest : undefined,
    }
  }

  return {
    getReleaseByTag,
    createDraftRelease,
    updateRelease,
    getReleaseById,
    listReleaseAssets,
    deleteReleaseAsset,
    uploadReleaseAsset,
    resolveMetadata,
  }
}

function extractStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status
  }

  return undefined
}

function toGitHubApiError(error: unknown): GitHubApiError {
  const status = extractStatus(error)
  if (error instanceof Error) {
    return new GitHubApiError(error.message, status)
  }
  return new GitHubApiError(String(error), status)
}

function parseRepository(repository: string): { owner: string; repo: string } {
  const [owner, repo] = repository.split('/')
  return { owner, repo }
}

async function readBinary(path: string): Promise<Buffer> {
  const fs = await import('node:fs/promises')
  return fs.readFile(path)
}
