import SpecLabel, { ISpecLabel } from "./SpecLabel";
import SpecFile from "./SpecFile";
import LabelsError from "../reporter/LabelsError";
import Job from "../Job";

interface SpecLabelsElement {
  label: SpecLabel
  file: SpecFile
}

/**
 * Checks if any specified labels have been duplicated in different locations.
 *
 * Throws and reports any duplicates discovered.
 *
 * @param {Job} job
 */
export function checkForDuplicates(job: Job) {
  const errorMsg: string[] = []
  for (const [label, specLabels] of Object.entries(job.specLabels.labels)) {
    if (specLabels.length <= 1) {
      continue
    }

    const declaredFiles = specLabels.map(specLabel => {
      return `\`${specLabel.file.fileInfo.path}\``
    })

    errorMsg.push(...[
      `Duplicate entries for the label \`${label}\` discovered in:`,
      ...declaredFiles.map(file => `- \`${file}\``),
      ''
    ])
  }

  if (errorMsg.length) {
    throw new LabelsError(job.context, {
      title: 'Duplicate label entries',
      summary: errorMsg
    })
  }
}

class SpecLabels {
  private _labels: {
    [key: string]: SpecLabelsElement[]
  } = {}
  /**
   * Creates an instance of SpecLabels.
   *
   * @memberof SpecLabels
   */
  constructor () {}

  /**
   * Add a label ot the cache
   *
   * @param {ISpecLabel} label
   * @param {SpecFile} file
   * @memberof SpecLabels
   */
  addLabel(label: ISpecLabel, file: SpecFile) {
    this.addLabelTo(label.name, {
      label: new SpecLabel(label),
      file
    })
  }

  private addLabelTo(name: string, label: SpecLabelsElement) {
    if (!(name in this._labels)) {
      this._labels[name] = []
    }

    this._labels[name].push(label)
  }

  get labels() {
    return this._labels
  }
}

export default SpecLabels
