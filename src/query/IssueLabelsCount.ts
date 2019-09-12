import { Context } from 'probot'
import Query from './Query'

const totalCountQuery = `
query GetIssueLabelsTotalCount($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    labels {
      totalCount
    }
  }
}
`

export interface TotalCountResponse {
  repository: {
    labels: {
      totalCount: number
    }
  }
}

class GetIssueLabelTotalCount extends Query<TotalCountResponse> {
  constructor (context: Context) {
    super(context, totalCountQuery, {
      ...context.repo()
    })
  }
}

export default GetIssueLabelTotalCount
