import { Context } from 'probot'

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
  private endCursor: string | null = null

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

  private async getLabels(cursor?: string | null) {
    const after = typeof cursor === 'string' || null

  }
}

async function getLabels(
  client: Context,
  owner: string,
  repo: string
): Promise<Label[] | null> {
  const  result = await client.github.graphql(``,
    {
      repo,
      owner
    }
  )

  if (result.errors) {
    return null
  }

  const labels: Label[] = (result as any).repository.labels.nodes
  return labels
}
