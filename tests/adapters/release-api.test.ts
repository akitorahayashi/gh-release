import { describe, expect, it } from 'vitest'
import { createGitHubReleaseApi } from '../../src/adapters/github/release-api'

describe('createGitHubReleaseApi', () => {
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
})
