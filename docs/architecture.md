# Architecture

## Repository Boundary

gh-release is a single-action repository that owns GitHub Release mutation for an already chosen tag.

The repository surfaces are:

- `action.yml`: public action contract
- `src/`: TypeScript runtime organized by action, app, domain, and adapters boundaries
- `dist/`: release-managed package output used by GitHub Actions at tag resolution time
- `tests/`: repository-owned boundary tests under `tests/action`, `tests/app`, `tests/domain`, and `tests/adapters`

## Runtime Boundaries

The runtime boundaries are:

- `src/index.ts`: bootstrap and top-level orchestration only
- `src/action/`: action boundary input reading, output emission, and request normalization
- `src/app/`: lifecycle use cases for prepare, upload, and publish
- `src/domain/`: pure mode parsing, write policy, target validation, and retry rules
- `src/adapters/`: GitHub API, filesystem, and time integrations

## Dependency Direction

Runtime dependencies follow this direction:

```text
index -> action
index -> app
action -> domain
app -> domain
app -> adapters
adapters -> domain
domain -> none
```

domain remains pure and does not depend on action, app, or adapters.

## Runtime Execution Flow

The action runtime executes this sequence:

1. Read required and optional lifecycle inputs.
2. Normalize one lifecycle request (`prepare`, `upload`, or `publish`).
3. Execute one use case in the app boundary.
4. Emit normalized release outputs.
5. Log completion state.

## Lifecycle Invariants

The action keeps release ownership deterministic with these invariants:

- prepare can resolve or create a draft release for a tag
- upload mutates assets only and never creates or publishes releases
- publish transitions draft state and does not upload files
- bounded retry is limited to retryable release mutation paths

## Failure Invariants

The action fails explicitly when:

- required mode-specific identifiers are missing
- metadata ownership rules are violated by mode
- upload file matching fails under strict unmatched policy
- overwrite is disabled and asset name collision occurs
- GitHub API returns terminal validation or authorization errors

No silent fallback paths are used.
