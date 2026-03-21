export interface ReleaseAssetRecord {
  id: number
  name: string
  size: number
  contentType: string
  downloadUrl: string
}

export interface ReleaseRecord {
  id: number
  tagName: string
  uploadUrl: string
  htmlUrl: string
  draft: boolean
  prerelease: boolean
  assets: ReleaseAssetRecord[]
}
