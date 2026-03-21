import { describe, expect, it, vi } from 'vitest'
import { prepareRelease } from '../../src/app/prepare-release'
import type { GitHubReleaseApi } from '../../src/adapters/github/release-api'

function buildApi(overrides: Partial<GitHubReleaseApi>): GitHubReleaseApi {
  return {
    getReleaseByTag: vi.fn(),
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
  it('updates existing release and reports created false', async () => {
    const api = buildApi({
      getReleaseByTag: vi.fn().mockResolvedValue({
        id: 7,
        tagName: 'v1',
        uploadUrl: 'u',
        htmlUrl: 'h',
        draft: true,
        prerelease: false,
        assets: [],
      }),
      resolveMetadata: vi.fn().mockResolvedValue({ name: 'R' }),
      updateRelease: vi.fn().mockResolvedValue({
        id: 7,
        tagName: 'v1',
        uploadUrl: 'u',
        htmlUrl: 'h',
        draft: true,
        prerelease: false,
        assets: [],
      }),
    })

    const result = await prepareRelease(
      {
        mode: 'prepare',
        repository: 'o/r',
        token: 't',
        tag: 'v1',
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
      },
      api,
    )

    expect(result.created).toBe(false)
    expect(result.releaseId).toBe(7)
  })

  it('fails when release is missing and create is false', async () => {
    const api = buildApi({
      getReleaseByTag: vi.fn().mockResolvedValue(undefined),
      resolveMetadata: vi.fn().mockResolvedValue({}),
    })

    await expect(
      prepareRelease(
        {
          mode: 'prepare',
          repository: 'o/r',
          token: 't',
          tag: 'v1',
          create: false,
          metadata: {
            name: undefined,
            body: undefined,
            bodyPath: undefined,
            generateNotes: false,
            generateNotesProvided: false,
            prerelease: false,
            prereleaseProvided: false,
            makeLatest: undefined,
            makeLatestProvided: false,
          },
        },
        api,
      ),
    ).rejects.toThrow("No release exists for tag 'v1'")
  })
})
