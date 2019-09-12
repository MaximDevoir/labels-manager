import { Context } from "probot";

type UnPromisify<T> = T extends Promise<infer U> ? U : T;

export interface IMetrics {
  rates: UnPromisify<ReturnType<Context['github']['rateLimit']['get']>>['data']['resources']
}

type MetricsObject = IMetrics | Promise<unknown> | undefined

/**
 * Records metrics from `context`
 *
 * @class Metrics
 */
class Metrics {
  public startMetrics: MetricsObject = undefined
  public endMetrics: MetricsObject = undefined

  /**
   * Creates an instance of Metrics.
   * @param {Context} context
   * @memberof Metrics
   */
  constructor(private context: Context) {}

  async getRateLimits() {
    const v3 = await this.context.github.rateLimit.get()

    return v3
  }

  private async getMetrics() {
    return new Promise<IMetrics>(async resolve =>{
      const rateLimits = await this.getRateLimits()
      const startMetrics: IMetrics = {
        rates: rateLimits.data.resources
      }
      resolve(startMetrics)
    })
  }


  start() {
    if (typeof this.startMetrics === 'object') {
      return this.startMetrics
    }

    this.startMetrics = this.getMetrics().then(metrics => {
      this.startMetrics = metrics
    })

    return this.startMetrics
  }

  end() {
    if (typeof this.endMetrics === 'object') {
      return this.endMetrics
    }

    this.endMetrics = this.getMetrics().then(metrics => {
      this.endMetrics = metrics
    })

    return this.endMetrics
  }

  logMetrics() {
    if (this.startMetrics === undefined) {
      this.context.log('Unable to log metrics. No start metrics recorded.')
      return
    }
    if (this.startMetrics instanceof Promise) {
      this.context.log('Unable to log metrics. The .start() request is still running.')
      return
    }
    if (this.endMetrics === undefined) {
      this.context.log('Unable to log metrics. No end metrics recorded.')
      return
    }
    if (this.endMetrics instanceof Promise) {
      this.context.log('Unable to log metrics. The .start() request is still running.')
      return
    }

    for (const [resource, limits] of Object.entries(this.endMetrics.rates)) {
      const [{remaining: initialRemaining }, {remaining: endRemaining }] = [
        this.startMetrics.rates[resource as keyof IMetrics['rates']],
        limits
      ]
      this.context.log(`Ratelimit cost for ${resource} resource: ${initialRemaining - endRemaining} (${endRemaining} remaining)`)
    }
  }
}

export default Metrics
