export interface RetryPolicy {
  maxAttempts: number
  baseDelayMs: number
}

export const releaseMutationRetryPolicy: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 250,
}

export function isRetryableGitHubStatus(status: number | undefined): boolean {
  if (!status) {
    return false
  }

  return status === 409 || status === 425 || status === 429 || status >= 500
}

export function isConflictStatus(status: number | undefined): boolean {
  return status === 409 || status === 422
}

export function computeBackoffDelayMs(
  attempt: number,
  baseDelayMs: number,
): number {
  return baseDelayMs * 2 ** (attempt - 1)
}
