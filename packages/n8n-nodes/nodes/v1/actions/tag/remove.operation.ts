import type {
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
];

export async function execute(
  this: IExecuteFunctions,
  itemIndex: number,
): Promise<INodeExecutionData> {
  const id = (this.getNodeParameter('id', itemIndex) as INodeParameterResourceLocator).value;
  const endpoint = `/tags/${id}`;
  await apiRequest.call(this, itemIndex, 'DELETE', endpoint);

  return { json: { results: [true] } };
}
