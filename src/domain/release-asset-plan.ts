export interface UploadAssetPlan {
  releaseId: number
  patterns: string[]
  overwrite: boolean
  failOnUnmatchedFiles: boolean
  workingDirectory: string
}

export function parseFilePatterns(value: string | undefined): string[] {
  if (!value) {
    return []
  }

  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

export function ensureUploadHasPatterns(patterns: string[]): void {
  if (patterns.length === 0) {
    throw new Error(
      "Input 'files' must include at least one path or glob pattern in mode 'upload'.",
    )
  }
}

export function assertUniqueUploadAssetNames(
  names: string[],
  workingDirectory: string,
): void {
  const duplicates = new Set<string>()
  const seen = new Set<string>()

  for (const name of names) {
    if (seen.has(name)) {
      duplicates.add(name)
      continue
    }

    seen.add(name)
  }

  if (duplicates.size > 0) {
    throw new Error(
      `Upload matched multiple files in working directory '${workingDirectory}' that resolve to the same asset name: ${[...duplicates].join(', ')}.`,
    )
  }
}
