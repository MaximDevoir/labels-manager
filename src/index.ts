import { Application } from 'probot'

import Job from './Job';
import LabelsError from './reporter/LabelsError';

export = (app: Application): void => {
  app.on('push', async context => {
    const job = new Job(context)

    try {
      await job.sync()
    } catch (e) {
      // Only throw on unrecognized errors
      const errorName = e.name
      const recognizedErrors = ['JSONError', 'LabelsError']
      if (recognizedErrors.includes(errorName)) {
        if (e instanceof LabelsError) {
          e.throwAfterReport = false
          await e.checkCreation
        } else {
          throw e
        }
      } else {
        new LabelsError(context, {
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
    } finally {
      context.log('Finally...')
      // Attempts to log metrics if not already logged. This will miss any resource costs incurred during the `catch` phase.
      await job.endMetrics()
    }

    context.log('fin')
  })

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
