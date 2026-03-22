import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGitHubReleaseApi } from '../../src/adapters/github/release-api'
import * as github from '@actions/github'

const listReleases = vi.fn()

vi.mock('@actions/github', () => ({
  getOctokit: vi.fn(() => ({
    rest: {
      repos: {
        listReleases,
      },
    },
  })),
}))

describe('createGitHubReleaseApi', () => {
  beforeEach(() => {
    listReleases.mockReset()
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
})
