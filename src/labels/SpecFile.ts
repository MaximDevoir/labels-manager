import fetch from 'node-fetch'
import parseJSON from 'parse-json'
import stripAnsi from 'strip-ansi'

import { ReposGetContentsResponseItem } from './SpecFiles'
import LabelsError from '../reporter/LabelsError';
import validateLabels from './../schema/labels'
import { Context } from 'probot';

export interface SpecFileLabel {
  name: string,
  color: string,
  description?: string
}

class SpecFile {
  private schemaErrors = []
  private schemaWarnings = []

  constructor(private context: Context, private fileInfo: ReposGetContentsResponseItem) {}

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
            validationErrors.push('```' + stripAnsi(error.annotate()) + '```')
          } else {
            validLabels.push(parsedContentElement)
          }
        })
      }

      // TODO: This should be handled by SpecFiles
      // if (validationErrors.length) {
      //   throw new LabelsError(this.context, {
      //     title: 'Label configuration is invalid',
      //     summary: [
      //       `Label configuration for \`${this.fileInfo.name}\` is invalid.`,
      //       ...validationErrors
      //     ],
      //     text: [
      //       '### Meta Information',
      //       `**Error Count**: ${validationErrors.length}`
      //     ]
      //   })
      // }
    } catch (err) {
      if (err.name === 'JSONError') {
        throw new LabelsError(this.context, {
          title: 'Unable to parse JSON',
          summary: [
            `Unable to parse JSON in file \`${this.fileInfo.name}\``,
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
  }


  async fetchSpec () {
    this.checkFileSize()
    await this.fetchSpecContents()
    return this
  }
}

export default SpecFile
