import * as core from '@actions/core'

export interface ActionResult {
  releaseId: number
  uploadUrl: string
  htmlUrl: string
  tagName: string
  created: boolean
  draft: boolean
  uploadedAssets: Array<{
    id: number
    name: string
    size: number
    contentType: string
    downloadUrl: string
  }>
}

export function emitActionOutputs(result: ActionResult): void {
  core.setOutput('release_id', String(result.releaseId))
  core.setOutput('upload_url', result.uploadUrl)
  core.setOutput('html_url', result.htmlUrl)
  core.setOutput('tag_name', result.tagName)
  core.setOutput('created', String(result.created))
  core.setOutput('draft', String(result.draft))
  core.setOutput('uploaded_assets', JSON.stringify(result.uploadedAssets))
}
