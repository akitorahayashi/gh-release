import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  readReleaseBodyFromPath,
  resolveUploadFiles,
} from '../../src/adapters/fs/release-files'

interface LocalTestContext {
  temporaryDirectories: string[]
}

describe('release-files adapter', () => {
  beforeEach<LocalTestContext>((context) => {
    context.temporaryDirectories = []
  })

  afterEach<LocalTestContext>(async (context) => {
    const { rm } = await import('node:fs/promises')
    await Promise.all(
      context.temporaryDirectories.map((directory) =>
        rm(directory, { recursive: true, force: true }),
      ),
    )
    context.temporaryDirectories.splice(0, context.temporaryDirectories.length)
  })

  it<LocalTestContext>('resolves files from glob patterns relative to working directory', async (context) => {
    await mkdir(join(process.cwd(), '.tmp'), { recursive: true })
    const directory = await mkdtemp(
      join(process.cwd(), '.tmp/gh-release-test-'),
    )
    context.temporaryDirectories.push(directory)

    const a = join(directory, 'a.txt')
    const b = join(directory, 'b.txt')
    await writeFile(a, 'a')
    await writeFile(b, 'b')

    const files = await resolveUploadFiles(['*.txt'], directory)
    expect(files.map((file) => file.name)).toEqual(['a.txt', 'b.txt'])
  })

  it<LocalTestContext>('reads release body from file path', async (context) => {
    await mkdir(join(process.cwd(), '.tmp'), { recursive: true })
    const directory = await mkdtemp(
      join(process.cwd(), '.tmp/gh-release-test-'),
    )
    context.temporaryDirectories.push(directory)

    const bodyPath = join(directory, 'notes.md')
    await writeFile(bodyPath, '# Notes')

    await expect(readReleaseBodyFromPath(bodyPath)).resolves.toBe('# Notes')
  })
})
