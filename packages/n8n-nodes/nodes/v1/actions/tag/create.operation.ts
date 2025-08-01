import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['create'],
			},
		},
		placeholder: 'Name of the tag',
		required: true,
		type: 'string',
		default: '',
	},
	{
		displayName: 'Color',
		name: 'color',
		default: '#000000',
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['create'],
			},
		},
		type: 'color',
	},
	{
		displayName: 'Description',
		name: 'description',
		default: '',
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['create'],
			},
		},
		placeholder: 'Description of the tag',
		type: 'string',
	},
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const endpoint = `/tags`;
	const body = {
		name: this.getNodeParameter('name', itemIndex),
		color: this.getNodeParameter('color', itemIndex)?.toString().toLowerCase(),
		description: this.getNodeParameter('description', itemIndex, ''),
	};

	const response = (await apiRequest.call(this, itemIndex, 'POST', endpoint, body)) as any;

	return { json: { results: [response] } };
}