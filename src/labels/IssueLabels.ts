import { Context } from "probot";
import IssueLabel, { IIssueLabel } from "./IssueLabel";
import GetIssueLabelTotalCount from "../query/IssueLabelsCount";
import LabelsError from "../reporter/LabelsError";

interface IssueLabelsCollection {
  [key: string]: IssueLabel
}

type UnPromisify<T> = T extends Promise<infer U> ? U : T;

class IssueLabels {
  public labels: IssueLabelsCollection = {}
  public totalCount: ReturnType<GetIssueLabelTotalCount['fire']>
  constructor (private context: Context) {
    this.totalCount = new GetIssueLabelTotalCount(this.context).fire()
  }

  private async checkLabelCount() {
    const issuesLabelTotalCount = (await this.totalCount).repository.labels.totalCount
    const issuesLabelLimit = 256

    if (issuesLabelTotalCount > issuesLabelLimit) {
      throw new LabelsError(this.context, {
        title: 'Repository exceeds label limit.',
        summary: [`This repository contains ${issuesLabelTotalCount} labels - more than the ${issuesLabelLimit} label limit.`]
      })
    }
  }

  async getIssueLabels() {
    await this.checkLabelCount()
    const labels = await this.context.github.paginate(this.context.github.issues.listLabelsForRepo.endpoint.merge({
      ...this.context.repo(),
      per_page: 100,
      headers: {
        accept: 'application/vnd.github.symmetra-preview+json'
      }
    })) as UnPromisify<ReturnType<Context['github']['issues']['listLabelsForRepo']>>['data']

    labels.forEach(label => {
      this.addLabel(label)
    })
  }

  /**
   * Converts the name of a label to a valid identity token by converting the
   * characters to lower case.
   *
   * @param name The name of the label
   */
  public static convertNameToIdentityToken(name: string): string {
    return name.toLowerCase()
  }

  private addLabel(label: IIssueLabel) {
    const labelID = IssueLabels.convertNameToIdentityToken(label.name)
    this.labels[labelID] = new IssueLabel(label)
  }

  public getLabel(name: string) {
    const labelID = IssueLabels.convertNameToIdentityToken(name)
    if (labelID in this.labels) {
      return this.labels[labelID]['label']
    }

    return
  }
}

export default IssueLabels
