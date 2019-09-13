import { Context } from "probot";
import SpecFiles from "./labels/SpecFiles";
import SpecLabels from "./labels/SpecLabels";
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
  public specLabels: SpecLabels
  public specFiles: SpecFiles
  public issueLabels: IssueLabels

  constructor (protected context: Context<WebhookPayloadPush>) {
    this.metrics = new Metrics(context)
    this.specLabels = new SpecLabels(context)
    this.issueLabels = new IssueLabels(context)
    this.specFiles = new SpecFiles(context)
  }

  private async preSync() {
    this.context.log('Sync hash', this.context.payload.after)
    await this.metrics.start()
  }

  private async postSync() {
    // TODO: Update check
    await this.metrics.end()
    this.metrics.logMetrics()
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
    await this.postSync() // End of method
  }
}

export default Job
