import type { GenericSchema } from 'valibot';
import type { ApiRequestBodySchemas } from './requests/requests.types';
import type {
  ApiResponseBodylessStatus,
  ApiResponseContentType,
} from './responses/responses.types';

export type ApiContract = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  responses: Record<
    number,
    {
      description: string;
      content: Partial<Record<ApiResponseContentType, { schema: GenericSchema }>>;
    }
  > &
    Partial<
      Record<ApiResponseBodylessStatus, { description: string; content: Record<string, never> }>
    >;
  request?: {
    query?: GenericSchema;
    body?: ApiRequestBodySchemas;
    params?: GenericSchema;
  };
};

export function defineApiContract<const Contract extends ApiContract>(
  contract: Contract,
): Contract {
  return contract;
}
