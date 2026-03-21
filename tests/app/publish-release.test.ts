import { describe, expect, it, vi } from 'vitest'
import { publishRelease } from '../../src/app/publish-release'
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

describe('publishRelease', () => {
  it('requires explicit publish confirmation', async () => {
    const api = buildApi({})

    await expect(
      publishRelease(
        {
          mode: 'publish',
          repository: 'o/r',
          token: 't',
          releaseId: 9,
          publish: false,
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
    ).rejects.toThrow("Mode 'publish' requires input 'publish' to be true.")
  })

  it('publishes draft release and returns normalized output', async () => {
    const api = buildApi({
      getReleaseById: vi.fn().mockResolvedValue({
        id: 9,
        tagName: 'v1',
        uploadUrl: 'u',
        htmlUrl: 'h',
        draft: true,
        prerelease: false,
        assets: [],
      }),
      resolveMetadata: vi.fn().mockResolvedValue({ name: 'R' }),
      updateRelease: vi.fn().mockResolvedValue({
        id: 9,
        tagName: 'v1',
        uploadUrl: 'u',
        htmlUrl: 'h',
        draft: false,
        prerelease: false,
        assets: [],
      }),
    })

    const result = await publishRelease(
      {
        mode: 'publish',
        repository: 'o/r',
        token: 't',
        releaseId: 9,
        publish: true,
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
    )

    expect(result.draft).toBe(false)
    expect(result.releaseId).toBe(9)
  })
})
