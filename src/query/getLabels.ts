import Query from './Query'
import { Variables } from 'probot/lib/github';
import { Context } from 'probot';

const getLabelsQuery = `
query GetLabels($owner: String!, $repo: String!, $after: String, $limit: Int = 100) {
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

class GetLabels extends Query {
  constructor(context: Context, variables?: Variables) {
    super(context, getLabelsQuery, variables)
  }
}

export default GetLabels
