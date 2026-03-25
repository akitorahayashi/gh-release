---
label: "docs"
created_at: "2025-05-18"
author_role: "consistency"
confidence: "high"
---

## Problem

The documentation in `docs/configuration.md` contradicts the runtime implementation in `src/action/request.ts` regarding how omitted metadata inputs (`generate_notes` and `prerelease`) are handled. The documentation states these inputs remain "unset at the action boundary" and only resolve to false behavior later. However, `src/action/request.ts` explicitly falls back to `false` when parsing these values, meaning they are resolved to `false` directly at the action boundary.

## Goal

Resolve the contradiction between documented behavior and runtime logic. Either update `docs/configuration.md` to state that omitted `generate_notes` and `prerelease` default to `false` at the action boundary, or modify `src/action/request.ts` to leave them as `undefined` and push the `false` resolution to the `prepare` or `publish` lifecycle use cases.

## Context

A core responsibility of this codebase is to strictly handle boundary inputs, separate from pure domain logic. The documentation emphasizes this distinction ("remain unset at the action boundary"). The implementation's choice to aggressively provide a `false` default within `resolveMetadataInputs` breaks this documented invariant and causes drift.

## Evidence

- path: "docs/configuration.md"
  loc: "line 48"
  note: "States: 'When `generate_notes` and `prerelease` are omitted, they remain unset at the action boundary and resolve to false behavior only in prepare or publish mode.'"

- path: "src/action/request.ts"
  loc: "lines 116-125"
  note: "Both `generateNotes` and `prerelease` are parsed using `parseOptionalBooleanInput(..., ..., false)`, which assigns `false` immediately instead of leaving them unset (undefined)."

## Change Scope

- `docs/configuration.md`
- `src/action/request.ts`
