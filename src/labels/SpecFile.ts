import fetch from 'node-fetch'
import parseJSON from 'parse-json'
import stripAnsi from 'strip-ansi'

import { ReposGetContentsResponseItem } from './SpecFiles'
import LabelsError from '../reporter/LabelsError';
import validateLabels from './../schema/labels'
import SpecSchemaErrors from './SpecSchemaErrors'
import { Context } from 'probot';
import Job from '../Job';

class SpecFile {
  public schemaErrors = new SpecSchemaErrors()

  constructor(private context: Context, private job: Job, public fileInfo: ReposGetContentsResponseItem) {}

  /**
   * Checks if the file size is within `sizeLimit`.
   *
   * **API Note:** The GitHub API limits us to files of 1MB in size.
   *
   * @returns {boolean} Returns `false` when file size is too large.
   */
  private checkFileSize(sizeLimit: number = 1000**2): boolean {
    if (this.fileInfo.size >= sizeLimit) {
      this.schemaErrors.add({
        type: 'error',
        title: 'File too large',
        text: [
          `The file \`${this.fileInfo.name}\` exceeds the ${sizeLimit/1000}KB limit.`,
          '**Solutions**',
          `- Split \`${this.fileInfo.name}\` into multiple - smaller - files.`
        ]
      })

      return false
    }

    return true
  }

  private async fetchSpecContents () {
    let response
    let content

    try {
      response = await fetch(this.fileInfo.download_url)
      content = await response.text()
    } catch (err) {
      throw new LabelsError({
        title: 'Unable to download label configuration',
        summary: [
          `Unable to download label configuration for \`${this.fileInfo.name}\``
        ]
      },
      '\nError:\n', err,
      '\nFile Info:\n', this.fileInfo,
      '\nResponse:\n', response)
    }

    let parsedContent
    try {
      parsedContent = parseJSON(content)

      if (!Array.isArray(parsedContent)) {
        this.schemaErrors.add({
          type: 'error',
          title: 'Configuration is not an array',
          text: [
            '```JSON',
            `${JSON.stringify(parsedContent, null, 2).slice(0, 250)}`,
            '```'
          ]
        })
      } else {
        parsedContent.forEach(parsedContentElement => {
          const { error, value } = validateLabels(parsedContentElement)

          if (error) {
            this.schemaErrors.add({
              type: 'error',
              title: 'Invalid label format',
              text: [
                '```',
                stripAnsi(error.annotate()),
                '```'
              ]
            })
          } else {
            this.job.specLabels.addLabel(value, this)
          }
        })
      }
    } catch (err) {
      if (err.name === 'JSONError') {
        this.schemaErrors.add({
          type: 'error',
          title: 'Unable to parse JSON',
          text: [
            `Unable to parse JSON in file \`${this.fileInfo.name}\``,
            '```',
            `${err.message ? stripAnsi(err.message) : ''}`,
            '```'
          ]
        })

        return
      }

      throw err
    }
  }


  async fetchSpec () {
    if (this.checkFileSize() === false) return this

    await this.fetchSpecContents()
    return this
  }
}

export default SpecFile
