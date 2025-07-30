import { INodeProperties } from 'n8n-workflow';

import * as list from './list.operation';

export { list };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		default: 'list',
		displayOptions: {
			show: { resource: ['trash'] },
		},
		noDataExpression: true,
		options: [
			{
				name: 'List Trash',
				value: 'list',
				action: 'List all trash',
			},
		],
		type: 'options',
	},
	...list.description,
];