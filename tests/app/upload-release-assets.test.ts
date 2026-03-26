import { describe, expect, it, vi } from 'vitest'
import { uploadReleaseAssets } from '../../src/app/upload-release-assets'
import type { GitHubReleaseApi } from '../../src/adapters/github/release-api'

vi.mock('../../src/adapters/fs/release-files', () => ({
  resolveUploadFiles: vi.fn(),
}))

import { resolveUploadFiles } from '../../src/adapters/fs/release-files'

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

describe('uploadReleaseAssets', () => {
  it('returns default metadata gracefully when failOnUnmatchedFiles is false and files input matches nothing', async () => {
    vi.mocked(resolveUploadFiles).mockResolvedValue([])

    const api = buildApi({
      getReleaseById: vi.fn().mockResolvedValue({
        id: 3,
        tagName: 'v1',
        uploadUrl: 'u',
        htmlUrl: 'h',
        draft: true,
        prerelease: false,
        assets: [],
      }),
    })

    const result = await uploadReleaseAssets(
      {
        mode: 'upload',
        repository: 'o/r',
        token: 't',
        releaseId: 3,
        patterns: ['dist/*.tgz'],
        overwrite: false,
        failOnUnmatchedFiles: false,
        workingDirectory: '.',
      },
      api,
    )

    expect(result).toEqual({
      releaseId: 3,
      uploadUrl: 'u',
      htmlUrl: 'h',
      tagName: 'v1',
      created: false,
      draft: true,
      uploadedAssets: [],
    })
  })

  it('fails when files input is empty', async () => {
    const api = buildApi({})

    await expect(
      uploadReleaseAssets(
        {
          mode: 'upload',
          repository: 'o/r',
          token: 't',
          releaseId: 1,
          patterns: [],
          overwrite: false,
          failOnUnmatchedFiles: true,
          workingDirectory: '.',
        },
        api,
      ),
    ).rejects.toThrow("Input 'files' must include at least one path")
  })

  it('replaces an existing asset only when overwrite is true', async () => {
    vi.mocked(resolveUploadFiles).mockResolvedValue([
      { path: '/tmp/a.tgz', name: 'a.tgz' },
    ])

    const api = buildApi({
      getReleaseById: vi
        .fn()
        .mockResolvedValueOnce({
          id: 3,
          tagName: 'v1',
          uploadUrl: 'u',
          htmlUrl: 'h',
          draft: true,
          prerelease: false,
          assets: [],
        })
        .mockResolvedValueOnce({
          id: 3,
          tagName: 'v1',
          uploadUrl: 'u',
          htmlUrl: 'h',
          draft: true,
          prerelease: false,
          assets: [],
        }),
      listReleaseAssets: vi.fn().mockResolvedValue([
        {
          id: 10,
          name: 'a.tgz',
          size: 1,
          contentType: 'application/gzip',
          downloadUrl: 'x',
        },
      ]),
      deleteReleaseAsset: vi.fn().mockResolvedValue(undefined),
      uploadReleaseAsset: vi.fn().mockResolvedValue({
        id: 11,
        name: 'a.tgz',
        size: 2,
        contentType: 'application/gzip',
        downloadUrl: 'y',
      }),
    })

    const result = await uploadReleaseAssets(
      {
        mode: 'upload',
        repository: 'o/r',
        token: 't',
        releaseId: 3,
        patterns: ['dist/*.tgz'],
        overwrite: true,
        failOnUnmatchedFiles: true,
        workingDirectory: '.',
      },
      api,
    )

    expect(result.uploadedAssets).toHaveLength(1)
    expect(api.deleteReleaseAsset).toHaveBeenCalledWith('o/r', 10)
  })

  it('fails when an asset already exists and overwrite is false', async () => {
    vi.mocked(resolveUploadFiles).mockResolvedValue([
      { path: '/tmp/a.tgz', name: 'a.tgz' },
    ])

    const api = buildApi({
      getReleaseById: vi.fn().mockResolvedValue({
        id: 3,
        tagName: 'v1',
        uploadUrl: 'u',
        htmlUrl: 'h',
        draft: true,
        prerelease: false,
        assets: [],
      }),
      listReleaseAssets: vi.fn().mockResolvedValue([
        {
          id: 10,
          name: 'a.tgz',
          size: 1,
          contentType: 'application/gzip',
          downloadUrl: 'x',
        },
      ]),
    })

    await expect(
      uploadReleaseAssets(
        {
          mode: 'upload',
          repository: 'o/r',
          token: 't',
          releaseId: 3,
          patterns: ['dist/*.tgz'],
          overwrite: false,
          failOnUnmatchedFiles: true,
          workingDirectory: '.',
        },
        api,
      ),
    ).rejects.toThrow("Asset 'a.tgz' already exists and overwrite is disabled.")
  })

  it('fails when multiple matched files resolve to the same asset name', async () => {
    vi.mocked(resolveUploadFiles).mockResolvedValue([
      { path: '/tmp/linux/a.tgz', name: 'a.tgz' },
      { path: '/tmp/macos/a.tgz', name: 'a.tgz' },
    ])

    const api = buildApi({
      getReleaseById: vi.fn().mockResolvedValue({
        id: 3,
        tagName: 'v1',
        uploadUrl: 'u',
        htmlUrl: 'h',
        draft: true,
        prerelease: false,
        assets: [],
      }),
    })

    await expect(
      uploadReleaseAssets(
        {
          mode: 'upload',
          repository: 'o/r',
          token: 't',
          releaseId: 3,
          patterns: ['dist/**/*.tgz'],
          overwrite: false,
          failOnUnmatchedFiles: true,
          workingDirectory: '.',
        },
        api,
      ),
    ).rejects.toThrow(
      "Upload matched multiple files in working directory '.' that resolve to the same asset name: a.tgz.",
    )
  })
})
