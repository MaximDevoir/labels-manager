# Labels Manager Spec

> Unofficial name of app.

Could be called `Labels-Manager`

> Note for Enterprise users: This project may not support enterprise
> repositories, which may use a different GitHub API.

## Table of Contents

- [Labels Manager Spec](#labels-manager-spec)
  - [Table of Contents](#table-of-contents)
  - [What is it](#what-is-it)
  - [File Spec](#file-spec)
  - [Application Limits](#application-limits)
    - [Label Entries](#label-entries)
  - [Renaming Labels](#renaming-labels)
  - [Creating Labels](#creating-labels)
  - [Label Format](#label-format)
  - [Deleting Labels](#deleting-labels)
    - [Delete File Format](#delete-file-format)
    - [Events](#events)
      - [On Delete Success](#on-delete-success)
  - [Events](#events-1)
    - [duplicate_label](#duplicatelabel)
    - [too_many_labels](#toomanylabels)
    - [invalid_json](#invalidjson)
  - [Integrations](#integrations)
    - [Slack](#slack)

## What is it

Labels Manager makes managing your project's GitHub labels easy and hassle-free.

## File Spec

Label configuration files are stored in the `.github` or `.github/labels`
directory of the repository. The format of files to be read are `*.labels.json`.

Example Structure:

```js
project repo
├── .github
│   └── actions.labels.json
│   └── CODE_OF_CONDUCT.md
│   └── errors.labels.json
│   └── priority.labels.json
├── .gitignore
├── LICENSE.md
├── README.md
```

## Application Limits

### Label Entries

Label Entry Limit: 512

The app should not handle more than the specified limit. If a repository has
more than label entries than the limit, fire a
[`too_many_labels`](#too_many_labels) event.

## Renaming Labels

If labels filename is `<name>.labels.json` then labels rename filename must be
`<name>.rename.labels.json`

```TypeScript
// <name>.labels.json
{
  "rename": {
    "previous-label-name": "new-label-name"
  }
}

// <name>.rename.labels.json
{
  "labels": {
    "new-label-name": {
      ...
    }
  }
}
```

- The new label name must be unique.
- The new label name must not already be present on GitHub. If so, consider
  renaming a success.

Labels that are successfully renamed should be removed as part of a pull
request.

## Creating Labels

If a label entry is not present in the repository, create it.

## Label Format

```TypeScript
{
  "labels": {
    "valid-label-name": {
      "description": string (default="")
      "color": HexString
    }
  }
}
```

## Deleting Labels

To delete labels, a separate file must be created to delete labels.

If labels filename is `<name>.labels.json` then labels delete filename must be
`<name>.delete.labels.json`

### Delete File Format

```TypeScript
{
  "name-of-label": { // Name of label from associated *.labels.json file
    delete: boolean
  }
}
```

### Events

#### On Delete Success

When a label is successfully deleted, create or add to an existing PR the remove
removed label from the `<name>.delete.labels.json` file.

Labels whose `delete` value is not `true` are must also be removed from the file
and added to the PR.

Delete the `<name>.delete.labels.json` file if all entries execute successfully.

Delete the entry in the associated `<name>.labels.json` file, if present; add to
PR.

## Events

### duplicate_label

If a label entry is a duplicate, fire off a `duplicate_label` event.

The app should quit and file an issue.

### too_many_labels

This event should notify the user that they have exceeded the amount of labels
that can be processed by the application.

### invalid_json

If the JSON of a file cannot be parsed, create issue that the JSON is invalid.

## Integrations

### Slack

Be notified via Slack about certain events.
