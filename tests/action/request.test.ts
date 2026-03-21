import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveActionRequest } from '../../src/action/request'
import * as core from '@actions/core'
import * as github from '@actions/github'

vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
}))

vi.mock('@actions/github', () => ({
  context: {
    repo: {
      owner: 'acme',
      repo: 'widget',
    },
  },
}))

const mockedGetInput = vi.mocked(core.getInput)
void github

describe('resolveActionRequest', () => {
  afterEach(() => {
    mockedGetInput.mockReset()
  })

  it('throws when mode is unsupported', () => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === 'mode') {
        return 'invalid'
      }
      return ''
    })

    expect(() => resolveActionRequest()).toThrow(
      "Input 'mode' must be one of: prepare, upload, publish.",
    )
  })

  it('normalizes prepare request inputs', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'mode':
          return 'prepare'
        case 'token':
          return 'tok'
        case 'repository':
          return ' octo/repo '
        case 'tag':
          return ' v1.2.3 '
        case 'create':
          return 'true'
        case 'name':
          return ' Release v1.2.3 '
        case 'body':
          return ' Notes '
        case 'generate_notes':
          return 'true'
        case 'prerelease':
          return 'false'
        case 'make_latest':
          return 'legacy'
        default:
          return ''
      }
    })

    expect(resolveActionRequest()).toEqual({
      mode: 'prepare',
      repository: 'octo/repo',
      token: 'tok',
      tag: 'v1.2.3',
      create: true,
      metadata: {
        name: 'Release v1.2.3',
        body: 'Notes',
        bodyPath: undefined,
        generateNotes: true,
        generateNotesProvided: true,
        prerelease: false,
        prereleaseProvided: true,
        makeLatest: 'legacy',
        makeLatestProvided: true,
      },
    })
  })

  it('uses github context repository when repository input is omitted', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'mode':
          return 'prepare'
        case 'token':
          return 'tok'
        case 'tag':
          return 'v1'
        case 'create':
          return 'true'
        default:
          return ''
      }
    })

    expect(resolveActionRequest()).toEqual({
      mode: 'prepare',
      repository: 'acme/widget',
      token: 'tok',
      tag: 'v1',
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
    })
  })

  it('rejects metadata inputs in upload mode', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'mode':
          return 'upload'
        case 'token':
          return 'tok'
        case 'release_id':
          return '101'
        case 'files':
          return 'dist/*.tgz'
        case 'name':
          return 'not-allowed'
        default:
          return ''
      }
    })

    expect(() => resolveActionRequest()).toThrow(
      "Mode 'upload' does not allow release metadata inputs",
    )
  })

  it('normalizes upload request settings', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'mode':
          return 'upload'
        case 'token':
          return 'tok'
        case 'repository':
          return 'octo/repo'
        case 'release_id':
          return '42'
        case 'files':
          return 'dist/a.tgz\ndist/b.tgz\n'
        case 'overwrite':
          return 'true'
        case 'fail_on_unmatched_files':
          return 'false'
        case 'working_directory':
          return 'build'
        default:
          return ''
      }
    })

    expect(resolveActionRequest()).toEqual({
      mode: 'upload',
      repository: 'octo/repo',
      token: 'tok',
      releaseId: 42,
      patterns: ['dist/a.tgz', 'dist/b.tgz'],
      overwrite: true,
      failOnUnmatchedFiles: false,
      workingDirectory: 'build',
    })
  })

  it('requires explicit publish flag in publish mode request', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'mode':
          return 'publish'
        case 'token':
          return 'tok'
        case 'release_id':
          return '88'
        case 'publish':
          return 'true'
        default:
          return ''
      }
    })

    expect(resolveActionRequest()).toEqual({
      mode: 'publish',
      repository: 'acme/widget',
      token: 'tok',
      releaseId: 88,
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
    })
  })

  it('rejects malformed release_id values', () => {
    mockedGetInput.mockImplementation((name: string) => {
      switch (name) {
        case 'mode':
          return 'upload'
        case 'token':
          return 'tok'
        case 'release_id':
          return '123abc'
        case 'files':
          return 'dist/a.tgz'
        default:
          return ''
      }
    })

    expect(() => resolveActionRequest()).toThrow(
      "Input 'release_id' must be a positive integer.",
    )
  })
})
