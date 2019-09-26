import { Context } from 'probot'

import GetLabels, { PageInfo, LabelEdge } from './query/GetLabels'
import LabelsError from './reporter/LabelsError'

type Pagination = {
  startCursor: string;
  endCursor: string;
  hasNextPage: boolean | null;
  hasPreviousPage: boolean | null;
}

type Label = {
  id: string;
  cursor: string;
  name: string;
  description: string;
  color: string;
  default?: boolean;
  url?: string;
}

interface LabelCollection {
  [key: string]: Label;
}

export default class Labels {
  /**
   * The maximum number of labels to handle.
   *
   * TODO: Place `limit` into an environment variable.
   *
   * @type {number}
   * @memberof Labels
   */
  private limit = 256
  /**
   * Number of labels to retrieve from a repository with each request. Cannot
   * exceed the 100 label limit, set by GitHub.
   */
  private labelJumpCount = 100
  private _labels: LabelCollection = {}
  private _totalCount: number | null = null
  private _pageInfo: PageInfo = {
    startCursor: "",
    endCursor: "",
    hasNextPage: false,
    hasPreviousPage: false
  }

  constructor(private context: Context, private owner: string, private repo: string) {
  }

  get labels(): LabelCollection {
    return this._labels
  }

  /**
   * Appends onto `labels`
   */
  set labels(labels: LabelCollection) {
    this._labels = Object.assign(this.labels, labels)
  }

  addLabels(labels: LabelEdge[]) {
    labels.forEach(label => {
      const {
        id,
        name,
        color,
        description,
       } = label.node
      const { cursor } = label

      this.labels[name] = {
        id,
        cursor,
        name,
        color,
        description
      }
    })
  }
  /**
   * Pagination information from the instance of the last `fired` query.
   *
   * @memberof Labels
   */
  get pageInfo(): PageInfo {
    return this._pageInfo
  }

  set pageInfo(info) {
    this._pageInfo = info
  }

  /**
   * Get the total count number of labels. This is set after the first query is
   * fired.
   *
   * @memberof Labels
   */
  get totalCount(): number | null {
    return this._totalCount
  }

  set totalCount(total) {
    this._totalCount = total
  }

  /**
   * Retrieve all labels from the repository.
   *
   * **Note**: You must use `await getAllLabels()` to ensure you are waiting for
   * all pages of labels. Otherwise, a promise of the first page of labels will
   * be returned.
   * @returns
   * @memberof Labels
   */
  async getAllLabels() {
    const allLabels = await this.getLabelsFrom()

    return allLabels
  }

  /**
   * Get labels `limit` number of labels after `cursor`.
   *
   * @private
   * @param {string} [cursor=""] Cursor where to begin search. If left empty,
   * search will start at the beginning.
   * @param {number} [limit=100] Maximum labels allowed to retrieve in a single
   * request by GitHub API is 100.
   * @returns
   * @memberof Labels
   */
  private async getLabelsFrom(cursor: string | null = null, limit = this.labelJumpCount) {
    const labels = await new GetLabels(this.context, this.owner, this.repo, limit, cursor).fire()
    const { totalCount: repoLabelCount } = labels.repository.labels

    if (repoLabelCount > this.limit) {
      throw new LabelsError({
        title: 'Repository exceeds label limit.',
        summary: [`This repository contains ${repoLabelCount} labels - more than the ${this.limit} label limit.`]
      })
    }

    if (labels.repository.labels.pageInfo.hasNextPage) {
      await this.getLabelsFrom(labels.repository.labels.pageInfo.endCursor)
    }

    this.addLabels(labels.repository.labels.edges)

    return this.labels
  }
}
