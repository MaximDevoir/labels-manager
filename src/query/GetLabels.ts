import Query from './Query'
import { Variables } from 'probot/lib/github';
import { Context } from 'probot';

const getLabelsQuery = `
query GetLabels($owner: String!, $repo: String!, $limit: Int = 100, $after: String) {
  rateLimit {
    cost
    limit
    nodeCount
    remaining
    resetAt
  }
  repository(owner: $owner, name: $repo) {
    labels(first: $limit, after: $after) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
      edges {
        cursor
        node {
          id
          name
          description
          color
        }
      }
    }
  }
}
`

type Label = {
  id: string;
  cursor: string;
  name: string;
  description: string;
  color: string;
  default?: boolean;
  url?: string;
}

export interface ResponseInterface {
  repository: {
    pageInfo: PageInfo
    totalCount: number
    labels: {
      edges: LabelEdge[]
    }
  }
}

interface LabelEdge {
  cursor: string
  label: Label
}

interface PageInfo {
  startCursor: string | null
  endCursor: string | null
  hasPreviousPage: boolean
  hasNextPage: boolean
}

interface QueryVariables {
  owner: string;
  repo: string;
  after: string | null
}

class GetLabels extends Query<ResponseInterface> {
  /**
   * Creates an instance of GetLabels.
   * @param {Context} context
   * @param {string} owner
   * @param {string} repo
   * @param {number} limit GitHub API limits us to a maximum of 100 nodes
   * @param {string} [after=""]
   * @memberof GetLabels
   */
  constructor(context: Context, owner: string, repo: string, limit: number, after: string | null = null) {
    const variables = {
      owner,
      repo,
      limit,
      after
    }
    super(context, getLabelsQuery, variables)
  }
}

export default GetLabels
