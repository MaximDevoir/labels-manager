import { Application, Context } from 'probot'
import Labels from './Labels';
import Metrics from './Metrics'
import RepoLabels from './query/RepoLabels';

import { WebhookPayloadPush } from '@octokit/webhooks'
import Job from './Job';
import LabelsError from './reporter/LabelsError';

export = (app: Application): void => {
  app.on('push', async context => {
    const job = new Job(context)

    try {
      await job.sync()
    } catch (e) {
      const errorName = e.name
      const recognizedErrors = ['JSONError', 'LabelsError']
      if (recognizedErrors.includes(errorName)) {
        throw e
      }

      throw new LabelsError(context, {
        title: 'Unhandled Error Encountered',
        summary: [
          'The application encountered an unhandled error.'
        ],
        text: [
          '### Error Information',
          `**Name**: \`${e.name}\``,
          `**Type (typeof)**: \`${typeof e}\``,
        ]
      },
      'error', e,
      '#### Error Stack',
      ...(typeof e.stack === 'string' ? ['```', e.stack, '```'] : ['No stack available', `Stack is \`${typeof e.stack}\``]),

      )
    }


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
