import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeParameterResourceLocator,
	INodeProperties,
} from 'n8n-workflow';
import { apiRequest } from '../../transport';
import FormData from 'form-data';

export const description: INodeProperties[] = [
	{
		displayName: 'ID',
		name: 'id',
		default: { mode: 'list', value: '' },
		description: 'ID of the document',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['update'],
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
							regex: '^[a-zA-Z0-9]+$',
							errorMessage: 'The ID must be an alphanumeric string',
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
							regex: '^(?:http|https)://(?:.+?)/documents/([a-zA-Z0-9]+)/details$',
							errorMessage:
								'The URL must be a valid Papra document URL (e.g. https://papra.example.com/documents/123/details)',
						},
					},
				],
				extractValue: {
					type: 'regex',
					regex: '^(?:http|https)://(?:.+?)/documents/([a-zA-Z0-9]+)/details$',
				},
			},
		],
		placeholder: 'ID of the document',
		required: true,
		type: 'resourceLocator',
	},
	{
		displayName: 'Update Fields',
		name: 'update_fields',
		type: 'collection',
		default: {},
		hint: 'All additional fields are automatically added to the document by Papra if they are not set',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['update'],
			},
		},
		placeholder: 'Add Field',
		options: [
            {
				displayName: 'Name',
				name: 'name',
				default: '',
				description: 'The name of the document',
				type: 'string',
			},
			{
				displayName: 'Content',
				name: 'content',
				default: '',
				description: 'The content of the document, for search purposes',
				type: 'string',
			}
		],
	},
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const id = (this.getNodeParameter('id', itemIndex) as INodeParameterResourceLocator).value;
	const endpoint = `/documents/${id}/`;
    const formData = new FormData();

	const updateFields = this.getNodeParameter('update_fields', itemIndex, {}) as any;

	formData.append('name', updateFields.name);
	formData.append('content', updateFields.content);

	const response = (await apiRequest.call(
		this,
		itemIndex,
		'PATCH',
		endpoint,
		undefined,
		undefined,
		{ headers: formData.getHeaders(), formData },
	)) as any;

	return { json: { results: [response] } };
}