# Labels Manager

> Labels Manager makes managing your project's GitHub labels easy and
> hassle-free.

## Useful Developer Resources

[GitHub Interactive GraphQL API Explorer](https://developer.github.com/v4/explorer/)

[Octokit `rest.js` Documentation](https://octokit.github.io/rest.js/)

[GitHub Labels API V3](https://developer.github.com/v3/issues/labels/#update-a-label)

View the [spec](spec.md).

### API Previews

[GraphQL API v4 Previews](https://developer.github.com/v4/previews/)

[REST API v3 Previews](https://developer.github.com/v3/previews/)

### Extended GitHub Integrations

> Obtain developer licenses to build and test your application against GitHub
> Enterprise Server.

[GitHub Developer Program](https://developer.github.com/program/)

## Versioning

### When changing application permissions

Bump the major version when changes are made to application permissions. Users
need to either accept the permission updates or reinstall the application.

**Always fill out the description of changes** at the bottom of the permissions
change. I've noticed I haven't been notified in my applications if the
permissions are updated without a reason specified.

## Cutting a Release

### Environment Variables

The required environment variables are: ...

Incomplete steps

`yarn run build`

`NODE_ENV=production serverless deploy`
