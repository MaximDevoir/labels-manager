// @ts-ignore
import { serverless } from '@probot/serverless-lambda'
import probotApp from './index'

const main = serverless(probotApp)

export {
  main
}
