import {
    ILoadOptionsFunctions,
    INodeListSearchResult,
} from 'n8n-workflow';
import { apiRequest, apiRequestPaginated } from '../transport';

export async function documentSearch(
    this: ILoadOptionsFunctions,
    filter?: string,
): Promise<INodeListSearchResult> {
    if (filter && filter.trim().length >= 3) {
        const endpoint = `/documents/search/`;
        const query = { searchQuery: filter };

        const responses = (await apiRequestPaginated.call(
            this,
            0,
            'GET',
            endpoint,
            undefined,
            query,
        )) as {
            body: {
                documents: { id: number; name: string }[];
            };
        }[];

        const [result] = responses;
        return {
            results: result
                ? result.body.documents.map((item) => ({
                    name: item.name,
                    value: item.id,
                }))
                : [],
        };
    }

    const endpoint = `/documents`;
    const responses = (await apiRequestPaginated.call(this, 0, 'GET', endpoint)) as {
        body: { results: { id: number; name: string }[] };
    }[];

    // NOTE: We limit the results to 30 to avoid performance issues
    const results = responses
        .reduce<
            { id: number; name: string }[]
        >((acc, response) => acc.concat(response.body.results), [])
        .slice(0, 30);

    return {
        results: results.map((item) => ({
            name: item.name,
            value: item.id,
        })),
    };
}

export async function tagSearch(
    this: ILoadOptionsFunctions,
    filter?: string,
): Promise<INodeListSearchResult> {
    const endpoint = `/tags`;
    const response = (await apiRequest.call(this, 0, 'GET', endpoint)) as {
        body: { tags: { id: number; name: string }[] };
    };

    // NOTE: We limit the results to 30 to avoid performance issues
    return {
        results: response.body.tags
            .filter((item) => !filter || item.name.includes(filter))
            .slice(0, 30)
            .map((item) => ({
                name: item.name.trim().length > 80 ? `${item.name.trim().slice(0, 80)}...` : item.name.trim(),
                value: item.id,
            })),
    };
}