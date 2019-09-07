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
   */
  conclusion?: ChecksCreateParams['conclusion']
}

/**
 * Report a public error
 *
 * @class LabelsError
 * @extends {Error}
 */
class LabelsError extends Error {
  /**
   * Creates an instance of LabelsError.
   * @param {*} username Username
   * @param {*} repo Repository
   * @param {*} message Message to append to check suite.
   * @memberof LabelsError
   */
  constructor (public context: Context, public details: ErrorReport) {
    super(printLines(details.summary))

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
      `**Event Added: ${moment().format('LLLL')}`
    ]

    const reportFooter = [
      '<small>',
      'If this error persists, consider [raising an issue](https://github.com/MaximDevoir/probot-labels/issues).',
      '</small>'
    ]

    context.github.checks.create({
      owner,
      repo,
      name: 'Labels Manager',
      head_sha: commitSha,
      conclusion: details.conclusion || 'neutral',
      output: {
        title: details.title || 'Labels Manager',
        summary: printLines(details.summary),
        text: printLines(details.text || 'No more information provided.') + '\n' + printLines(debugInformation) + '\n' + printLines(reportFooter)
      }
    })
  }
}

export default LabelsError
