---
label: "docs"
implementation_ready: false
---

## Goal

Align documentation and implementation to ensure consistency and correct boundary handling.

## Problem

### Metadata Boundary Parsing Consistency

The documentation in `docs/configuration.md` contradicts the runtime implementation in `src/action/request.ts` regarding how omitted metadata inputs (`generate_notes` and `prerelease`) are handled.

### Missing Verification Commands

The central documentation index (`docs/README.md`) claims that `docs/usage.md` contains "verification commands". However, the target document (`docs/usage.md`) contains no such commands.

## Context

The documentation states omitted metadata inputs remain "unset at the action boundary" and only resolve to false behavior later. However, `src/action/request.ts` explicitly falls back to `false` when parsing these values. This causes drift. Furthermore, `docs/usage.md` only contains YAML workflow examples and migration notes, lacking the promised verification commands, which reduces trust in the documentation.

## Evidence

- source_event: "metadata_boundary_parsing_consistency.md"
  path: "docs/configuration.md"
  loc: "line 48"
  note: "States: 'When `generate_notes` and `prerelease` are omitted, they remain unset at the action boundary and resolve to false behavior only in prepare or publish mode.'"
- source_event: "metadata_boundary_parsing_consistency.md"
  path: "src/action/request.ts"
  loc: "lines 116-125"
  note: "Both `generateNotes` and `prerelease` are parsed using `parseOptionalBooleanInput(..., ..., false)`, which assigns `false` immediately instead of leaving them unset (undefined)."
- source_event: "missing_verification_commands_consistency.md"
  path: "docs/README.md"
  loc: "line 7"
  note: "States `- [Usage](usage.md): prepare, upload, publish workflow patterns and verification commands`."
- source_event: "missing_verification_commands_consistency.md"
  path: "docs/usage.md"
  loc: "entire file"
  note: "Does not contain any verification commands, only YAML workflow examples and migration notes."

## Change Scope

- `docs/configuration.md`
- `docs/README.md`
- `docs/usage.md`
- `src/action/request.ts`

## Constraints

- Maintain accurate and concise documentation.

## Acceptance Criteria

- The contradiction between `docs/configuration.md` and `src/action/request.ts` is resolved.
- The documentation index (`docs/README.md`) accurately reflects the current state of `docs/usage.md`.
