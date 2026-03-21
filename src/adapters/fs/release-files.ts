import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import fg from 'fast-glob'

export interface ReleaseUploadFile {
  path: string
  name: string
}

export async function resolveUploadFiles(
  patterns: string[],
  workingDirectory: string,
): Promise<ReleaseUploadFile[]> {
  const matches = await fg(patterns, {
    cwd: workingDirectory,
    onlyFiles: true,
    unique: true,
    dot: true,
  })

  return matches
    .sort((left, right) => left.localeCompare(right))
    .map((relativePath) => {
      const absolutePath = resolve(workingDirectory, relativePath)
      return {
        path: absolutePath,
        name: basename(relativePath),
      }
    })
}

export async function readReleaseBodyFromPath(
  pathValue: string,
): Promise<string> {
  return readFile(pathValue, 'utf8')
}
