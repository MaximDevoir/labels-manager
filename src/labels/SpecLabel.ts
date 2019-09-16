import SpecFile from "./SpecFile";

export interface ISpecLabel {
  name: string
  color: string
  aliases: string[]
  description: string
}

class SpecLabel {
  /**
   * Creates an instance of SpecLabel.
   *
   * @param {ISpecLabel} label The information relating to the label
   * @param {SpecFile} file The associated SpecFile for `label`
   * @memberof SpecLabel
   */
  constructor(public label: ISpecLabel) {

  }

  // TODO: Add methods for getting label name, description, and color.
}

export default SpecLabel
