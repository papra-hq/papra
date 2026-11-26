import type { ApiContract } from './api.contracts';
import * as v from 'valibot';

export function errorResponseDefinition<
  const Code extends string,
  const StatusCode extends number,
>({ statusCode, code, message }: { statusCode: StatusCode; code: Code; message: string }) {
  const response = {
    description: message,
    content: {
      'application/json': {
        schema: v.object({
          error: v.object({
            code: v.literal(code),
            message: v.string(),
          }),
        }),
      },
    },
  } as const satisfies ApiContract['responses'][number];

  return {
    [statusCode]: response,
  } as { [Status in StatusCode]: typeof response };
}
