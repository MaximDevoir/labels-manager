import { Variables, Headers } from 'probot/lib/github'
import { Context } from 'probot';

abstract class Query {
  protected queryErrored: boolean = false

  /**
   * Creates an instance of Query.
   *
   * @param {Context} context Context object
   * @param {string} query Query to fire
   * @param {Variables} [variables] Variables to apply to `query`
   * @param {Headers} [headers] Deprecated: Place any headers into the variables
   * argument with the "headers" key.
   * @memberof Query
   */
  constructor(protected context: Context, protected query: string, protected variables?: Variables) {

  }

  async fire() {
    console.log('firing query')
    const { graphql } = this.context.github

    const response = await graphql(this.query, this.variables)

    if (response.errors) {
      // TODO: Securely log errors and remove variables.
      throw `Encountered an error with a query. ID of the query's context is ${this.context.id}`
    }

    return response
  }
}

export default Query
