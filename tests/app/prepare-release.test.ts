import { describe, expect, it, vi } from 'vitest'
import { prepareRelease } from '../../src/app/prepare-release'
import {
  GitHubApiError,
  type GitHubReleaseApi,
} from '../../src/adapters/github/release-api'
import type { PrepareActionRequest } from '../../src/action/request'

vi.mock('../../src/adapters/time/sleep', () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}))

function buildApi(overrides: Partial<GitHubReleaseApi>): GitHubReleaseApi {
  return {
    findReleasesByTag: vi.fn(),
    createDraftRelease: vi.fn(),
    updateRelease: vi.fn(),
    getReleaseById: vi.fn(),
    listReleaseAssets: vi.fn(),
    deleteReleaseAsset: vi.fn(),
    uploadReleaseAsset: vi.fn(),
    resolveMetadata: vi.fn(),
    ...overrides,
  }
}

describe('prepareRelease', () => {
  const baseRequest: PrepareActionRequest = {
    mode: 'prepare',
    repository: 'o/r',
    token: 't',
    tagName: 'v1',
    create: true,
    metadata: {
      name: 'R',
      body: undefined,
      bodyPath: undefined,
      generateNotes: false,
      generateNotesProvided: true,
      prerelease: false,
      prereleaseProvided: true,
      makeLatest: undefined,
      makeLatestProvided: false,
    },
  }

  it('updates existing release and reports created false', async () => {
    const api = buildApi({
      findReleasesByTag: vi.fn().mockResolvedValue([
        {
          releaseId: 7,
          tagName: 'v1',
          uploadUrl: 'u',
          htmlUrl: 'h',
          draft: true,
          prerelease: false,
          assets: [],
        },
      ]),
      resolveMetadata: vi.fn().mockResolvedValue({ name: 'R' }),
      updateRelease: vi.fn().mockResolvedValue({
        releaseId: 7,
        tagName: 'v1',
        uploadUrl: 'u',
        htmlUrl: 'h',
        draft: true,
        prerelease: false,
        assets: [],
      }),
    })

    const result = await prepareRelease(baseRequest, api)

    expect(result.created).toBe(false)
    expect(result.releaseId).toBe(7)
  })

  it('fails when prepare targets an already published release', async () => {
    const api = buildApi({
      findReleasesByTag: vi.fn().mockResolvedValue([
        {
          releaseId: 7,
          tagName: 'v1',
          uploadUrl: 'u',
          htmlUrl: 'h',
          draft: false,
          prerelease: false,
          assets: [],
        },
      ]),
      resolveMetadata: vi.fn().mockResolvedValue({}),
    })

    await expect(prepareRelease(baseRequest, api)).rejects.toThrow(
      "Release for tag 'v1' already exists and is published.",
    )
  })

  it('fails when release is missing and create is false', async () => {
    const api = buildApi({
      findReleasesByTag: vi.fn().mockResolvedValue([]),
      resolveMetadata: vi.fn().mockResolvedValue({}),
    })

    await expect(
      prepareRelease({ ...baseRequest, create: false }, api),
    ).rejects.toThrow("No release exists for tag 'v1'")
  })

  it('retries up to the maximum bounded attempts on retryable statuses and succeeds', async () => {
    const createDraftRelease = vi
      .fn()
      .mockRejectedValueOnce(new GitHubApiError('Internal Server Error', 500))
      .mockRejectedValueOnce(new GitHubApiError('Bad Gateway', 502))
      .mockResolvedValueOnce({
        releaseId: 9,
        tagName: 'v1',
        uploadUrl: 'u',
        htmlUrl: 'h',
        draft: true,
        prerelease: false,
        assets: [],
      })

    const api = buildApi({
      findReleasesByTag: vi.fn().mockResolvedValue([]),
      resolveMetadata: vi.fn().mockResolvedValue({ name: 'R' }),
      createDraftRelease,
    })

    const result = await prepareRelease(baseRequest, api)

    expect(createDraftRelease).toHaveBeenCalledTimes(3)
    expect(result.created).toBe(true)
    expect(result.releaseId).toBe(9)
  })

  it('fails accurately when all bounded retries are exhausted', async () => {
    const createDraftRelease = vi
      .fn()
      .mockRejectedValue(new GitHubApiError('Internal Server Error', 500))

    const api = buildApi({
      findReleasesByTag: vi.fn().mockResolvedValue([]),
      resolveMetadata: vi.fn().mockResolvedValue({ name: 'R' }),
      createDraftRelease,
    })

    await expect(prepareRelease(baseRequest, api)).rejects.toThrow(
      'Internal Server Error',
    )

    expect(createDraftRelease).toHaveBeenCalledTimes(5)
  })

  it('handles 409 conflicts by returning the converged state', async () => {
    const createDraftRelease = vi
      .fn()
      .mockRejectedValue(new GitHubApiError('Conflict', 409))

    const api = buildApi({
      findReleasesByTag: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            releaseId: 10,
            tagName: 'v1',
            uploadUrl: 'u',
            htmlUrl: 'h',
            draft: true,
            prerelease: false,
            assets: [],
          },
        ]),
      resolveMetadata: vi.fn().mockResolvedValue({ name: 'R' }),
      createDraftRelease,
    })

    const result = await prepareRelease(baseRequest, api)

    expect(createDraftRelease).toHaveBeenCalledTimes(1)
    expect(result.created).toBe(false)
    expect(result.releaseId).toBe(10)
  })

  it('fails when multiple releases already exist for the same tag', async () => {
    const api = buildApi({
      findReleasesByTag: vi.fn().mockResolvedValue([
        {
          releaseId: 7,
          tagName: 'v1',
          uploadUrl: 'u1',
          htmlUrl: 'h1',
          draft: true,
          prerelease: false,
          assets: [],
        },
        {
          releaseId: 8,
          tagName: 'v1',
          uploadUrl: 'u2',
          htmlUrl: 'h2',
          draft: true,
          prerelease: false,
          assets: [],
        },
      ]),
      resolveMetadata: vi.fn().mockResolvedValue({}),
    })

    await expect(prepareRelease(baseRequest, api)).rejects.toThrow(
      "Multiple releases already exist for tag 'v1'",
    )
  })
})
