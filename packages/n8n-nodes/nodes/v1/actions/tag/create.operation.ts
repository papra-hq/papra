import { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import FormData from 'form-data';

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
        // TODO: add regex
		displayName: 'Color',
		name: 'color',
		default: '#000000',
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['create'],
			},
		},
		type: 'string',
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
	const formData = new FormData();

	formData.append('name', this.getNodeParameter('name', itemIndex));
	formData.append('color', this.getNodeParameter('color', itemIndex));
	formData.append('description', this.getNodeParameter('description', itemIndex, ''));

	const response = (await apiRequest.call(this, itemIndex, 'POST', endpoint, undefined, undefined, { headers: formData.getHeaders(), formData })) as any;

	return { json: { results: [response] } };
}