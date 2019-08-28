import { Context } from 'probot'

type Pagination = {
  startCursor: string;
  endCursor: string;
  hasNextPage: Boolean | null;
  hasPreviousPage: Boolean | null;
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
  get pageInfo() {
    return this._pageInfo
  }

  set pageInfo(info: Pagination) {
    this._pageInfo = info
  }

  private async getLabels(cursor?: string | null) {
    const after = typeof cursor === 'string' || null
  }
}
