import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';

import { PapraV1 } from './v1/PapraV1.node';

export class Papra extends VersionedNodeType {
  constructor() {
    const baseDescription: INodeTypeBaseDescription = {
      displayName: 'Papra',
      name: 'papra',
      icon: 'file:papra.svg',
      group: ['input'],
      description: 'Read, update, write and delete data from Papra',
      defaultVersion: 1,
      usableAsTool: true,
    };

    const nodeVersions: IVersionedNodeType['nodeVersions'] = {
      1: new PapraV1(baseDescription),
    };

    super(nodeVersions, baseDescription);
  }
}
