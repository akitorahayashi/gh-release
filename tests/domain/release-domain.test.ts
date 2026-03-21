import { describe, expect, it } from 'vitest'
import { parseReleaseMode } from '../../src/domain/release-mode'
import {
  normalizeMakeLatest,
  validateBodyInputs,
} from '../../src/domain/release-metadata'
import {
  parseFilePatterns,
  ensureUploadHasPatterns,
} from '../../src/domain/release-asset-plan'
import { assertMetadataOwnership } from '../../src/domain/release-write-policy'
import {
  computeBackoffDelayMs,
  isRetryableGitHubStatus,
} from '../../src/domain/retry-policy'

describe('domain contracts', () => {
  it('parses supported lifecycle modes', () => {
    expect(parseReleaseMode('prepare')).toBe('prepare')
    expect(parseReleaseMode('upload')).toBe('upload')
    expect(parseReleaseMode('publish')).toBe('publish')
    expect(() => parseReleaseMode('deploy')).toThrow()
  })

  it('validates body and body_path exclusivity', () => {
    expect(() => validateBodyInputs('notes', 'notes.md')).toThrow(
      "Inputs 'body' and 'body_path' are mutually exclusive.",
    )
  })

  it('normalizes make_latest values', () => {
    expect(normalizeMakeLatest(undefined)).toBeUndefined()
    expect(normalizeMakeLatest('legacy')).toBe('legacy')
    expect(() => normalizeMakeLatest('sometimes')).toThrow()
  })

  it('enforces upload metadata ownership boundary', () => {
    expect(() =>
      assertMetadataOwnership('upload', {
        name: 'n',
        body: undefined,
        bodyPath: undefined,
        generateNotes: false,
        prerelease: false,
        makeLatest: undefined,
      }),
    ).toThrow()
  })

  it('parses file patterns and requires at least one for upload execution', () => {
    expect(parseFilePatterns('dist/a\n\n dist/b ')).toEqual([
      'dist/a',
      'dist/b',
    ])
    expect(() => ensureUploadHasPatterns([])).toThrow()
  })

  it('classifies retryable statuses and computes bounded backoff', () => {
    expect(isRetryableGitHubStatus(500)).toBe(true)
    expect(isRetryableGitHubStatus(404)).toBe(false)
    expect(computeBackoffDelayMs(1, 200)).toBe(200)
    expect(computeBackoffDelayMs(3, 200)).toBe(800)
  })
})
