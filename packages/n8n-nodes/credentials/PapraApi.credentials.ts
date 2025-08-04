import type { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

export class PapraApi implements ICredentialType {
  name = 'papraApi';
  displayName = 'Papra API';
  documentationUrl = 'https://docs.papra.app/resources/api-endpoints/#authentication';
  properties: INodeProperties[] = [
    {
      name: 'url',
      displayName: 'Papra API URL',
      default: 'https://api.papra.app',
      required: true,
      type: 'string',
      validateType: 'url',
    },
    {
      name: 'organization_id',
      displayName: 'Organization ID',
      default: '',
      required: true,
      type: 'string',
    },
    {
      name: 'apiKey',
      displayName: 'Papra API Key',
      default: '',
      required: true,
      type: 'string',
      typeOptions: { password: true },
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };
}
