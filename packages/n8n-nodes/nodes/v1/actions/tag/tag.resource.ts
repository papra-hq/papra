import { INodeProperties } from 'n8n-workflow';

import * as create from './create.operation';
import * as list from './list.operation';
import * as remove from './remove.operation';
import * as update from './update.operation';

export { create, list, remove, update };

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		default: 'list',
		displayOptions: {
			show: { resource: ['tag'] },
		},
		noDataExpression: true,
		options: [
			{
				name: 'Create a tag',
				value: 'create',
				action: 'Create a new tag',
			},
			{
				name: 'Delete a tag',
				value: 'remove',
				action: 'Delete a tag',
			},
			{
				name: 'List tags',
				value: 'list',
				action: 'List all tags',
			},
			{
				name: 'Update a tag',
				value: 'update',
				action: 'Update a tag',
			},
		],
		type: 'options',
	},
	...create.description,
	...list.description,
	...remove.description,
	...update.description,
];