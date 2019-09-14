import fetch from 'node-fetch'
import parseJSON from 'parse-json'
import stripAnsi from 'strip-ansi'
import { Context, Octokit } from 'probot';
import LabelsError from '../reporter/LabelsError';
import validateLabels from './../schema/labels'

import { promises } from 'fs';

const hexColorRegex = require('hex-color-regex')

type UnPromisify<T> = T extends Promise<infer U> ? U : T;
type GetTreeUnPromisifiedResponse = UnPromisify<ReturnType<Octokit['git']['getTree']>>
type GetContentsUnPromisifiedResponse = UnPromisify<ReturnType<Octokit['repos']['getContents']>>

/**
 * Properties that exist on all items
 */
export type GitGetTreeResponseTreeBaseItem = {
  /**
   * Path to the item
   */
  path: string;
  /**
   * The SHA1 checksum of the object in the tree.
   */
  sha: string;
  url: string;
}

/**
 * Refer to ["Get A
 * Tree"](https://developer.github.com/v3/git/trees/#get-a-tree) api for
 * response information
 */
export type GitGetTreeResponseTreeItem = GitGetTreeResponseTreeBaseItem & ({
  type: 'blob'
  /**
   * The File mode (blob):
   * - **10644** for regular file
   * - **100755** for executable
   * - **120000** for symlink
   */
  mode: '100644' | '100755' | '120000'
  size: number
} | {
  type: 'tree'
  mode: '040000'
} | {
  type: 'commit'
  /**
   * - **160000** for submodule
   */
  mode: '160000'
})

export interface GitTreeData {
  sha: string
  url: string
  truncated: boolean,
  tree: GitGetTreeResponseTreeItem[]
}

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

export interface Label {
  name: string,
  color: string,
  description?: string
}

export interface FileResponseItem extends ReposGetContentsResponseItem {
  /**
   * Type of item is `file`
   */
  type: 'file',
  /**
   * The contents from `download_url`
   */
  content: Label[]
}

/**
 * @Octokit/rest's `getTree` does not contain structure schema for `data`.
 */
export interface GetTreeResponse extends GetTreeUnPromisifiedResponse {
  data: GitTreeData
}

export interface GetContentsResponse extends GetContentsUnPromisifiedResponse {
  data: ReposGetContentsResponseItem | ReposGetContentsResponseItem[]
}

export const labelsDirectory = '.github/labels'

export type LabelCache = {
  [key: string]: {
    [key: string]: FileResponseItem
  }
}

class RepoLabels {
  /**
   * TODO: LabelCache should be its own class
   *
   * @protected
   * @type {LabelCache}
   * @memberof RepoLabels
   */
  protected labelCache: LabelCache = {}

  constructor(protected context: Context) {}

  async addFileToCache(item: Omit<FileResponseItem, 'content'>) {
    if (typeof this.labelCache[item.name] !== 'object') {
      this.labelCache[item.name] = {}
    }
    this.removeFileFromCache(item)

    /**
     * **API Note:** The GitHub API limits us to files of 1MB in size.
     * @const {number} sizeLimit Maximum size of spec file in bytes.
     */
    const sizeLimit = 1000**2
    if (item.size >= sizeLimit) {
      throw new LabelsError(this.context, {
        title: 'File Too Large ',
        summary: [
          `The file \`${item.name}\` exceeds the ${sizeLimit/1000}KB limit.`,
          '### Solution',
          `Split \`${item.name}\` into multiple - smaller - files.`
        ]
      })
    }

    let response
    let content

    try {
      response = await fetch(item.download_url)
      content = await response.text()
    } catch (err) {
      throw new LabelsError(this.context, {
        title: 'Unable to download label configuration',
        summary: 'Unable to download label configuration'
      },
      '\nerror:\n', err,
      '\nitem:\n', item,
      '\nresponse:\n', response)
    }

    let parsedContent
    let validatedContent: Label[] = []
    try {
      parsedContent = parseJSON(content)

      let validationErrors: string[] = []
      if (!Array.isArray(parsedContent)) {
        validationErrors.push(
          '- Configuration is not an array.',
          '```JSON',
          `${JSON.stringify(parsedContent, null, 2).slice(0, 250)}`,
          '```'
        )
      } else {
        parsedContent.forEach(parsedContentElement => {
          const { error, value } = validateLabels(parsedContentElement)

          if (error) {
            this.context.log('annotated error', error.annotate())
          } else {
            validatedContent.push(parsedContentElement)
          }
        })
      }

      if (validationErrors.length) {
        throw new LabelsError(this.context, {
          title: 'Label configuration is invalid',
          summary: [
            `Label configuration for \`${item.name}\` is invalid.`,
            ...validationErrors
          ],
          text: [
            '### Meta Information',
            `**Error Count**: ${validationErrors.length}`
          ]
        })
      }
    } catch (err) {
      if (err.name === 'JSONError') {
        throw new LabelsError(this.context, {
          title: 'Unable to parse JSON',
          summary: [
            `Unable to parse JSON in file \`${item.name}\``,
            '```',
            `${err.message ? stripAnsi(err.message) : ''}`,
            '```'
          ],
          text: [
            '### Code Frame',
            '```',
            `${err.codeFrame ? stripAnsi(err.codeFrame) : 'No frame available.'}`,
            '```'
          ]
        }, '\nError caught:\n', err)
      }

      throw err
    }

    this.labelCache[item.name][item.path] = Object.assign(item, {
      content: validatedContent
    })
  }

  removeFileFromCache(item: Pick<FileResponseItem, 'path' | 'name'>) {
    if (typeof this.labelCache[item.name] === 'object') {
      delete this.labelCache[item.name][item.path]
    }
  }

  async getRepoLabels() {
    const {
      after: commitSha,
      repository: {
        name: repo,
        owner: { name: owner }
      }
    } = this.context.payload

    let dirContents
    try {
      dirContents = await this.context.github.repos.getContents({
        owner,
        repo,
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

      const addedFiles = dirContents.data.filter(node => {
        if (node.type === 'file' && node.name.toLowerCase().endsWith('.json')) {
          return true
        }

        return false
      }).map(async node => {
        // TypeScript should recognize, without the type assertion below, that
        // `type` is `file`, as we declared above.
        return await this.addFileToCache(node as Omit<typeof node, 'type'> & { type: 'file'})
      })

      await Promise.all(addedFiles)

      return this.labelCache

    } catch (err) {
      if (err.name === 'LabelsError') {
        throw err
      }

      throw new LabelsError(this.context, {
        title: 'No Labels Discovered',
        summary: 'No labels discovered in the repository.',
        text: [
          `No label configuration found in \`${labelsDirectory}\`. Did you place your label files somewhere else?`,
          '',
          'If you have not setup any label files, you can safely ignore this message.'
        ]
      }, err)
    }
  }
}

export default RepoLabels
