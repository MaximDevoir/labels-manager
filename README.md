# Probot Labels

Similar to git-labelmaker and git-label. Except this is a probot app that, on push to certain files in the '.github' folder, will read those files and add those labels to the repo.

## Resources

[GitHub Labels API V3](https://developer.github.com/v3/issues/labels/#update-a-label)

## Features

- Updates labels on changes to certain files.

## QA

### What happens when an existing label is renamed?

Do previous Labels get removed from the issue? How can we identify which labels need to be renamed, and which need to be added/removed?
