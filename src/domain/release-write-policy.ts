import type { ReleaseMetadataInput } from './release-metadata'
import type { ReleaseMode } from './release-mode'

export function assertMetadataOwnership(
  mode: ReleaseMode,
  metadata: ReleaseMetadataInput,
): void {
  const hasMetadata =
    metadata.name !== undefined ||
    metadata.body !== undefined ||
    metadata.bodyPath !== undefined ||
    metadata.generateNotesProvided ||
    metadata.prereleaseProvided ||
    metadata.makeLatestProvided

  if (mode === 'upload' && hasMetadata) {
    throw new Error(
      "Mode 'upload' does not allow release metadata inputs (name, body, body_path, generate_notes, prerelease, make_latest).",
    )
  }
}
