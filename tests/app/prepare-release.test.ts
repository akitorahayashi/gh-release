import { describe, expect, it, vi } from 'vitest'
import { prepareRelease } from '../../src/app/prepare-release'
import type { GitHubReleaseApi } from '../../src/adapters/github/release-api'

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

    const result = await prepareRelease(
      {
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
      },
      api,
    )

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

    await expect(
      prepareRelease(
        {
          mode: 'prepare',
          repository: 'o/r',
          token: 't',
          tagName: 'v1',
          create: true,
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
    ).rejects.toThrow("Release for tag 'v1' already exists and is published.")
  })

  it('fails when release is missing and create is false', async () => {
    const api = buildApi({
      findReleasesByTag: vi.fn().mockResolvedValue([]),
      resolveMetadata: vi.fn().mockResolvedValue({}),
    })

    await expect(
      prepareRelease(
        {
          mode: 'prepare',
          repository: 'o/r',
          token: 't',
          tagName: 'v1',
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

    await expect(
      prepareRelease(
        {
          mode: 'prepare',
          repository: 'o/r',
          token: 't',
          tagName: 'v1',
          create: true,
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
    ).rejects.toThrow("Multiple releases already exist for tag 'v1'")
  })
})
