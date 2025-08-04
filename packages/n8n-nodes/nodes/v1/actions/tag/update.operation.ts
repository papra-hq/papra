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
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['update'],
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
                            regex: '^[a-zA-Z0-9_]+$',
                            errorMessage: 'The ID must be valid',
                        },
                    },
                ],
            },
        ],
		placeholder: 'ID of the tag',
		required: true,
		type: 'resourceLocator',
	},
	{
		displayName: 'Update fields',
		name: 'update_fields',
		default: {},
		displayOptions: {
			show: {
				resource: ['tag'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				placeholder: 'Name of the tag',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Color',
				name: 'color',
				default: '#000000',
				type: 'color',
			},
			{
				displayName: 'Description',
				name: 'description',
				default: '',
				placeholder: 'Description of the tag',
				type: 'string',
			},
		],
		placeholder: 'Add Field',
		type: 'collection',
	},
];

export async function execute(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const id = (this.getNodeParameter('id', itemIndex) as INodeParameterResourceLocator).value;
	const endpoint = `/tags/${id}`;

	const updateFields = this.getNodeParameter('update_fields', itemIndex, {}) as {
		[key: string]: any;
	};

	const body: { [key: string]: any } = {};

	for (const key of Object.keys(updateFields)) {
		if (updateFields[key] !== null && updateFields[key] !== undefined) {
			body[key] = key === 'color' ? updateFields[key].toString().toLowerCase() : updateFields[key];
		}
	}

	const response = (await apiRequest.call(this, itemIndex, 'PUT', endpoint, body)) as any;

	return { json: { results: [response] } };
}