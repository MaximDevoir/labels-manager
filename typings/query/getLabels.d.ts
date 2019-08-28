import Query from './Query';
import { Variables } from 'probot/lib/github';
import { Context } from 'probot';
declare class GetLabels extends Query {
    constructor(context: Context, variables?: Variables);
}
export default GetLabels;
