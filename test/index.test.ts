import nock from 'nock'
import { Probot } from 'probot'

import labelsManager from './../src/index'
import pushPayload from './fixtures/labels-manager-testing.push'
import { rateLimitResourcesResponse } from './fixtures/rate_limit'

nock.disableNetConnect()

describe('Labels Manager', () => {
  let probot: Probot

  beforeEach(() => {
    probot = new Probot({ id: 123, cert: 'test' })
    const app = probot.load(labelsManager)

    app.app = {
      getSignedJsonWebToken() {
        return 'test-token'
      },
      getInstallationAccessToken() {
        return Promise.resolve('test-token')
      }
    }
  })

  // it('does a thing', async () => {
  //   const pushNock = nock('https://api.github.com')
  //     .get('/rate_limit')
  //     .reply(200, rateLimitResourcesResponse)
  //   await probot.receive({
  //     name: "push",
  //     id: "test-event-id",
  //     payload: pushPayload.payload
  //   })
  // })
})
