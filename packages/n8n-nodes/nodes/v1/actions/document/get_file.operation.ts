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
		description: 'The ID of the document for which to retrieve a preview',
		displayOptions: {
			show: {
				resource: ['document'],
				operation: ['get_file'],
			},
		},
		hint: 'The ID of the document for which to retrieve a preview',
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
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const id = (this.getNodeParameter('id', itemIndex) as INodeParameterResourceLocator).value;
	const endpoint = `/documents/${id}`;
	const preview = (await apiRequest.call(
		this,
		itemIndex,
		'GET',
		`${endpoint}/file/`,
		undefined,
		undefined,
		{ resolveWithFullResponse: true },
	)) as any;
    
	const filename =
		preview.headers['content-disposition']
			?.match(/filename="(?:b['"])?([^"]+)(?:['"])?"/)?.[1]
			?.replace(/^['"]|['"]$/g, '') ?? `${id}.pdf`;

    const mimeType = preview.headers['content-type'];

	return {
		json: {},
		binary: {
			data: await this.helpers.prepareBinaryData(
				Buffer.from(preview.body),
				filename,
				mimeType,
			),
		},
	};
}