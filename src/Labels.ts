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

  async getLabels(after = "", limit = 100): Promise<GetLabels> {
    const labels = new GetLabels(this.context, this.owner, this.repo, limit, after)

    return labels
  }
}
