import { Context } from "probot";
import SpecLabels from "./labels/SpecLabels";
import IssueLabels from "./labels/IssueLabels";
import Metrics from "./Metrics";
import { WebhookPayloadPush } from "@octokit/webhooks";
import GetIssueLabelTotalCount from "./query/IssueLabelsCount";
import LabelsError from "./reporter/LabelsError";

type UnPromisify<T> = T extends Promise<infer U> ? U : T;

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
  public issueLabels: IssueLabels

  constructor (protected context: Context) {
    this.metrics = new Metrics(context)
    this.specLabels = new SpecLabels(context)
    this.issueLabels = new IssueLabels(context)
  }

  private async preSync() {
    this.context.log('Sync hash', this.context.payload.after)
    await this.metrics.start()
  }

  private async postSync() {
    await this.metrics.end()
    this.metrics.logMetrics()

    this.context.log(`End of push event - ${this.context.id}`)
  }

  public async sync() {
    this.preSync() // Start of method

    const onMaster = onDefaultBranch(this.context.payload)
    if (!onMaster) {
      this.context.log('Push event occurred on a non-default branch. Goodbye.')
      return
    }

    const labels = await this.context.github.paginate(this.context.github.issues.listLabelsForRepo.endpoint.merge({
      ...this.context.repo(),
      per_page: 100
    })) as UnPromisify<ReturnType<Context['github']['issues']['listLabelsForRepo']>>['data']

    // TODO: Extract issue label count check to separate file
    const issuesLabelTotalCount = (await new GetIssueLabelTotalCount(this.context).fire()).repository.labels.totalCount
    const issuesLabelLimit = 256
    if (issuesLabelTotalCount > issuesLabelLimit) {
      throw new LabelsError(this.context, {
        title: 'Repository exceeds label limit.',
        summary: [`This repository contains ${issuesLabelTotalCount} labels - more than the ${issuesLabelLimit} label limit.`]
      })
    }

    console.log('labelCount', issuesLabelTotalCount)

    this.postSync() // End of method
  }
}

export default Job
