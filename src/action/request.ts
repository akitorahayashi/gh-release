import * as github from '@actions/github'
import {
  type MakeLatestSetting,
  normalizeMakeLatest,
  type ReleaseMetadataInput,
  validateBodyInputs,
} from '../domain/release-metadata'
import { parseFilePatterns } from '../domain/release-asset-plan'
import { parseReleaseMode, type ReleaseMode } from '../domain/release-mode'
import { assertMetadataOwnership } from '../domain/release-write-policy'
import {
  normalizeRepository,
  normalizeTag,
  parseReleaseId,
} from '../domain/release-target'
import {
  readBooleanInput,
  readOptionalInput,
  readRequiredInput,
} from './inputs'

interface BaseRequest {
  mode: ReleaseMode
  repository: string
  token: string
}

export interface PrepareActionRequest extends BaseRequest {
  mode: 'prepare'
  tag: string
  create: boolean
  metadata: ReleaseMetadataInput
}

export interface UploadActionRequest extends BaseRequest {
  mode: 'upload'
  releaseId: number
  patterns: string[]
  overwrite: boolean
  failOnUnmatchedFiles: boolean
  workingDirectory: string
}

export interface PublishActionRequest extends BaseRequest {
  mode: 'publish'
  releaseId: number
  publish: boolean
  metadata: ReleaseMetadataInput
}

export type ActionRequest =
  | PrepareActionRequest
  | UploadActionRequest
  | PublishActionRequest

export function resolveActionRequest(): ActionRequest {
  const mode = parseReleaseMode(readRequiredInput('mode'))
  const repositoryInput =
    readOptionalInput('repository') ??
    `${github.context.repo.owner}/${github.context.repo.repo}`
  const repository = normalizeRepository(repositoryInput)
  const token = readRequiredInput('token')
  const metadata = resolveMetadataInputs()

  assertMetadataOwnership(mode, metadata)

  switch (mode) {
    case 'prepare':
      return {
        mode,
        repository,
        token,
        tag: normalizeTag(readRequiredInput('tag')),
        create: readBooleanInput('create', false),
        metadata,
      }
    case 'upload': {
      const releaseId = parseReleaseId(readRequiredInput('release_id'))
      return {
        mode,
        repository,
        token,
        releaseId,
        patterns: parseFilePatterns(readOptionalInput('files')),
        overwrite: readBooleanInput('overwrite', false),
        failOnUnmatchedFiles: readBooleanInput('fail_on_unmatched_files', true),
        workingDirectory: readOptionalInput('working_directory') ?? '.',
      }
    }
    case 'publish':
      return {
        mode,
        repository,
        token,
        releaseId: parseReleaseId(readRequiredInput('release_id')),
        publish: readBooleanInput('publish', false),
        metadata,
      }
  }
}

function resolveMetadataInputs(): ReleaseMetadataInput {
  const name = readOptionalInput('name')
  const body = readOptionalInput('body')
  const bodyPath = readOptionalInput('body_path')
  validateBodyInputs(body, bodyPath)

  return {
    name,
    body,
    bodyPath,
    generateNotes: readBooleanInput('generate_notes', false),
    prerelease: readBooleanInput('prerelease', false),
    makeLatest: normalizeMakeLatest(readOptionalInput('make_latest')) as
      | MakeLatestSetting
      | undefined,
  }
}
