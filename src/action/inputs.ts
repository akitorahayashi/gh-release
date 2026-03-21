import * as core from '@actions/core'

export function readRequiredInput(name: string): string {
  const value = core.getInput(name)
  if (!value || value.trim().length === 0) {
    throw new Error(`Input '${name}' is required.`)
  }
  return value.trim()
}

export function readOptionalInput(name: string): string | undefined {
  const value = core.getInput(name)
  if (!value || value.trim().length === 0) {
    return undefined
  }
  return value.trim()
}

export function readBooleanInput(name: string, defaultValue = false): boolean {
  const value = readOptionalInput(name)
  return parseOptionalBooleanInput(name, value, defaultValue)
}

export function parseOptionalBooleanInput(
  name: string,
  value: string | undefined,
  defaultValue = false,
): boolean {
  if (!value) {
    return defaultValue
  }

  switch (value.toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return false
    default:
      throw new Error(
        `Input '${name}' must be a boolean-like value (true/false/1/0/yes/no/on/off). Received: '${value}'.`,
      )
  }
}
