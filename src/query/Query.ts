import { Variables, Headers } from 'probot/lib/github'
import { Context } from 'probot';

abstract class Query {
  constructor(protected context: Context, protected query: string, protected variables?: Variables, protected headers?: Headers) {
    context.log('constructed with ', query, variables, headers)
  }

  async fire() {
    const { graphql } = this.context.github

    const response = await graphql(this.query, this.headers, this.variables)

    return response
  }
}

export default Query