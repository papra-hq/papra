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
        const endpoint = `/documents/search`;
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
    const response = (await apiRequest.call(this, 0, 'GET', endpoint, {}, { pageSize: 30, pageIndex: 0 })) as { documents: { id: number; name: string }[] };

    return {
        results: response.documents.map((item) => ({
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
    const response = (await apiRequest.call(this, 0, 'GET', endpoint)) as { tags: { id: number; name: string }[] };

    return {
        results: response.tags
            .filter((item) => !filter || item.name.includes(filter))
            .map((item) => ({
                name: item.name.trim().length > 80 ? `${item.name.trim().slice(0, 80)}...` : item.name.trim(),
                value: item.id,
            })),
    };
}