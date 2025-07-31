import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeParameterResourceLocator,
	INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'ID',
		name: 'id',
		default: { mode: 'list', value: '' },
		description: 'ID of the document',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['get'],
			},
		},
		hint: 'The ID of the document',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				placeholder: `Select a Document...`,
				type: 'list',
				typeOptions: {
					searchListMethod: 'documentSearch',
					searchFilterRequired: false,
					searchable: true,
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				placeholder: `Enter Document ID...`,
				type: 'string',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[a-zA-Z0-9_]+$',
							errorMessage: 'The ID must be valid',
						},
					},
				],
			},
			{
				displayName: 'By URL',
				name: 'url',
				placeholder: `Enter Document URL...`,
				type: 'string',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^(?:http|https)://(?:.+?)/documents/([a-zA-Z0-9_]+)/?(?:\\?.*)?$',
							errorMessage:
								'The URL must be a valid Papra document URL (e.g. https://papra.example.com/organizations/org_xxx/documents/doc_xxx?tab=info)',
						},
					},
				],
				extractValue: {
					type: 'regex',
					regex: '^(?:http|https)://(?:.+?)/documents/([a-zA-Z0-9_]+)/?(?:\\?.*)?$',
				},
			},
		],
		placeholder: 'ID of the document',
		required: true,
		type: 'resourceLocator',
	},
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const id = (this.getNodeParameter('id', itemIndex) as INodeParameterResourceLocator).value;

	console.log(id);

	const endpoint = `/documents/${id}`;
	const response = (await apiRequest.call(this, itemIndex, 'GET', endpoint)) as any;

	return { json: { results: [response] } };
}