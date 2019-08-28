import { Context } from 'probot';
import GetLabels from './query/GetLabels';
declare type Pagination = {
    startCursor: string;
    endCursor: string;
    hasNextPage: boolean | null;
    hasPreviousPage: boolean | null;
};
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
    private _totalCount;
    private _pageInfo;
    constructor(context: Context, owner: string, repo: string);
    /**
    * Appends onto `labels`
    */
    labels: LabelCollection;
    /**
     * Pagination information from the instance of the last `fired` query.
     *
     * @memberof Labels
     */
    pageInfo: Pagination;
    /**
     * Get the total count number of labels. This is set after the first query is
     * fired.
     *
     * @memberof Labels
     */
    totalCount: number | null;
    getLabels(after?: string, limit?: number): Promise<GetLabels>;
}
export {};
