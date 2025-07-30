import { INodeProperties } from 'n8n-workflow';

import * as create from './create.operation';
import * as list from './list.operation';
import * as update from './update.operation';
import * as get from './get.operation';
import * as get_file from './get_file.operation';
import * as get_activity from './get_activity.operation';
import * as remove from './remove.operation';

export {
	create,
    list,
    update,
	get,
	get_file,
	get_activity,
	remove,
};

export const description: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		default: 'list',
		displayOptions: {
			show: { resource: ['document'] },
		},
		noDataExpression: true,
		options: [
			{
				name: 'Create a Document',
				value: 'create',
				action: 'Create a new document',
			},
            {
				name: 'List Documents',
				value: 'list',
				action: 'List all documents',
			},
            {
				name: 'Update a Document',
				value: 'update',
				action: 'Update a document',
			},
			{
				name: 'Get a Document',
				value: 'get',
				action: 'Get a document',
			},
			{
				name: 'Get the Document File',
				value: 'get_file',
				action: 'Get the file of the document',
			},
			{
				name: 'Delete a Document',
				value: 'remove',
				action: 'Delete a document',
			},
			{
				name: 'Get the Document Activity Log',
				value: 'get_activity',
				action: 'Get the activity log of a document',
			},
			
		],
		type: 'options',
	},
	...create.description,
	...list.description,
	...update.description,
	...get.description,
	...get_file.description,
	...get_activity.description,
	...remove.description,
];