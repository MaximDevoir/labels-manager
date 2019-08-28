import { Variables, Headers } from 'probot/lib/github'
import { Context } from 'probot';

abstract class Query {
  protected errors: null | [] = null

  constructor(protected context: Context, protected query: string, protected variables?: Variables, protected headers?: Headers) {

  }

  async fire() {
    this.context.log('firing event')

    const { graphql } = this.context.github

    const response = await graphql(this.query, this.headers, this.variables)

    if (response.errors && response.errors.length >= 1) {
      this.context.log('has errors')
    }
  }
}

export default Query
