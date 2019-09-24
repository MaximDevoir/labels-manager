import moment from 'moment'
import { Context } from "probot"
import { WebhookPayloadPush } from "@octokit/webhooks"
import { ChecksCreateParams, ChecksCreateParamsOutput } from '@octokit/rest'

import printLines from './../lib/printLines'

export interface ErrorReport {
  /**
   * A title for the error.
   *
   * **Note**: Markdown is not supported on the title.
   *
   */
  title?: ChecksCreateParamsOutput['title']
  /**
   * A short summary of the error.
   *
   * Markdown is supported.
   */
  summary: Array<string> | ChecksCreateParamsOutput['summary']
  /**
   * Details of the error.
   *
   * Markdown is supported.
   */
  text?: Array<string> | ChecksCreateParamsOutput['text']

  /**
   * The conclusion of the error.
   *
   * Defaults to 'neutral' so as not to halt a repository's CI or CD processes.
   *
   * **Note**: Failure or failure-like conclusions are not supported. See [issue
   * #4](https://github.com/MaximDevoir/probot-labels/issues/4) for more
   * information.
   */
  conclusion?: Extract<ChecksCreateParams['conclusion'], 'success' | 'neutral'>
}

/**
 * Report a public error
 *
 * @class LabelsError
 * @extends {Error}
 */
class LabelsError extends Error {
  /**
   * Report an error as a `check` on the repository.
   *
   * @param {Context} context
   * @param {ErrorReport} details
   * @param {...any[]} privateArgsToLog Extra arguments are logged privately to
   * the server
   * @memberof LabelsError
   */
  constructor (public context: Context, public details: ErrorReport, ...privateArgsToLog: any[]) {
    super(printLines(details.summary))

    // Explicitly set the prototype
    // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, LabelsError.prototype)

    this.name = 'LabelsError'
    this.context.log.error(`Extra logs for (summary): ${details.summary}\n\n`, ...privateArgsToLog)

    const {
      after: commitSha,
      repository: {
        name: repo,
        owner: { login: owner }
      }
    } = context.payload as WebhookPayloadPush

    const debugInformation = [
      '### Debug Information',
      `**Event Type**: \`${context.event}\``,
      `**Context ID**: \`${context.id}\``,
      `**Event Added**: ${moment().format('LLLL')}`
    ]

    const reportFooter = [
      '<sup>',
      'If this error persists, consider [raising an issue](https://github.com/MaximDevoir/probot-labels/issues).',
      '</sup>'
    ]

    context.github.checks.create({
      owner,
      repo,
      name: 'Labels Manager',
      head_sha: commitSha,
      conclusion: details.conclusion || 'neutral',
      status: 'completed',
      output: {
        title: details.title || 'Labels Manager',
        summary: printLines(details.summary),
        text: printLines(details.text || 'No more information provided.') + '\n' + printLines(debugInformation) + '\n' + printLines(reportFooter)
      }
    })
  }
}

export default LabelsError
