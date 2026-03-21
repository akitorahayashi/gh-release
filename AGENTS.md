# act-tmpl

`act-tmpl` is a TypeScript GitHub Action template repository.
The public action contract is defined in `action.yml`.
The runtime entrypoint for GitHub Actions is `dist/index.js`.
The authored implementation lives under `src/`.

## Repository Layout

`src/index.ts` bootstraps the action runtime.
`src/action/` owns input reading, output emission, and request normalization.
`src/app/` owns use-case orchestration.
`src/domain/` owns pure message rendering logic.
`tests/action/`, `tests/app/`, and `tests/domain/` verify boundary behavior.
`docs/` contains usage, configuration, and architecture documentation.
`.github/workflows/` contains CI and release automation.

## Validation

`just fix` runs formatting and safe lint fixes.
`just check` runs format, lint, and typecheck validation.
`just test` runs the test suite.

## Constraints

Do not update `dist/` in normal development changes or pull requests.
