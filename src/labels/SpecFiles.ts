import { Context, Octokit } from "probot";

import LabelsError from './../reporter/LabelsError'
import SpecFile from './SpecFile'
import printLines from "../lib/printLines";

export const labelsDirectory = '.github/labels'

type UnPromisify<T> = T extends Promise<infer U> ? U : T;
type GetContentsUnPromisifiedResponse = UnPromisify<ReturnType<Octokit['repos']['getContents']>>

export type ReposGetContentsResponseItemLinks = {
  self: string
  git: string
  html: string
};

/**
 * Visit the [Get
 * Contents API](https://developer.github.com/v3/repos/contents/#get-contents) page
 * for documentation on response
 */
export type ReposGetContentsResponseItem = {
  type: 'file' | 'dir' | 'symlink' | 'submodule'
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  /**
   * Download URL is `null` when item type is `dir`.
   */
  download_url: string
  _links: ReposGetContentsResponseItemLinks
}

export interface GetContentsResponse extends GetContentsUnPromisifiedResponse {
  data: ReposGetContentsResponseItem | ReposGetContentsResponseItem[]
}

class SpecFiles {
  private specFiles: SpecFile[] = []

  constructor(private context: Context) {
  }

  async fetchSpecFiles() {
    const { after: commitSha} = this.context.payload
    let dirContents
    try {
      dirContents = await this.context.github.repos.getContents({
        ...this.context.repo(),
        path: labelsDirectory,
        ref: commitSha
      }) as GetContentsResponse

      if (!Array.isArray(dirContents.data)) {
        throw new LabelsError(this.context, {
          title: 'Unable to scan labels directory',
          summary: 'Bad labels directory',
          text: [
            `Unable to read labels from \`${labelsDirectory}\`. Is \`${labelsDirectory}\` a directory?`,
            `The path \`${labelsDirectory}\` appears to be of type: \`${dirContents.data.type}\`.`
          ]
        })
      }

      /**
       * The `getContents` method is limited to 1,000 items.
       *
       * See more on the [GitHub API page](https://developer.github.com/v3/repos/contents/#get-contents)
       */
      const maxFilesInDirectory = 30
      if (dirContents.data.length >= maxFilesInDirectory) {
        throw new LabelsError(this.context, {
          title: 'Too many files in labels directory',
          summary: [
            `There are too many files in \`${labelsDirectory}\`. The labels directory cannot exceed ${maxFilesInDirectory} files.`,
            'Try moving non-relevant files to another directory.'
          ]
        })
      }

      const addedFiles = dirContents.data.filter(node => {
        if (node.type === 'file' && node.name.toLowerCase().endsWith('.json')) {
          return true
        }

        return false
      }).map(async file => {
        const specFile = new SpecFile(this.context, file)
        return specFile.fetchSpec()
      })

      await Promise.all(addedFiles).then(specFiles => {
        this.specFiles = specFiles
      })
    } catch (err) {
      if (err.name === 'LabelsError') {
        throw err
      }

      throw new LabelsError(this.context, {
        title: 'No Labels Discovered',
        summary: 'No labels discovered in the repository.',
        text: [
          `No labels found in \`${labelsDirectory}\`. Did you place your label files somewhere else?`,
          '',
          'If you have not setup any label files, you can safely ignore this message.',
          // TODO: Add link to getting-started page
        ]
      }, err)
    }

    this.reportLabelErrors()
  }

  private reportLabelErrors() {
    const specErrors: string[] = []
    let specErrorCount: number = 0

    this.specFiles.forEach(specFile => {
      if (specFile.schemaErrors.hasErrors()) {
        specErrorCount += specFile.schemaErrors.getErrorCount()

        const specFileErrors: string[] = specFile.schemaErrors.errors.map((specError, index) => {
          /**
           * Padding lines required. See https://gist.github.com/pierrejoubert73/902cc94d79424356a8d20be2b382e1ab
           */
          return printLines([
            '<details>',
            `<summary>${index}. ${specError.title}</summary>`,
            '',
            ...specError.text,
            '</details>',
            ''
          ])
        })

        specErrors.push(
          `### ${specFile.fileInfo.name}`,
          ...specFileErrors
        )
      }
    })

    if (specErrors.length) {
      throw new LabelsError(this.context, {
        title: 'Invalid Label Setup',
        summary: [
          'Please fix the errors described below.',
          ...specErrors
        ],
        text: [
          `**Error Count**: ${specErrorCount}`
        ]
      })
    }
  }
}

export default SpecFiles
