import { Application } from 'probot'
import Labels from './Labels';

function isMasterBranch(ref: string): boolean {
  return ref === 'refs/heads/master'
}

export = (app: Application): void => {
  // TODO: Process repo on app installation
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
      // eslint-disable-next-line @typescript-eslint/camelcase
      tree_sha: commitHash,
      recursive: 1
    })

    app.log('tree', tree)

    const labels = new Labels(context, owner, repo)
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
