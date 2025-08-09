import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestMethods,
  ILoadOptionsFunctions,
  IRequestOptions,
  PaginationOptions,
} from 'n8n-workflow';

export async function apiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  itemIndex: number,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  query?: IDataObject,
  option: IRequestOptions = {},
): Promise<unknown> {
  const queryParams = query || {};

  const credentials = await this.getCredentials('papraApi');
  const options: IRequestOptions = {
    headers: {},
    method,
    body,
    qs: queryParams,
    uri: `${credentials.url}/api/organizations/${credentials.organization_id}${endpoint}`,
    json: true,
  };

  if (Object.keys(option).length) {
    Object.assign(options, option);
  }

  if (!Object.keys(body).length) {
    options.body = undefined;
  }

  return this.helpers.requestWithAuthentication.call(
    this,
    'papraApi',
    options,
    undefined,
    itemIndex,
  );
}

export async function apiRequestPaginated(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  itemIndex: number,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  query?: IDataObject,
  option: IRequestOptions = {},
): Promise<unknown[]> {
  query = query || {};

  const credentials = await this.getCredentials('papraApi');
  const options: IRequestOptions = {
    headers: {},
    method,
    body,
    qs: query,
    uri: `${credentials.url}/api/organizations/${credentials.organization_id}${endpoint}`,
    json: true,
  };

  if (Object.keys(option).length) {
    Object.assign(options, option);
  }

  if (!Object.keys(body).length) {
    delete options.body;
  }

  const paginationOptions: PaginationOptions = {
    // TODO: make continue condition generic
    continue: '={{ $response.body.documents && $response.body.documents.length > 0 }}',
    request: {
      qs: {
        pageSize: '={{ $request.qs.pageSize || 50 }}',
        pageIndex: '={{ $pageCount }}',
      },
    },
    requestInterval: 100,
  };

  return this.helpers.requestWithAuthenticationPaginated.call(
    this,
    options,
    itemIndex,
    paginationOptions,
    'papraApi',
  );
}
