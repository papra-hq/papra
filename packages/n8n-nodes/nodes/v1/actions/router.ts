import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { PapraType } from './node.type.ts';

import * as document from './document/document.resource';
import * as tag from './tag/tag.resource';
import * as trash from './trash/trash.resource';
import * as statistics from './statistics/statistics.resource';
import * as document_tag from './document_tag/document_tag.resource';

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const returnData: INodeExecutionData[] = [];

	for (let itemIndex = 0; itemIndex < this.getInputData().length; itemIndex++) {
		const resource = this.getNodeParameter<PapraType>('resource', itemIndex);
		const operation = this.getNodeParameter('operation', itemIndex);
		const papraNodeData = { resource, operation } as PapraType;

		try {
			switch (papraNodeData.resource) {
				case 'statistics':
					returnData.push(await statistics[papraNodeData.operation].execute.call(this, itemIndex));
					break;
				case 'document':
					returnData.push(
						await document[papraNodeData.operation].execute.call(this, itemIndex),
					);
					break;
				case 'document_tag':
					returnData.push(
						await document_tag[papraNodeData.operation].execute.call(this, itemIndex),
					);
					break;
				case 'tag':
					returnData.push(
						await tag[papraNodeData.operation].execute.call(this, itemIndex),
					);
					break;
				case 'trash':
					returnData.push(
						await trash[papraNodeData.operation].execute.call(this, itemIndex),
					);
					break;
			}
		} catch (error) {
			if (error.description?.includes('cannot accept the provided value')) {
				error.description += ". Consider using 'Typecast' option";
			}
			
			throw error;
		}
	}

	return [returnData];
}