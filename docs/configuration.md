# Inputs

gh-release defines these inputs in action.yml:

| Input | Required | Default | Meaning |
|------|----------|---------|---------|
| mode | yes | none | Lifecycle mode: prepare, upload, publish |
| token | yes | none | GitHub token with release permissions |
| repository | no | current repository | Target owner/repo |
| tag | prepare | none | Tag name resolved by prepare |
| create | no | false | Allow prepare to create a draft release when missing |
| name | no | empty | Release name for prepare or publish metadata ownership |
| body | no | empty | Inline release body for prepare or publish |
| body_path | no | empty | File path for release body content |
| generate_notes | no | empty | Generate release notes during prepare or publish |
| prerelease | no | empty | Set prerelease flag during prepare or publish |
| make_latest | no | empty | Latest-release setting: true, false, legacy |
| release_id | upload/publish | none | Existing release identifier |
| files | upload | none | Newline-separated file paths or glob patterns |
| overwrite | no | false | Replace existing assets by name in upload mode |
| fail_on_unmatched_files | no | true | Fail upload mode when no files match |
| working_directory | no | . | Base directory for upload file matching |
| publish | publish | false | Explicit confirmation flag to publish draft release |

## Ownership Rules

- prepare owns draft creation and metadata initialization
- upload owns asset mutation only
- publish owns draft-to-published transition and optional final metadata

## Outputs

The action emits:

| Output | Meaning |
|--------|---------|
| release_id | Canonical release identifier |
| upload_url | Release upload API URL |
| html_url | Release HTML page URL |
| tag_name | Canonical release tag name |
| created | True when prepare created a new release |
| draft | Current draft state |
| uploaded_assets | JSON array of assets uploaded in upload mode |

## Mode Safety

Mode boundaries are strict: upload never creates or publishes releases, and publish never uploads assets.
When `generate_notes` and `prerelease` are omitted, they resolve directly to false at the action boundary.
