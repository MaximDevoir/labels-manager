import { Application, Context } from 'probot'

function isMasterBranch(ref: string): boolean {
  return ref === 'refs/heads/master'
}

type Label = {
  color: string
  default?: boolean
  description: string
  id: string
  name: string
  url?: string
}

async function getLabels(
  client: Context,
  owner: string,
  repo: string
): Promise<Label[] | null> {
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

  const labels: Label[] = (result as any).repository.labels.nodes
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

    const currentLabelCache : {
      [key: string]: Label
    } = {}

    labels.forEach(label => {
      currentLabelCache[label.name] = {
        id: label.id,
        name: label.name,
        color: label.color,
        description: label.description
      }
    })
    context.log('currentLabelCache', currentLabelCache)
  })
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
