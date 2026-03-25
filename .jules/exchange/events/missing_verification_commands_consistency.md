---
label: "docs"
created_at: "2025-05-18"
author_role: "consistency"
confidence: "high"
---

## Problem

The central documentation index (`docs/README.md`) claims that `docs/usage.md` contains "verification commands". However, the target document (`docs/usage.md`) contains no such commands. It only contains YAML workflow snippets and migration notes.

## Goal

Align the documentation. Either `docs/usage.md` should be updated to include the promised verification commands, or the reference in `docs/README.md` should be removed so it accurately reflects the current state of `docs/usage.md`.

## Context

Documentation acts as a contract. When an index or summary document lists features, sections, or commands that do not exist in the linked target file, it causes confusion and reduces trust in the documentation. This is a clear case of "outdated docs referencing removed/renamed workflows" or drift between documentation sources where one claims content that the other does not provide.

## Evidence

- path: "docs/README.md"
  loc: "line 7"
  note: "States `- [Usage](usage.md): prepare, upload, publish workflow patterns and verification commands`."

- path: "docs/usage.md"
  loc: "entire file"
  note: "Does not contain any verification commands, only YAML workflow examples and migration notes."

## Change Scope

- `docs/README.md`
- `docs/usage.md`
