import Labels from "../Labels";
import { Label } from "../query/RepoLabels";
import { Context } from "probot";

interface IssueLabelsCollection {
  [key: string]: Label
}

class IssueLabels {
  public labels: IssueLabelsCollection = {}
  constructor (private context: Context) {

  }

  getIssueLabels() {
    // this.context.github.issues.label
  }
}

export default IssueLabels
