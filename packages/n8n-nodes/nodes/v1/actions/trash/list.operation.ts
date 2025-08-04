import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeProperties,
} from 'n8n-workflow';
import {
  NodeOperationError,
} from 'n8n-workflow';
import { apiRequestPaginated } from '../../transport';

export const description: INodeProperties[] = [];

export async function execute(
  this: IExecuteFunctions,
  itemIndex: number,
): Promise<INodeExecutionData> {
  const endpoint = `/documents/deleted`;
  const responses = (await apiRequestPaginated.call(this, itemIndex, 'GET', endpoint)) as any[];

  const statusCode = responses.reduce((acc, response) => acc + response.statusCode, 0) / responses.length;

  if (statusCode !== 200) {
    throw new NodeOperationError(
      this.getNode(),
      `The trash you are requesting could not be found`,
      {
        description: JSON.stringify(
          responses.map(response => response?.body?.details ?? response?.statusMessage),
        ),
      },
    );
  }

  return {
    json: { results: responses.flatMap(response => response.body.documents) },
  };
}
