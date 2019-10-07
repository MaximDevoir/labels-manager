import Query from './Query'
import { Variables } from 'probot/lib/github';
import { Context } from 'probot';

//
const createStatusQuery = ``

// https://developer.github.com/v3/repos/statuses/#create-a-status
type StatusParameters = {
  state: 'error' | 'failure' | 'pending' | 'success';
  target_url: string;
  description: string;
  context: string;
}

class CreateStatus {
  constructor(
    appContext: Context,
    owner: string,
    repo: string,
    sha: string,
    {
      state,
      description,
      target_url = 'https://github.com/MaximDevoir/labels-manager',
      context = "labels-manager"
    }: StatusParameters
  ) {
    const variables = {
      state,
      description,
      target_url,
      context
    }
  }
}

export default CreateStatus
