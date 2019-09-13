import IssueLabels from "./IssueLabels";

export interface IIssueLabel {
  id: number;
  node_id: string;
  name: string,
  color: string,
  description: string
  default: boolean;
  url: string;
}

class IssueLabel {
  constructor (public label: IIssueLabel) {

  }
}

export default IssueLabel
