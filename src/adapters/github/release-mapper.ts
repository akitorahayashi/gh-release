import type {
  ReleaseAssetRecord,
  ReleaseRecord,
} from '../../domain/release-record'

interface GitHubReleaseAssetLike {
  id: number
  name: string
  size: number
  content_type: string
  browser_download_url: string
}

interface GitHubReleaseLike {
  id: number
  tag_name: string
  upload_url: string
  html_url: string
  draft: boolean
  prerelease: boolean
  assets?: GitHubReleaseAssetLike[]
}

export function mapReleaseAsset(
  asset: GitHubReleaseAssetLike,
): ReleaseAssetRecord {
  return {
    id: asset.id,
    name: asset.name,
    size: asset.size,
    contentType: asset.content_type,
    downloadUrl: asset.browser_download_url,
  }
}

export function mapRelease(record: GitHubReleaseLike): ReleaseRecord {
  return {
    id: record.id,
    tagName: record.tag_name,
    uploadUrl: record.upload_url,
    htmlUrl: record.html_url,
    draft: record.draft,
    prerelease: record.prerelease,
    assets: (record.assets ?? []).map(mapReleaseAsset),
  }
}
