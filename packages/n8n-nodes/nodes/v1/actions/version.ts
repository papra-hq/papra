import { INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

import * as document from './document/document.resource';
import * as tag from './tag/tag.resource';
import * as trash from './trash/trash.resource';
import * as statistics from './statistics/statistics.resource';
import * as document_tag from './document_tag/document_tag.resource';

export const description: INodeTypeDescription = {
	displayName: 'Papra',
	name: 'papra',
	icon: 'file:papra.svg',
	group: ['input'],
	version: 2,
	subtitle: '={{ $parameter.operation + ": " + $parameter.resource }}',
	description: 'Consume documents and metadata from Papra API',
	defaults: { name: 'Papra' },

	credentials: [{ name: 'papraApi', required: true }],

	inputs: [NodeConnectionType.Main],
	outputs: [NodeConnectionType.Main],

	properties: [
		{
			displayName: 'Resource',
			name: 'resource',
			default: 'document',
			noDataExpression: true,
			options: [
				{
					name: 'Statistics',
					value: 'statistics',
					description: 'Statistics about the documents',
				},
				{
					name: 'Document',
					value: 'document',
					description: 'Scanned document or file saved in Papra',
				},
				{
					name: 'Document tag',
					value: 'document_tag',
					description: 'Associate a tag to a document',
				},
				{
					name: 'Tag',
					value: 'tag',
					description: 'Label for documents',
				},
				{
					name: 'Trash',
					value: 'trash',
					description: 'Trash for documents',
				},
			],
			type: 'options',
		},
		...document.description,
		...tag.description,
		...trash.description,
		...statistics.description,
		...document_tag.description,
	],
};