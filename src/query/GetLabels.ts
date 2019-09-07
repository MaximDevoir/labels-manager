import Query from './Query'
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
  name: string;
  description: string;
  color: string;
  default?: boolean;
  url?: string;
}

export interface GetLabelsResponse {
  repository: {
    labels: {
      pageInfo: PageInfo
      totalCount: number
      edges: LabelEdge[]
    }
  }
}

interface LabelEdge {
  cursor: string
  label: Label
}

export interface PageInfo {
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

class GetLabels extends Query<GetLabelsResponse> {
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
    let afterCursor = after
    if (typeof after === 'string' && after.length === 0) {
      afterCursor = null
    }
    const variables = {
      owner,
      repo,
      limit,
      after: afterCursor
    }

    super(context, getLabelsQuery, variables)
  }
}

export default GetLabels
