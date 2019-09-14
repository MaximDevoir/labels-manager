import fetch from 'node-fetch'
import parseJSON from 'parse-json'
import stripAnsi from 'strip-ansi'

import { ReposGetContentsResponseItem } from './SpecFiles'
import LabelsError from '../reporter/LabelsError';
import validateLabels from './../schema/labels'
import SpecSchemaErrors from './SpecSchemaErrors'
import { Context } from 'probot';

export interface SpecFileLabel {
  name: string,
  color: string,
  description?: string
}

class SpecFile {
  public schemaErrors = new SpecSchemaErrors()

  constructor(private context: Context, public fileInfo: ReposGetContentsResponseItem) {}

  private checkFileSize() {
    /**
     * **API Note:** The GitHub API limits us to files of 1MB in size.
     * @const {number} sizeLimit Maximum size of spec file in bytes.
     */
    const sizeLimit = 1000**2
    if (this.fileInfo.size >= sizeLimit) {
      throw new LabelsError(this.context, {
        title: 'File Too Large ',
        summary: [
          `The file \`${this.fileInfo.name}\` exceeds the ${sizeLimit/1000}KB limit.`,
          '### Solution',
          `Split \`${this.fileInfo.name}\` into multiple - smaller - files.`
        ]
      })
    }
  }

  private async fetchSpecContents () {
    let response
    let content

    try {
      response = await fetch(this.fileInfo.download_url)
      content = await response.text()
    } catch (err) {
      throw new LabelsError(this.context, {
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
    let validLabels: SpecFileLabel[] = []
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
            validLabels.push(parsedContentElement)
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
    this.checkFileSize()
    await this.fetchSpecContents()
    return this
  }
}

export default SpecFile
