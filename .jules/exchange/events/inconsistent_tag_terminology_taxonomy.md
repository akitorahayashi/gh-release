---
label: "refacts"
created_at: "2026-03-25"
author_role: "taxonomy"
confidence: "high"
---

## Problem

The term `tag` and `tag_name` are used interchangeably to represent the git tag associated with a GitHub Release. The CLI action input is `tag` and the output is `tag_name`. Internally, the request object uses `tag` but the domain record uses `tagName`.

## Goal

Unify terminology: establish whether the domain concept should universally use `tagName` (which aligns with GitHub's API and the action's output) or remain split based on input/output boundaries.

## Context

The `PrepareActionRequest` uses `tag: string`. The `GitHubReleaseApi` uses `tag_name` in its requests and `mapRelease` maps it to `tagName` in `ReleaseRecord`. The action input is `tag` (e.g., `readRequiredInput('tag')`), while the output is `tag_name` (`core.setOutput('tag_name', result.tagName)`). This inconsistency creates a mental overhead when tracking the value across boundaries.

## Evidence

- path: "src/domain/release-target.ts"
  loc: "PrepareReleaseTarget.tag: string"
  note: "Domain object representing a target uses `tag`, while `ReleaseRecord` uses `tagName`."
- path: "src/domain/release-record.ts"
  loc: "11: tagName: string"
  note: "Domain representation uses `tagName`."
- path: "action.yml"
  loc: "inputs.tag vs outputs.tag_name"
  note: "CLI/Action boundary exposes two different names for the same underlying concept."

## Change Scope

- `src/domain/release-target.ts`
- `src/action/request.ts`
