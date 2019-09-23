import { Octokit } from "probot"

type UnPromisify<T> = T extends Promise<infer U> ? U : T;

const time = new Date()

/**
 * The reset time for GitHub's API is every hour
 */
const resetTime = new Date().setHours(time.getHours()+1)

export const rateLimitResourcesResponse: UnPromisify<ReturnType<Octokit['rateLimit']['get']>>['data']['resources'] = {
  core: {
    limit: 5000,
    remaining: 4992,
    reset: resetTime
  },
  search: {
    limit: 30,
    remaining: 30,
    reset: resetTime
  },
  graphql: {
    limit: 5000,
    remaining: 4998,
    reset: resetTime
  },
  integration_manifest: {
    limit: 5000,
    remaining: 5000,
    reset: resetTime
  }
}

const rate = {
  status: 200,
  url: 'https://api.github.com/rate_limit',
  headers: {
    'access-control-allow-origin': '*',
    'access-control-expose-headers': 'ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval, X-GitHub-Media-Type',
    'cache-control': 'no-cache',
    connection: 'close',
    'content-encoding': 'gzip',
    'content-security-policy': 'default-src \'none\'',
    'content-type': 'application/json; charset=utf-8',
    date: 'Fri, 20 Sep 2019 20:44:52 GMT',
    'referrer-policy': 'origin-when-cross-origin, strict-origin-when-cross-origin',
    server: 'GitHub.com',
    status: '200 OK',
    'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
    'transfer-encoding': 'chunked',
    vary: 'Accept-Encoding',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'deny',
    'x-github-media-type': 'github.v3; format=json',
    'x-github-request-id': 'CD6A:02B4:454D66F:5228F66:5D853A44',
    'x-ratelimit-limit': '5000',
    'x-ratelimit-remaining': '4996',
    'x-ratelimit-reset': resetTime,
    'x-xss-protection': '1; mode=block'
  },
  data: rateLimitResourcesResponse
}
