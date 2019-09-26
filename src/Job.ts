import { Context } from "probot"
import SpecFiles from "./labels/SpecFiles"
import SpecLabels, { checkForDuplicates, checkForAliasCollisions } from "./labels/SpecLabels"
import IssueLabels from "./labels/IssueLabels"
import Metrics from "./Metrics"
import { WebhookPayloadPush } from "@octokit/webhooks"
import { IssuesUpdateLabelParams, IssuesCreateLabelParams } from "@octokit/rest"
import { IIssueLabel } from "./labels/IssueLabel"
import { ISpecLabel } from "./labels/SpecLabel"

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
        title: 'Successfully synced labels',
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
    this.specLabels.checkLabelCount()
    checkForDuplicates(this)
    checkForAliasCollisions(this)

    const differences = getDifferences(this.specLabels, this.issueLabels)

    const labelSyncs: (ReturnType<Context['github']['issues']['createLabel']>
      | ReturnType<Context['github']['issues']['updateLabel']>)[] = []

    iterateDifferences:
    for (const [labelID, [specLabel, isNew, issueLabel]] of Object.entries(differences)) {
      const aliases = specLabel.aliases
      let label

      for (const index in aliases) {
        const alias = aliases[index]
        const aliasIssueLabel = this.issueLabels.getLabel(alias)

        // The alias exists, rename it.
        if (aliasIssueLabel) {
          label = this.context.github.issues.updateLabel({
            ...this.context.repo(),
            current_name: aliasIssueLabel.name,
            name: specLabel.name, //name is required for `updateLabel`. See https://github.com/octokit/rest.js/issues/1464
            ...specLabel,
            mediaType: {
              previews: ['symmetra']
            }
          } as IssuesUpdateLabelParams)
          labelSyncs.push(label)
          continue iterateDifferences
        }
      }

      if (isNew === true) {
        label = this.context.github.issues.createLabel({
          ...this.context.repo(),
          ...specLabel,
          mediaType: {
            previews: ['symmetra']
          }
        } as IssuesCreateLabelParams)
      } else {
        const associatedIssueLabel = issueLabel as IIssueLabel
        label = this.context.github.issues.updateLabel({
          ...this.context.repo(),
          current_name: associatedIssueLabel.name,
          name: specLabel.name, //name is required for `updateLabel`. See https://github.com/octokit/rest.js/issues/1464
          ...specLabel,
          mediaType: {
            previews: ['symmetra']
          }
        } as IssuesUpdateLabelParams)
      }

      labelSyncs.push(label)
    }

    await Promise.all(labelSyncs).then(data => {
      console.log('data', data)
    })

    await this.postSync() // End of method
  }
}

// TODO: Abstract this difference to its own file
function getDifferences(specLabels: SpecLabels, issueLabels: IssueLabels) {
  const differences: {
    // Key is a label ID
    [key: string]: [ISpecLabel, true] | [ISpecLabel, false, IIssueLabel]
  } = {}
  for (const [labelID, specLabelsElements] of Object.entries(specLabels.labels)) {
    const specLabel = specLabelsElements[0].label.label
    const issueLabel = issueLabels.getLabel(labelID)

    if (issueLabel === undefined) {
      differences[labelID] = [specLabel, true]
      continue;
    }

    const diff = checkDifferences(specLabel, issueLabel)
    if (diff) {
      differences[labelID] = [specLabel, false, issueLabel]
    }
  }

  console.log('differences', differences)
  return differences
}

/**
 * Checks if `spec` and `issue` labels are out of sync (based on properties from `spec`).
 *
 * @param {ISpecLabel} spec
 * @param {IIssueLabel} [issue]
 */
function checkDifferences(spec: ISpecLabel, issue: IIssueLabel) {
  const differences: Partial<ISpecLabel> = {}
  const keysToCheck: Array<keyof Pick<ISpecLabel, 'name' | 'color' | 'description'>> = ['name', 'color', 'description']

  for (const key of keysToCheck) {
    const specValue = spec[key]
    const issueValue = issue[key]
    if (specValue !== issueValue) {
      differences[key] = specValue
    }
  }

  if (Object.keys(differences).length > 0) {
    return differences
  }

  return false
}

export default Job
