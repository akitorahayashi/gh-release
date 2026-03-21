import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import yaml from 'js-yaml'

interface ActionFile {
  runs: {
    using: string
    main: string
  }
  inputs: Record<string, { required?: boolean }>
  outputs: Record<string, unknown>
}

function loadActionFile(path: string): ActionFile {
  const source = readFileSync(resolve(process.cwd(), path), 'utf8')
  const parsed = yaml.load(source)
  return parsed as ActionFile
}

describe('action metadata contracts', () => {
  it('declares node24 and gh-release lifecycle contract', () => {
    const action = loadActionFile('action.yml')
    expect(action.runs.using).toBe('node24')
    expect(action.runs.main).toBe('dist/index.js')
    expect(action.inputs.mode.required).toBe(true)
    expect(action.inputs.token.required).toBe(true)
    expect(action.inputs.tag.required).toBe(false)
    expect(action.inputs.release_id.required).toBe(false)
    expect(Object.keys(action.outputs)).toEqual(
      expect.arrayContaining([
        'release_id',
        'upload_url',
        'html_url',
        'tag_name',
        'created',
        'draft',
        'uploaded_assets',
      ]),
    )
  })
})
