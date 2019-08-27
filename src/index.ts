import { Application, Context } from 'probot'

function isMasterBranch(ref: string): boolean {
  return ref === 'refs/heads/master'
}

type Label = {
  color: string
  default: boolean
  id: string
  name: string
  node_id: string
  url: string
}

async function getLabels(
  client: Context,
  owner: string,
  repo: string
): Promise<Pick<Label, 'name' | 'id'>[] | null> {
  const  result = await client.github.graphql(
    `query Labels($repo: String!, $owner: String!) {
      repository(name: $repo, owner: $owner) {
        labels(first: 100) {
          nodes {
            id
            name
            description
            color
          }
        }
      }
    }
  `,
    {
      repo,
      owner
    }
  )

  if (result.errors) {
    return null
  }

  const labels = (result as any)
  return labels
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
      tree_sha: commitHash,
      recursive: 1
    })

    app.log('tree', tree)

    app.log('attempting')
    const labels = await getLabels(context, owner, repo)

    if (!labels) {
      return context.log('Error while retrieving labels.')
    }

    context.log('labels', labels)
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
