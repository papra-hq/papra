import type { ApiContract } from '../../api.contracts';
import type { ApiResponse } from '../responses.types';
import type { ApiResponseBodySerializer } from './responses.serializers';
import { apiResponseBodySerializers } from './responses.serializers';

export function serializeApiResponse({
  handlerResult,
  responseDefinitions,
  serializers = apiResponseBodySerializers,
}: {
  handlerResult: ApiResponse;
  responseDefinitions: ApiContract['responses'];
  serializers?: Record<string, ApiResponseBodySerializer>;
}): Response {
  const { status, contentType, body, headers } = handlerResult;

  const responseDefinition = responseDefinitions[status];

  if (!responseDefinition) {
    throw new Error('Undeclared response status');
  }

  if ([204, 205, 304].includes(status)) {
    if (body !== undefined || contentType !== undefined) {
      throw new Error('Bodyless responses cannot include a body or Content-Type');
    }

    return new Response(null, { status, headers });
  }

  if (!contentType) {
    throw new Error('Content-Type is required for non-empty responses');
  }

  if (!Object.hasOwn(responseDefinition.content, contentType)) {
    throw new Error('Undeclared response Content-Type');
  }

  const serializer = serializers[contentType];

  if (!serializer) {
    throw new Error(`No serializer found for Content-Type: ${contentType}`);
  }

  const serializedBody = serializer.serialize(body);

  return new Response(serializedBody, {
    status,
    headers: {
      'Content-Type': serializer.contentType,
      ...headers,
    },
  });
}
