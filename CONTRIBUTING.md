# Contributing

## Scope

`gh-release` is a single-action repository. The active runtime surface is the GitHub Action contract in `action.yml`, the TypeScript boundaries under `src/`, and the release-managed package output in `dist/`.

## Local Verification

`pnpm` is the canonical local entrypoint for repository tasks.

The repository-owned verification and maintenance recipes are:

- `pnpm run fix`: runs `biome check --write .`
- `pnpm run check`: runs `biome check .` and `pnpm run typecheck`
- `pnpm run test`: runs `pnpm test`
- `pnpm run test:coverage`: resets `coverage/` and runs `pnpm test:coverage`
- `pnpm run clean`: removes repository-local generated artifacts under `.tmp`, `coverage`, `node_modules`, and `dist`

`package.json` retains the atomic pnpm scripts behind these recipes:

- `pnpm format`
- `pnpm format:check`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm typecheck`
- `pnpm package`

## Distribution Boundary

`dist/` remains the JavaScript runtime loaded by `action.yml`. Pull requests do not carry `dist/` updates. The release workflow regenerates `dist/` immediately before it creates release tags.

## Release Model

The repository versions one action. Consumer-facing tags follow `vX.Y.Z`, and the moving major tag for workflows is `v1`.
The release workflow accepts an `X.Y.Z` version input, validates it, regenerates `dist/`, commits the release distribution when needed, and then publishes the GitHub Release while moving the corresponding major tag.
