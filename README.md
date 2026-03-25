# gh-release

gh-release is a TypeScript GitHub Action that mutates GitHub Releases in explicit lifecycle phases.

The action separates release preparation, asset upload, and publication so workflows can run matrix builds in parallel without mixed release ownership.

## Quick Start

Prepare:

```yaml
- id: prepare
  uses: akitorahayashi/gh-release@v1
  with:
    mode: prepare
    token: ${{ secrets.GITHUB_TOKEN }}
    tag: ${{ github.ref_name }}
    create: true
    name: Release ${{ github.ref_name }}
```

Upload:

```yaml
- uses: akitorahayashi/gh-release@v1
  with:
    mode: upload
    token: ${{ secrets.GITHUB_TOKEN }}
    release_id: ${{ needs.prepare.outputs.release_id }}
    files: |
      dist/*.tar.gz
    overwrite: true
```

Publish:

```yaml
- uses: akitorahayashi/gh-release@v1
  with:
    mode: publish
    token: ${{ secrets.GITHUB_TOKEN }}
    release_id: ${{ needs.prepare.outputs.release_id }}
    publish: true
```

## Documentation

- [Usage](docs/usage.md)
- [Architecture Boundary](docs/architecture.md)
- [Action Inputs](docs/configuration.md)
