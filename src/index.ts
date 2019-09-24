import { Application } from 'probot'

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
    } finally {
      // Attempts to log metrics if not already logged. This will miss any resource costs incurred during the `catch` phase.
      await job.endMetrics()
    }
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
