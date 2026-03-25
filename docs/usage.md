# Usage

gh-release mutates one existing GitHub Release lifecycle in explicit phases.

## Recommended Workflow

1. Create or select the tag before calling this action.
2. Run one prepare job to resolve or create one draft release.
3. Run build matrix jobs and upload artifacts in parallel.
4. Run one publish job to finalize the draft.

## Prepare Example

```yaml
- id: prepare
  uses: akitorahayashi/gh-release@v1
  with:
    mode: prepare
    token: ${{ secrets.GITHUB_TOKEN }}
    tag: ${{ github.ref_name }}
    create: true
    name: Release ${{ github.ref_name }}
    body_path: .github/release-notes.md
```

Prepare resolves the canonical release for the tag and emits release identifiers.

## Upload Example

```yaml
- uses: akitorahayashi/gh-release@v1
  with:
    mode: upload
    token: ${{ secrets.GITHUB_TOKEN }}
    release_id: ${{ needs.prepare.outputs.release_id }}
    files: |
      dist/*.tar.gz
      checksums/*.txt
    overwrite: true
    fail_on_unmatched_files: true
```

Upload owns asset mutation only. It does not create releases, publish releases, or mutate release metadata.

## Publish Example

```yaml
- uses: akitorahayashi/gh-release@v1
  with:
    mode: publish
    token: ${{ secrets.GITHUB_TOKEN }}
    release_id: ${{ needs.prepare.outputs.release_id }}
    publish: true
```

Publish is a separate operation so one final job owns draft finalization.

## One-Job Simple Flow

```yaml
- uses: akitorahayashi/gh-release@v1
  id: prepare
  with:
    mode: prepare
    token: ${{ secrets.GITHUB_TOKEN }}
    tag: ${{ github.ref_name }}
    create: true

- uses: akitorahayashi/gh-release@v1
  with:
    mode: upload
    token: ${{ secrets.GITHUB_TOKEN }}
    release_id: ${{ steps.prepare.outputs.release_id }}
    files: dist/*.zip

- uses: akitorahayashi/gh-release@v1
  with:
    mode: publish
    token: ${{ secrets.GITHUB_TOKEN }}
    release_id: ${{ steps.prepare.outputs.release_id }}
    publish: true
```

## Migration Notes

act-tmpl adoption model:

- replace one mixed release step with three explicit gh-release phases
- move release metadata ownership to prepare and publish only
- keep upload in matrix jobs with no metadata inputs

jlo adoption model:

- run prepare before platform matrix build jobs
- upload each platform artifact from matrix jobs using the shared release_id
- publish once in a final aggregation job
