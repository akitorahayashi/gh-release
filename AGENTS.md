# gh-release

gh-release is a TypeScript GitHub Action repository for explicit GitHub Release lifecycle operations.
The public action contract is defined in action.yml.
The runtime entrypoint for GitHub Actions is dist/index.js.

## Runtime Boundaries

src/index.ts owns bootstrap and top-level failure mapping.
src/action/ owns input normalization and output emission.
src/app/ owns prepare, upload, and publish use cases.
src/domain/ owns pure validation, policy, and retry classification.
src/adapters/ owns GitHub API, filesystem, and time integrations.

## Verification

just fix applies formatting and safe lint fixes.
just check runs formatter, lint, and typecheck validation.
just test runs repository tests.

## Constraints

dist/ is release-managed output and is not updated in normal development changes.
