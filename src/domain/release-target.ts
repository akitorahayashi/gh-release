export interface ReleaseTarget {
  repository: string
}

export interface PrepareReleaseTarget extends ReleaseTarget {
  tag: string
}

export function normalizeRepository(value: string): string {
  const normalized = value.trim()
  const parts = normalized.split('/')

  if (parts.length !== 2 || parts[0].length === 0 || parts[1].length === 0) {
    throw new Error(
      `Input 'repository' must be in owner/repo format. Received: '${value}'.`,
    )
  }

  return normalized
}

export function normalizeTag(value: string): string {
  const normalized = value.trim()
  if (normalized.length === 0) {
    throw new Error("Input 'tag' is required for mode 'prepare'.")
  }
  return normalized
}

export function parseReleaseId(value: string): number {
  const trimmed = value.trim()
  const parsed = Number.parseInt(trimmed, 10)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Input 'release_id' must be a positive integer. Received: '${value}'.`,
    )
  }

  return parsed
}
