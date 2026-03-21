import { describe, expect, it, vi } from 'vitest'
import { uploadReleaseAssets } from '../../src/app/upload-release-assets'
import type { GitHubReleaseApi } from '../../src/adapters/github/release-api'

vi.mock('../../src/adapters/fs/release-files', () => ({
  resolveUploadFiles: vi.fn(),
}))

import { resolveUploadFiles } from '../../src/adapters/fs/release-files'

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

describe('uploadReleaseAssets', () => {
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
})
