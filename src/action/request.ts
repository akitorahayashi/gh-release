import * as github from '@actions/github'
import {
  normalizeMakeLatest,
  type ReleaseMetadataInput,
  validateBodyInputs,
} from '../domain/release-metadata'
import {
  parseFilePatterns,
  type UploadAssetPlan,
} from '../domain/release-asset-plan'
import { parseReleaseMode, type ReleaseMode } from '../domain/release-mode'
import { assertMetadataOwnership } from '../domain/release-write-policy'
import {
  normalizeRepository,
  normalizeTag,
  parseReleaseId,
  type ExistingReleaseTarget,
  type PrepareReleaseTarget,
} from '../domain/release-target'
import {
  parseOptionalBooleanInput,
  readBooleanInput,
  readOptionalInput,
  readRequiredInput,
} from './inputs'

interface BaseRequest {
  mode: ReleaseMode
  repository: string
  token: string
}

export interface PrepareActionRequest
  extends Omit<BaseRequest, 'repository'>,
    PrepareReleaseTarget {
  mode: 'prepare'
  create: boolean
  metadata: ReleaseMetadataInput
}

export interface UploadActionRequest
  extends Omit<BaseRequest, 'repository'>,
    ExistingReleaseTarget,
    UploadAssetPlan {
  mode: 'upload'
}

export interface PublishActionRequest
  extends Omit<BaseRequest, 'repository'>,
    ExistingReleaseTarget {
  mode: 'publish'
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
        tagName: normalizeTag(readRequiredInput('tag')),
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
  const generateNotesInputValue = readOptionalInput('generate_notes')
  const prereleaseInputValue = readOptionalInput('prerelease')
  const makeLatestInputValue = readOptionalInput('make_latest')

  validateBodyInputs(body, bodyPath)

  return {
    name,
    body,
    bodyPath,
    generateNotes: parseOptionalBooleanInput(
      'generate_notes',
      generateNotesInputValue,
      false,
    ),
    generateNotesProvided: generateNotesInputValue !== undefined,
    prerelease: parseOptionalBooleanInput(
      'prerelease',
      prereleaseInputValue,
      false,
    ),
    prereleaseProvided: prereleaseInputValue !== undefined,
    makeLatest: normalizeMakeLatest(makeLatestInputValue),
    makeLatestProvided: makeLatestInputValue !== undefined,
  }
}
