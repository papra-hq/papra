import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeBaseDescription,
  INodeTypeDescription,
} from 'n8n-workflow';

import { router } from './actions/router';
import * as version from './actions/version';
import { listSearch } from './methods';

export class PapraV1 implements INodeType {
  description: INodeTypeDescription;

  constructor(baseDescription: INodeTypeBaseDescription) {
    this.description = {
      ...baseDescription,
      ...version.description,
      usableAsTool: true,
    };
  }

  methods = {
    listSearch,
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return await router.call(this);
  }
}
