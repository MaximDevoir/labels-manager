import { Variables } from 'probot/lib/github'
import { Context } from 'probot';

import LabelsError from './../reporter/LabelsError'

class Query<IResponse> {
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

  fire() {
    const { graphql } = this.context.github
    const response = graphql(this.query, this.variables)

    response.catch(res => {
      throw new LabelsError({
        title: 'Error: Encountered an error with a query.',
        summary: 'Encountered an error while executing a query.',
        text: [
          'If this error persists, the app may be experiencing a bug.'
        ]
      }, res)
    })

    // According to the Octokit/graphql response, it is possible for the
    // response to be null. I don't if this is actually possible, so we will
    // throw an error if that happens.
    const responseData = response.then(res => {
      if (res == null) {
        throw new LabelsError({
          title: 'Internal Error: Unexpected query response (null)',
          summary: 'Unexpected query response (null)',
          text: [
            'While executing a query, the data received was null.',
          ]
        })
      }

      return res as any as IResponse
    })

    return responseData
  }
}

export default Query
