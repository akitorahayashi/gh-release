import * as core from '@actions/core'
import { emitActionOutputs } from './action/outputs'
import { resolveActionRequest } from './action/request'
import { executeRequest } from './app/execute-request'

async function run(): Promise<void> {
  const request = resolveActionRequest()
  const result = await executeRequest(request)

  emitActionOutputs(result)
  core.debug(`Release lifecycle mode '${request.mode}' completed successfully.`)
}

if (require.main === module) {
  run().catch((error: unknown) => {
    if (error instanceof Error) {
      core.setFailed(error.message)
      return
    }
    core.setFailed(String(error))
  })
}
