export const releaseModes = ['prepare', 'upload', 'publish'] as const

export type ReleaseMode = (typeof releaseModes)[number]

export function parseReleaseMode(value: string): ReleaseMode {
  const normalized = value.trim().toLowerCase()
  if (
    normalized === 'prepare' ||
    normalized === 'upload' ||
    normalized === 'publish'
  ) {
    return normalized
  }

  throw new Error(
    `Input 'mode' must be one of: ${releaseModes.join(', ')}. Received: '${value}'.`,
  )
}
