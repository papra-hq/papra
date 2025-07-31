import { IExecuteFunctions, INodeExecutionData, INodeParameterResourceLocator, INodeProperties } from 'n8n-workflow';
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
    {
        displayName: 'Tag ID',
        name: 'tag_id',
        default: { mode: 'list', value: '' },
        displayOptions: {
            show: {
                resource: ['document_tag'],
                operation: ['remove'],
            },
        },
        modes: [
            {
                displayName: 'From List',
                name: 'list',
                placeholder: `Select a Tag...`,
                type: 'list',
                typeOptions: {
                    searchListMethod: 'tagSearch',
                    searchFilterRequired: false,
                    searchable: true,
                },
            },
            {
                displayName: 'By ID',
                name: 'id',
                placeholder: `Enter Tag ID...`,
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
        ],
        placeholder: 'ID of the tag',
        required: true,
        type: 'resourceLocator',
    },
];

export async function execute(
    this: IExecuteFunctions,
    itemIndex: number,
): Promise<INodeExecutionData> {
    const document_id = (this.getNodeParameter('id', itemIndex) as INodeParameterResourceLocator).value;
    const tag_id = (this.getNodeParameter('tag_id', itemIndex) as INodeParameterResourceLocator).value;
    const formData = new FormData();

    const endpoint = `/documents/${document_id}/tags`;

    formData.append('tag', tag_id);

    const response = (await apiRequest.call(this, itemIndex, 'POST', endpoint, undefined, undefined, { headers: formData.getHeaders(), formData })) as any;

    return { json: { results: [response] } };
}