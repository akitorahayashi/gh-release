import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createGitHubReleaseApi,
  GitHubApiError,
} from '../../src/adapters/github/release-api'
import * as github from '@actions/github'
import { readFile } from 'node:fs/promises'

const listReleases = vi.fn()
const createRelease = vi.fn()
const updateRelease = vi.fn()
const getRelease = vi.fn()
const listReleaseAssets = vi.fn()
const deleteReleaseAsset = vi.fn()
const uploadReleaseAsset = vi.fn()

vi.mock('@actions/github', () => ({
  getOctokit: vi.fn(() => ({
    rest: {
      repos: {
        listReleases,
        createRelease,
        updateRelease,
        getRelease,
        listReleaseAssets,
        deleteReleaseAsset,
        uploadReleaseAsset,
      },
    },
  })),
}))

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}))

describe('createGitHubReleaseApi', () => {
  beforeEach(() => {
    listReleases.mockReset()
    createRelease.mockReset()
    updateRelease.mockReset()
    getRelease.mockReset()
    listReleaseAssets.mockReset()
    deleteReleaseAsset.mockReset()
    uploadReleaseAsset.mockReset()
    vi.mocked(readFile).mockReset()
  })

  it('resolves omitted boolean metadata fields as undefined', async () => {
    const api = createGitHubReleaseApi('token')

    await expect(
      api.resolveMetadata({
        name: 'Release',
        body: 'Notes',
        bodyPath: undefined,
        generateNotes: false,
        generateNotesProvided: false,
        prerelease: false,
        prereleaseProvided: false,
        makeLatest: undefined,
        makeLatestProvided: false,
      }),
    ).resolves.toEqual({
      name: 'Release',
      body: 'Notes',
      generateNotes: undefined,
      prerelease: undefined,
      makeLatest: undefined,
    })
  })

  it('finds draft releases for a tag from the authenticated release listing', async () => {
    listReleases.mockResolvedValue({
      data: [
        {
          id: 10,
          tag_name: 'v1.2.3',
          upload_url: 'https://uploads.example.test/release/10{?name,label}',
          html_url: 'https://example.test/release/10',
          draft: true,
          prerelease: false,
          assets: [],
        },
        {
          id: 11,
          tag_name: 'v9.9.9',
          upload_url: 'https://uploads.example.test/release/11{?name,label}',
          html_url: 'https://example.test/release/11',
          draft: false,
          prerelease: false,
          assets: [],
        },
      ],
    })

    const api = createGitHubReleaseApi('token')

    await expect(api.findReleasesByTag('octo/repo', 'v1.2.3')).resolves.toEqual(
      [
        {
          id: 10,
          tagName: 'v1.2.3',
          uploadUrl: 'https://uploads.example.test/release/10{?name,label}',
          htmlUrl: 'https://example.test/release/10',
          draft: true,
          prerelease: false,
          assets: [],
        },
      ],
    )

    expect(github.getOctokit).toHaveBeenCalledWith('token')
    expect(listReleases).toHaveBeenCalledWith({
      owner: 'octo',
      repo: 'repo',
      per_page: 100,
      page: 1,
    })
  })

  describe('createDraftRelease', () => {
    it('creates a draft release and maps response correctly', async () => {
      createRelease.mockResolvedValue({
        data: {
          id: 123,
          tag_name: 'v1.0.0',
          upload_url: 'https://uploads.example.test/release/123{?name,label}',
          html_url: 'https://example.test/release/123',
          draft: true,
          prerelease: false,
          assets: [],
        },
      })

      const api = createGitHubReleaseApi('token')
      const result = await api.createDraftRelease('octo/repo', 'v1.0.0', {
        name: 'Release 1.0.0',
        body: 'Release notes',
        generateNotes: true,
        prerelease: false,
        makeLatest: 'true',
      })

      expect(result).toEqual({
        id: 123,
        tagName: 'v1.0.0',
        uploadUrl: 'https://uploads.example.test/release/123{?name,label}',
        htmlUrl: 'https://example.test/release/123',
        draft: true,
        prerelease: false,
        assets: [],
      })
      expect(createRelease).toHaveBeenCalledWith({
        owner: 'octo',
        repo: 'repo',
        tag_name: 'v1.0.0',
        draft: true,
        name: 'Release 1.0.0',
        body: 'Release notes',
        generate_release_notes: true,
        prerelease: false,
        make_latest: 'true',
      })
    })

    it('throws GitHubApiError if the API request fails', async () => {
      createRelease.mockRejectedValue(new Error('API request failed'))

      const api = createGitHubReleaseApi('token')
      await expect(
        api.createDraftRelease('octo/repo', 'v1.0.0', {
          name: 'Release 1.0.0',
          body: 'Release notes',
          generateNotes: true,
          prerelease: false,
          makeLatest: 'true',
        }),
      ).rejects.toThrow(GitHubApiError)
      await expect(
        api.createDraftRelease('octo/repo', 'v1.0.0', {
          name: 'Release 1.0.0',
          body: 'Release notes',
          generateNotes: true,
          prerelease: false,
          makeLatest: 'true',
        }),
      ).rejects.toThrow('API request failed')
    })

    it('throws GitHubApiError with status if the API request fails with status', async () => {
      const error = new Error('API request failed')
      Object.assign(error, { status: 403 })
      createRelease.mockRejectedValue(error)

      const api = createGitHubReleaseApi('token')
      let caughtError: unknown
      try {
        await api.createDraftRelease('octo/repo', 'v1.0.0', {
          name: 'Release 1.0.0',
          body: 'Release notes',
        })
      } catch (e) {
        caughtError = e
      }

      expect(caughtError).toBeInstanceOf(GitHubApiError)
      expect((caughtError as GitHubApiError).status).toBe(403)
      expect((caughtError as GitHubApiError).message).toBe('API request failed')
    })
  })

  describe('updateRelease', () => {
    it('updates a release and maps response correctly', async () => {
      updateRelease.mockResolvedValue({
        data: {
          id: 123,
          tag_name: 'v1.0.0',
          upload_url: 'https://uploads.example.test/release/123{?name,label}',
          html_url: 'https://example.test/release/123',
          draft: false,
          prerelease: false,
          assets: [],
        },
      })

      const api = createGitHubReleaseApi('token')
      const result = await api.updateRelease(
        'octo/repo',
        123,
        {
          name: 'Release 1.0.0',
          body: 'Updated release notes',
          generateNotes: true,
          prerelease: false,
          makeLatest: 'true',
        },
        false,
      )

      expect(result).toEqual({
        id: 123,
        tagName: 'v1.0.0',
        uploadUrl: 'https://uploads.example.test/release/123{?name,label}',
        htmlUrl: 'https://example.test/release/123',
        draft: false,
        prerelease: false,
        assets: [],
      })
      expect(updateRelease).toHaveBeenCalledWith({
        owner: 'octo',
        repo: 'repo',
        release_id: 123,
        draft: false,
        name: 'Release 1.0.0',
        body: 'Updated release notes',
        generate_release_notes: true,
        prerelease: false,
        make_latest: 'true',
      })
    })

    it('throws GitHubApiError if the API request fails', async () => {
      updateRelease.mockRejectedValue(new Error('API request failed'))

      const api = createGitHubReleaseApi('token')
      await expect(
        api.updateRelease(
          'octo/repo',
          123,
          {
            name: 'Release 1.0.0',
            body: 'Release notes',
          },
          false,
        ),
      ).rejects.toThrow(GitHubApiError)
    })
  })

  describe('getReleaseById', () => {
    it('gets a release by ID and maps response correctly', async () => {
      getRelease.mockResolvedValue({
        data: {
          id: 123,
          tag_name: 'v1.0.0',
          upload_url: 'https://uploads.example.test/release/123{?name,label}',
          html_url: 'https://example.test/release/123',
          draft: false,
          prerelease: false,
          assets: [],
        },
      })

      const api = createGitHubReleaseApi('token')
      const result = await api.getReleaseById('octo/repo', 123)

      expect(result).toEqual({
        id: 123,
        tagName: 'v1.0.0',
        uploadUrl: 'https://uploads.example.test/release/123{?name,label}',
        htmlUrl: 'https://example.test/release/123',
        draft: false,
        prerelease: false,
        assets: [],
      })
      expect(getRelease).toHaveBeenCalledWith({
        owner: 'octo',
        repo: 'repo',
        release_id: 123,
      })
    })

    it('throws GitHubApiError if the API request fails', async () => {
      getRelease.mockRejectedValue(new Error('API request failed'))

      const api = createGitHubReleaseApi('token')
      await expect(api.getReleaseById('octo/repo', 123)).rejects.toThrow(
        GitHubApiError,
      )
    })
  })

  describe('listReleaseAssets', () => {
    it('fetches a single page of assets and maps correctly', async () => {
      listReleaseAssets.mockResolvedValue({
        data: [
          {
            id: 1,
            name: 'asset1.zip',
            size: 1024,
            content_type: 'application/zip',
            browser_download_url: 'https://github.com/assets/1',
          },
        ],
      })

      const api = createGitHubReleaseApi('token')
      const result = await api.listReleaseAssets('octo/repo', 123)

      expect(result).toEqual([
        {
          id: 1,
          name: 'asset1.zip',
          size: 1024,
          contentType: 'application/zip',
          downloadUrl: 'https://github.com/assets/1',
        },
      ])
      expect(listReleaseAssets).toHaveBeenCalledWith({
        owner: 'octo',
        repo: 'repo',
        release_id: 123,
        per_page: 100,
        page: 1,
      })
      expect(listReleaseAssets).toHaveBeenCalledTimes(1)
    })

    it('paginates through multiple pages of assets', async () => {
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `asset${i}.zip`,
        size: 1024,
        content_type: 'application/zip',
        browser_download_url: `https://github.com/assets/${i}`,
      }))
      const page2 = [
        {
          id: 100,
          name: 'asset100.zip',
          size: 1024,
          content_type: 'application/zip',
          browser_download_url: 'https://github.com/assets/100',
        },
      ]

      listReleaseAssets
        .mockResolvedValueOnce({ data: page1 })
        .mockResolvedValueOnce({ data: page2 })

      const api = createGitHubReleaseApi('token')
      const result = await api.listReleaseAssets('octo/repo', 123)

      expect(result.length).toBe(101)
      expect(listReleaseAssets).toHaveBeenCalledTimes(2)
      expect(listReleaseAssets).toHaveBeenNthCalledWith(1, {
        owner: 'octo',
        repo: 'repo',
        release_id: 123,
        per_page: 100,
        page: 1,
      })
      expect(listReleaseAssets).toHaveBeenNthCalledWith(2, {
        owner: 'octo',
        repo: 'repo',
        release_id: 123,
        per_page: 100,
        page: 2,
      })
    })

    it('throws GitHubApiError if the API request fails', async () => {
      listReleaseAssets.mockRejectedValue(new Error('API request failed'))

      const api = createGitHubReleaseApi('token')
      await expect(api.listReleaseAssets('octo/repo', 123)).rejects.toThrow(
        GitHubApiError,
      )
    })
  })

  describe('deleteReleaseAsset', () => {
    it('deletes a release asset successfully', async () => {
      deleteReleaseAsset.mockResolvedValue({})

      const api = createGitHubReleaseApi('token')
      await api.deleteReleaseAsset('octo/repo', 1)

      expect(deleteReleaseAsset).toHaveBeenCalledWith({
        owner: 'octo',
        repo: 'repo',
        asset_id: 1,
      })
    })

    it('throws GitHubApiError if the API request fails', async () => {
      deleteReleaseAsset.mockRejectedValue(new Error('API request failed'))

      const api = createGitHubReleaseApi('token')
      await expect(api.deleteReleaseAsset('octo/repo', 1)).rejects.toThrow(
        GitHubApiError,
      )
    })
  })

  describe('uploadReleaseAsset', () => {
    it('uploads a release asset successfully and maps correctly', async () => {
      vi.mocked(readFile).mockResolvedValue(Buffer.from('test data'))
      uploadReleaseAsset.mockResolvedValue({
        data: {
          id: 1,
          name: 'asset1.zip',
          size: 1024,
          content_type: 'application/zip',
          browser_download_url: 'https://github.com/assets/1',
        },
      })

      const release = {
        id: 123,
        tagName: 'v1.0.0',
        uploadUrl: 'https://uploads.example.test/release/123{?name,label}',
        htmlUrl: 'https://example.test/release/123',
        draft: false,
        prerelease: false,
        assets: [],
      }

      const api = createGitHubReleaseApi('token')
      const result = await api.uploadReleaseAsset(
        'octo/repo',
        release,
        'asset1.zip',
        '/path/to/asset1.zip',
      )

      expect(result).toEqual({
        id: 1,
        name: 'asset1.zip',
        size: 1024,
        contentType: 'application/zip',
        downloadUrl: 'https://github.com/assets/1',
      })
      expect(readFile).toHaveBeenCalledWith('/path/to/asset1.zip')
      expect(uploadReleaseAsset).toHaveBeenCalledWith({
        owner: 'octo',
        repo: 'repo',
        release_id: 123,
        name: 'asset1.zip',
        data: Buffer.from('test data') as unknown as string,
      })
    })

    it('throws GitHubApiError if reading the file fails', async () => {
      vi.mocked(readFile).mockRejectedValue(new Error('File read failed'))

      const release = {
        id: 123,
        tagName: 'v1.0.0',
        uploadUrl: 'https://uploads.example.test/release/123{?name,label}',
        htmlUrl: 'https://example.test/release/123',
        draft: false,
        prerelease: false,
        assets: [],
      }

      const api = createGitHubReleaseApi('token')
      await expect(
        api.uploadReleaseAsset(
          'octo/repo',
          release,
          'asset1.zip',
          '/path/to/asset1.zip',
        ),
      ).rejects.toThrow(GitHubApiError)
    })

    it('throws GitHubApiError if the API request fails', async () => {
      vi.mocked(readFile).mockResolvedValue(Buffer.from('test data'))
      uploadReleaseAsset.mockRejectedValue(new Error('API request failed'))

      const release = {
        id: 123,
        tagName: 'v1.0.0',
        uploadUrl: 'https://uploads.example.test/release/123{?name,label}',
        htmlUrl: 'https://example.test/release/123',
        draft: false,
        prerelease: false,
        assets: [],
      }

      const api = createGitHubReleaseApi('token')
      await expect(
        api.uploadReleaseAsset(
          'octo/repo',
          release,
          'asset1.zip',
          '/path/to/asset1.zip',
        ),
      ).rejects.toThrow(GitHubApiError)
    })
  })
})
