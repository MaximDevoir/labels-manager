import { Variables, Headers } from 'probot/lib/github';
import { Context } from 'probot';
declare abstract class Query {
    protected context: Context;
    protected query: string;
    protected variables?: Variables | undefined;
    protected headers?: Headers | undefined;
    protected errors: null | [];
    constructor(context: Context, query: string, variables?: Variables | undefined, headers?: Headers | undefined);
    fire(): Promise<number>;
}
export default Query;
