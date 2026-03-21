import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  readReleaseBodyFromPath,
  resolveUploadFiles,
} from '../../src/adapters/fs/release-files'

const temporaryDirectories: string[] = []

describe('release-files adapter', () => {
  afterEach(async () => {
    const { rm } = await import('node:fs/promises')
    await Promise.all(
      temporaryDirectories.map((directory) =>
        rm(directory, { recursive: true, force: true }),
      ),
    )
    temporaryDirectories.splice(0, temporaryDirectories.length)
  })

  it('resolves files from glob patterns relative to working directory', async () => {
    await mkdir(join(process.cwd(), '.tmp'), { recursive: true })
    const directory = await mkdtemp(
      join(process.cwd(), '.tmp/gh-release-test-'),
    )
    temporaryDirectories.push(directory)

    const a = join(directory, 'a.txt')
    const b = join(directory, 'b.txt')
    await writeFile(a, 'a')
    await writeFile(b, 'b')

    const files = await resolveUploadFiles(['*.txt'], directory)
    expect(files.map((file) => file.name)).toEqual(['a.txt', 'b.txt'])
  })

  it('reads release body from file path', async () => {
    await mkdir(join(process.cwd(), '.tmp'), { recursive: true })
    const directory = await mkdtemp(
      join(process.cwd(), '.tmp/gh-release-test-'),
    )
    temporaryDirectories.push(directory)

    const bodyPath = join(directory, 'notes.md')
    await writeFile(bodyPath, '# Notes')

    await expect(readReleaseBodyFromPath(bodyPath)).resolves.toBe('# Notes')
  })
})
