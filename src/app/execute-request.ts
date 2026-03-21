import type { ActionResult } from '../action/outputs'
import type { ActionRequest } from '../action/request'
import { prepareRelease } from './prepare-release'
import { publishRelease } from './publish-release'
import { uploadReleaseAssets } from './upload-release-assets'

export async function executeRequest(
  request: ActionRequest,
): Promise<ActionResult> {
  switch (request.mode) {
    case 'prepare':
      return prepareRelease(request)
    case 'upload':
      return uploadReleaseAssets(request)
    case 'publish':
      return publishRelease(request)
  }
}
