import { Context } from 'probot'

import GetLabels, { PageInfo, GetLabelsResponse } from './query/GetLabels'
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
  private labelJumpCount = 4
  private _labels: LabelCollection = {}
  private _totalCount: number | null = null
  private _pageInfo: PageInfo = {
    startCursor: "",
    endCursor: "",
    hasNextPage: false,
    hasPreviousPage: false
  }

  constructor(private context: Context, private owner: string, private repo: string) {
    this.getLabelsFrom()
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
   * Retrieve labels from the repository.
   *
   * @returns
   * @memberof Labels
   */
  async getLabels() {

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
      throw new LabelsError(this.context, {
        title: 'Repository exceeds label limit.',
        summary: [`This repository contains ${repoLabelCount} labels - more than the ${this.limit} label limit.`]
      })
    }

    if (labels.repository.labels.pageInfo.hasNextPage) {
      this.getLabelsFrom(labels.repository.labels.pageInfo.endCursor)
    }

    return labels
  }
}
