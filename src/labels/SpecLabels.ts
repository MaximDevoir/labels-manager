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
  for (const [labelID, specLabels] of Object.entries(job.specLabels.labels)) {
    if (specLabels.length <= 1) {
      continue
    }

    errorMsg.push(...[
      `Duplicate entries for the label \`${labelID}\` discovered in:`,
      ...specLabels.map(specElement => `- \`${specElement.file.fileInfo.path}\` as \`${specElement.label.label.name}\``),
      ''
    ])
  }

  if (errorMsg.length) {
    throw new LabelsError({
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
 *  - TODO: (unnamed) More than one of an associated labels aliases match to an
 *    active issue label name. Example: Specified label 'bug' has two aliases
 *    ['bug :bug:', 'app-error']. More than one of the aliases match to an
 *    active issue label name. This is a collision because we cannot rename both
 *    labels to the same name.
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

  spec.iterateLabels((labelID, spec) => {
    const { aliases } = spec.label.label
    aliases.forEach(alias => {
      const aliasID = IssueLabels.convertNameToIdentityToken(alias)
      if (!(aliasID in aliasMap)) {
        aliasMap[aliasID] = [spec]
      } else {
        aliasMap[aliasID].push(spec)
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
  for (const [aliasID, assocSpecLabels] of Object.entries(aliasMap)) {
    collisionMap[aliasID] = {}

    if (assocSpecLabels.length > 1) {
      collisionMap[aliasID]['DUPLICATE_ALIAS'] = assocSpecLabels
    }

    if (Object.keys(spec.labels).includes(aliasID)) {
      collisionMap[aliasID]['ACTIVE_SPEC_NAME'] = spec.labels[aliasID]
    }

    const issueLabelAlias = issue.getLabel(aliasID)
    if (issueLabelAlias !== undefined) {
      const aliasAssocLabel = assocSpecLabels[0]
      const aliasAssocLabelName = aliasAssocLabel.label.label.name
      if (Object.keys(issue.labels).includes(aliasAssocLabelName)) {
        collisionMap[aliasID]['ACTIVE_ISSUE_NAME'] = [aliasAssocLabel, issueLabelAlias]
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
        ''
      )
    }

    if (collisionAliasMsg.length) {
      collisionMsg.push(`#### Alias \`${alias}\``, ...collisionAliasMsg)
    }
  }

  if (collisionMsg.length) {
    throw new LabelsError({
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
    const labelID = IssueLabels.convertNameToIdentityToken(name)

    if (!(labelID in this._labels)) {
      this._labels[labelID] = []
    }

    this._labels[labelID].push(label)
  }

  get labels() {
    return this._labels
  }

  /**
   * Iterate over each spec labels element.
   * @param iteratee
   */
  iterateLabels(iteratee: (labelID: string, spec: SpecLabelsElement) => void) {
    for (const [labelID, specLabels] of Object.entries(this.labels)) {
      specLabels.forEach(spec => {
        iteratee(labelID, spec)
      })
    }
  }
}

export default SpecLabels
