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
export function checkForAliasCollisions(job: Job) {
  const {
    issueLabels: issue,
    specLabels: spec
  } = job

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
      'ACTIVE_ISSUE_NAME': [SpecLabelsElement, IIssueLabel]
      'DUPLICATE_ALIAS': SpecLabelsElement[]
    }>
  } = {}
  for (const [alias, assocSpecLabels] of Object.entries(aliasMap)) {
    collisionMap[alias] = {}

    if (assocSpecLabels.length > 1) {
      collisionMap[alias]['DUPLICATE_ALIAS'] = assocSpecLabels
    }

    if (Object.keys(spec.labels).includes(alias)) {
      console.log('here')
      collisionMap[alias]['ACTIVE_SPEC_NAME'] = spec.labels[alias]
    }

    const issueLabelAlias = issue.getLabel(alias)
    if (issueLabelAlias !== undefined) {
      const aliasAssocLabel = assocSpecLabels[0]
      const aliasAssocLabelName = aliasAssocLabel.label.label.name
      if (Object.keys(issue.labels).includes(aliasAssocLabelName)) {
        collisionMap[alias]['ACTIVE_ISSUE_NAME'] = [aliasAssocLabel, issueLabelAlias]
      }
    }
  }

  const collisionMsg: string[] = []

  for (const [alias, collision] of Object.entries(collisionMap)) {
    const collisionAliasMsg: string[] = []

    if (collision['ACTIVE_SPEC_NAME'] && collision['ACTIVE_SPEC_NAME'].length > 0) {
      collisionAliasMsg.push('The alias is being used as the name of a label in:',
      ...collision['ACTIVE_SPEC_NAME'].map(specElement => {
        return `- ${specElement.file.fileInfo.path}`
      }), '')
    }

    if (collision['DUPLICATE_ALIAS'] && collision['DUPLICATE_ALIAS'].length > 0) {
      collisionAliasMsg.push('The alias is being used in multiple locations"',
      ...collision['DUPLICATE_ALIAS'].map(specElement => {
        return `- ${specElement.file.fileInfo.path}`
      }), '')
    }

    if (collision['ACTIVE_ISSUE_NAME']) {
      const aliasAssocLabel = collision['ACTIVE_ISSUE_NAME'][0]
      collisionAliasMsg.push(
        `The alias and it's associated label name (\`${aliasAssocLabel.label.label.name}\` from \`${aliasAssocLabel.file.fileInfo.path}\`) are both active issue labels.`,
        `Associated active label name: ${collision['ACTIVE_ISSUE_NAME'][1].name}`,
        ''
      )
    }

    if (collisionAliasMsg.length) {
      collisionMsg.push(`#### Alias \`${alias}\``, ...collisionAliasMsg)
    }
  }

  if (collisionMsg.length) {
    throw new LabelsError(job.context, {
      title: 'Error: Alias Collision',
      summary: collisionMsg
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
