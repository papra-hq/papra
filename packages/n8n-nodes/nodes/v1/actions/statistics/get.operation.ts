import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const endpoint = `/documents/statistics`;
	const response = (await apiRequest.call(this, itemIndex, 'GET', endpoint)) as any[];

	return {
		json: { results: [response] },
	};
}