import { Context } from 'probot'

import GetLabels from './query/GetLabels'

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
  private _labels: LabelCollection = {}
  private _totalCount: number | null = null
  private _pageInfo: Pagination = {
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
    this._labels = Object.assign({}, this.labels, labels)
  }

  /**
   * Pagination information from the instance of the last `fired` query.
   *
   * @memberof Labels
   */
  get pageInfo(): Pagination {
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

  async getLabels() {
    // First get labels request. We should verify this is the first request - we
    // should only run `getLabels` once.
    const firstLabelRequest = await this.addLabelsFrom()

    const { totalCount } = firstLabelRequest.repository

    console.log('firstLabelRequest is', (firstLabelRequest as any).repository.labels.edges)

    return firstLabelRequest
  }

  /**
   * Get labels `limit` number of labels after `cursor`.
   *
   * @private
   * @param {string} [cursor=""] Cursor where to begin search. If left empty,
   * search will start at the beginning.
   * @param {number} [limit=100] Maximum allowed by GitHub API is 100.
   * @returns
   * @memberof Labels
   */
  private async addLabelsFrom(cursor = null, limit = 100) {
    const labels = await new GetLabels(this.context, this.owner, this.repo, limit, cursor).fire()

    return labels
  }
}
