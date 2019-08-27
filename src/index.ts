import { Application } from 'probot'

function isMasterBranch(ref: string): boolean {
  return ref === 'refs/heads/master'
}

export = (app: Application): void => {
  app.on('push', async context => {
    const {
      after: commitHash,
      repository: {
        name: repo,
        owner: { name: owner }
      }
    } = context.payload

    const onMaster = isMasterBranch(context.payload.ref)

    if (!owner) {
      app.log('could not find an owner.')
      return
    }

    if (!onMaster) {
      app.log('not on master, leaving')
      return
    }

    app.log('commit hash', commitHash)
    const {
      data: { tree }
    } = await context.github.git.getTree({
      owner,
      repo,
      tree_sha: commitHash
    })

    app.log('tree', tree)

    const { data: x } = await context.github.graphql(`{
      rateLimit(dryRun: false) {
        limit
        remaining
      }
      repository(owner: "MaximDevoir", name: "create-nom-app") {
        labels(first: 100) {
          edges {
            node {
              name
              description
              color
            }
          }
        }
      }
    }`)

    app.log('x', x)
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
