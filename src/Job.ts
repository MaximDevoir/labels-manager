import { Context } from "probot";
import SpecFiles from "./labels/SpecFiles";
import SpecLabels, { checkForDuplicates } from "./labels/SpecLabels";
import IssueLabels from "./labels/IssueLabels";
import Metrics from "./Metrics";
import { WebhookPayloadPush } from "@octokit/webhooks";
import GetIssueLabelTotalCount from "./query/IssueLabelsCount";
import LabelsError from "./reporter/LabelsError";
import IssueLabel from "./labels/IssueLabel";

/**
 * Whether or not the payload is on the `default` branch (usually master)
 *
 * @returns {boolean}
 */
function onDefaultBranch(payload: WebhookPayloadPush): boolean {
  const { default_branch: defaultBranch } = payload.repository
  if (payload.ref === `refs/heads/${defaultBranch}`) {
    return true
  }

  return false
}

/**
 * TODO: Rename class to something less vague
 */
class Job {
  public metrics: Metrics
  public specFiles: SpecFiles
  public specLabels: SpecLabels
  public issueLabels: IssueLabels
  private endMetricsCalled = false

  constructor (public context: Context<WebhookPayloadPush>) {
    this.metrics = new Metrics(context)
    this.issueLabels = new IssueLabels(context)
    this.specLabels = new SpecLabels()
    this.specFiles = new SpecFiles(context, this)
  }

  private async preSync() {
    this.context.log('Sync hash', this.context.payload.after)
    await this.metrics.start()
  }

  public async endMetrics() {
    if (this.endMetricsCalled) {
      return
    }

    await this.metrics.end()
    this.metrics.logMetrics()
  }
  private async postSync() {
    // TODO: Abstract success report
    await this.context.github.checks.create({
      ...this.context.repo(),
      name: 'Labels Manager',
      head_sha: this.context.payload.after,
      conclusion: 'success',
      status: 'completed',
      output: {
        title: 'Labels Manager',
        summary: 'Successfully synced labels',
      }
    })

    await this.endMetrics()
    this.context.log(`End of push event - ${this.context.id}`)
  }

  public async sync() {
    await this.preSync() // Start of method

    const onMaster = onDefaultBranch(this.context.payload)
    if (!onMaster) {
      this.context.log('Push event occurred on a non-default branch. Goodbye.')
      return
    }

    await this.issueLabels.getIssueLabels()
    await this.specFiles.fetchSpecFiles()
    checkForDuplicates(this)
    await this.postSync() // End of method
  }
}

export default Job
