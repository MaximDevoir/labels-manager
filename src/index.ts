import { Application } from 'probot'
import Labels from './Labels';

import { WebhookPayloadPush } from '@octokit/webhooks'

function onDefaultBranch(payload: WebhookPayloadPush): boolean {
  const { default_branch: defaultBranch } = payload.repository
  if (payload.ref === `refs/heads/${defaultBranch}`) {
    return true
  }

  return false
}

export = (app: Application): void => {
  app.on('push', async context => {
    context.github.projects
    const {
      after: commitHash,
      repository: {
        name: repo,
        owner: { name: owner }
      }
    } = context.payload

    const onMaster = onDefaultBranch(context.payload)

    if (!owner) {
      throw "This is strange. We did not find an owner for this repository."
    }

    if (!onMaster) {
      app.log('Push event occurred on a non-default branch. Goodbye.')
      return
    }

    app.log('commit hash', commitHash)
    const {
      data: { tree }
    } = await context.github.git.getTree({
      owner,
      repo,
      // eslint-disable-next-line @typescript-eslint/camelcase
      tree_sha: commitHash,
      recursive: 1
    })

    const labels = new Labels(context, owner, repo)

    const labelList = await labels.getAllLabels()

    context.log(`End of push event - ${context.id}`)
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
