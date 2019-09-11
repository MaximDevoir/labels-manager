import { Application } from 'probot'
import Labels from './Labels';
import RepoLabels from './query/RepoLabels';

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
      after: commitSha,
      repository: {
        name: repo,
        owner: { login: owner }
      }
    } = context.payload

    const onMaster = onDefaultBranch(context.payload)

    if (!onMaster) {
      context.log('Push event occurred on a non-default branch. Goodbye.')
      return
    }

    context.log('commit hash', commitSha)

    const labels = new Labels(context, owner, repo)
    await labels.getAllLabels()

    const repoLabels = new RepoLabels(context)
    const x = await repoLabels.getRepoLabels()
    console.log(x)
    context.log(`End of push event - ${context.id}`)
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
