import { Application, Context } from 'probot'
import Labels from './Labels';
import Metrics from './Metrics'
import RepoLabels from './query/RepoLabels';

import { WebhookPayloadPush } from '@octokit/webhooks'
import Job from './Job';

export = (app: Application): void => {
  app.on('push', async context => {
    const job = new Job(context)

    job.sync()

    // const labels = new Labels(context, owner, repo)
    // await labels.getAllLabels()

    // const repoLabels = new RepoLabels(context)
    // const x = await repoLabels.getRepoLabels()
    // console.log(x)
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
