import type { GenericSchema } from 'valibot';
import type { ApiRequestBodySchemas } from './requests/requests.types';
import type {
  ApiResponseBodylessStatus,
  ApiResponseContentType,
} from './responses/responses.types';

type ApiResponseDefinition = {
  description: string;
  content: Partial<Record<ApiResponseContentType, { schema: GenericSchema }>>;
};

type ApiBodylessResponseDefinition = {
  description: string;
  content: Record<string, never>;
};

export type ApiContract = {
  path: string;
  request?: {
    query?: GenericSchema;
    body?: ApiRequestBodySchemas;
    params?: GenericSchema;
  };
} & (
  | {
      method: 'HEAD';
      responses: Record<number, ApiBodylessResponseDefinition>;
    }
  | {
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      responses: Record<number, ApiResponseDefinition> &
        Partial<Record<ApiResponseBodylessStatus, ApiBodylessResponseDefinition>>;
    }
);

export function defineApiContract<const Contract extends ApiContract>(
  contract: Contract,
): Contract {
  return contract;
}
