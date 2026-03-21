export type MakeLatestSetting = 'true' | 'false' | 'legacy'

export interface ReleaseMetadataInput {
  name?: string
  body?: string
  bodyPath?: string
  generateNotes: boolean
  generateNotesProvided: boolean
  prerelease: boolean
  prereleaseProvided: boolean
  makeLatest?: MakeLatestSetting
  makeLatestProvided: boolean
}

export interface ResolvedReleaseMetadata {
  name?: string
  body?: string
  generateNotes?: boolean
  prerelease?: boolean
  makeLatest?: MakeLatestSetting
}

export function normalizeMakeLatest(
  value: string | undefined,
): MakeLatestSetting | undefined {
  if (!value) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (
    normalized === 'true' ||
    normalized === 'false' ||
    normalized === 'legacy'
  ) {
    return normalized
  }

  throw new Error(
    `Input 'make_latest' must be one of: true, false, legacy. Received: '${value}'.`,
  )
}

export function validateBodyInputs(
  body: string | undefined,
  bodyPath: string | undefined,
): void {
  if (body && bodyPath) {
    throw new Error("Inputs 'body' and 'body_path' are mutually exclusive.")
  }
}
