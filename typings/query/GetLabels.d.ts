import Query from './Query';
import { Context } from 'probot';
declare class GetLabels extends Query {
    /**
     * Creates an instance of GetLabels.
     * @param {Context} context
     * @param {string} owner
     * @param {string} repo
     * @param {number} limit GitHub API limits us to a maximum of 100 nodes
     * @param {string} [after=""]
     * @memberof GetLabels
     */
    constructor(context: Context, owner: string, repo: string, limit: number, after: string);
}
export default GetLabels;
