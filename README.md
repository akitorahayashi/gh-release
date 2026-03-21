# gh-release

gh-release is a TypeScript GitHub Action that mutates GitHub Releases in explicit lifecycle phases.

The action separates release preparation, asset upload, and publication so workflows can run matrix builds in parallel without mixed release ownership.

## Lifecycle Model

1. Prepare one draft release for one tag.
2. Build artifacts in parallel jobs.
3. Upload assets from each build job to the prepared release.
4. Publish the prepared release in one final job.

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

## Outputs

- release_id
- upload_url
- html_url
- tag_name
- created
- draft
- uploaded_assets

## Validation

- just fix
- just check
- just test

## Documentation

- [Usage](docs/usage.md)
- [Architecture Boundary](docs/architecture/boundary.md)
- [Action Inputs](docs/configuration/inputs.md)
