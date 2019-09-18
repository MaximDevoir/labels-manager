import SpecLabel, { ISpecLabel } from "./SpecLabel";
import SpecFile from "./SpecFile";
import LabelsError from "../reporter/LabelsError";
import Job from "../Job";
import IssueLabels from "./IssueLabels";
import { IIssueLabel } from "./IssueLabel";

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

/**
 * Checks if their are any collisions with the specified alias setup.
 *
 * A collision occurs when:
 *  - (ACTIVE_SPEC_NAME) The alias is matched to the name of a spec label
 *  - (ACTIVE_ISSUE_NAME) The alias' associated label name is matched to the
 *    name of an issue label - WHERE the alias is matched to the name of an
 *    issue label.
 *  - (DUPLICATE_ALIAS) The alias is used more than once
 *
 * TODO: Build the alias map during `SpecLabels.addLabelTo` method.
 */
export function checkForAliasCollisions(spec: SpecLabels, issue: IssueLabels) {
  type AliasAssocSpecElement = SpecLabelsElement
  const aliasMap: {
    [key: string]: AliasAssocSpecElement[]
  } = {}

  spec.iterateLabels((label, spec) => {
    const { aliases } = spec.label.label
    aliases.forEach(alias => {
      if (!(alias in aliasMap)) {
        aliasMap[alias] = [spec]
      } else {
        aliasMap[alias].push(spec)
      }
    })
  })

  const collisionMap: {
    [key: string]: Partial<{
      'ACTIVE_SPEC_NAME': SpecLabelsElement[]
      'ACTIVE_ISSUE_NAME': IIssueLabel
      'DUPLICATE_ALIAS': SpecLabelsElement[]
    }>
  } = {}
  for (const [alias, assocSpecLabels] of Object.entries(aliasMap)) {
    collisionMap[alias] = {}

    if (assocSpecLabels.length > 1) {
      collisionMap[alias]['DUPLICATE_ALIAS'] = assocSpecLabels
    }

    if (alias in Object.keys(spec.labels)) {
      collisionMap[alias]['ACTIVE_SPEC_NAME'] = spec.labels[alias]
    }

    if (alias in Object.keys(issue.labels)) {
      const aliasAssocLabel = assocSpecLabels[0]
      if (aliasAssocLabel.label.label.name in Object.keys(issue.labels)) {
        collisionMap[alias]['ACTIVE_ISSUE_NAME'] = issue.getLabel(alias)
      }
    }
  }

  const collisionMsg: string[] = []

  for (const [alias, collision] of Object.entries(collisionMap)) {
    collisionMsg.push(`#### Alias \`${alias}\``)

    if (collision['ACTIVE_SPEC_NAME'] && collision['ACTIVE_SPEC_NAME'].length > 0) {
      collisionMsg.push('The alias is being used as the name of a label in:',
      ...collision['ACTIVE_SPEC_NAME'].map(specElement => {
        return `- ${specElement.file.fileInfo.path}`
      }))
    }

    if (collision['DUPLICATE_ALIAS'] && collision['DUPLICATE_ALIAS'].length > 0) {
      collisionMsg.push('The alias is being used in multiple locations"',
      ...collision['DUPLICATE_ALIAS'].map(specElement => {
        return `- ${specElement.file.fileInfo.path}`
      }))
    }

    if (collision['ACTIVE_ISSUE_NAME']) {
      collisionMsg.push(
        `The alias and it's associated label are both active issue labels.`,
        `Associated Active Label: [${collision['ACTIVE_ISSUE_NAME'].name}](${collision['ACTIVE_ISSUE_NAME'].url})`,
      )
    }
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

  /**
   * Iterate over each spec labels element.
   * @param iteratee
   */
  iterateLabels(iteratee: (label: string, spec: SpecLabelsElement) => void) {
    for (const [label, specLabels] of Object.entries(this.labels)) {
      specLabels.forEach(spec => {
        iteratee(label, spec)
      })
    }
  }
}

export default SpecLabels
