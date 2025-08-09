import type { INodeProperties } from 'n8n-workflow';

import * as create from './create.operation';
import * as remove from './remove.operation';

export { create, remove };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    default: 'list',
    displayOptions: {
      show: { resource: ['document_tag'] },
    },
    noDataExpression: true,
    options: [
      {
        name: 'Add a tag to a document',
        value: 'create',
        action: 'Add a tag to a document',
      },
      {
        name: 'Remove a tag from a document',
        value: 'remove',
        action: 'Remove a tag from a document',
      },
    ],
    type: 'options',
  },
  ...create.description,
  ...remove.description,
];
