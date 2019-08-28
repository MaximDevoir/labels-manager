import { Context } from 'probot';
declare type Label = {
    id: string;
    cursor: string;
    name: string;
    description: string;
    color: string;
    default?: boolean;
    url?: string;
};
interface LabelCollection {
    [key: string]: Label;
}
export default class Labels {
    private context;
    private owner;
    private repo;
    /**
     * The maximum number of labels to handle.
     *
     * @type {number}
     * @memberof Labels
     */
    private limit;
    private _labels;
    private endCursor;
    constructor(context: Context, owner: string, repo: string);
    /**
    * Appends onto `labels`
    */
    labels: LabelCollection;
    private getLabels;
}
export {};
