import { INodeProperties } from 'n8n-workflow';

import * as get from './get.operation';

export { get };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		default: 'get',
		displayOptions: {
			show: { resource: ['statistics'] },
		},
		noDataExpression: true,
		options: [
			{
				name: 'Get statistics of the organization',
				value: 'get',
				action: 'Get statistics',
			},
		],
		type: 'options',
	},
	...get.description,
];