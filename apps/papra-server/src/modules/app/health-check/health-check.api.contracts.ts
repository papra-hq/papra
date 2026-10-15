import * as v from 'valibot';
import { defineApiContract } from '../../api/api.contracts';

export const pingContract = defineApiContract({
  operationId: 'ping',
  path: '/api/ping',
  method: 'GET',
  responses: {
    200: {
      description: 'Returns an ok status when the server is reachable.',
      content: {
        'application/json': {
          schema: v.object({ status: v.literal('ok') }),
        },
      },
    },
  },
});

const healthCheckResponseSchema = v.object({
  isDatabaseHealthy: v.boolean(),
  isEverythingOk: v.boolean(),
  status: v.picklist(['ok', 'error']),
});

export const healthCheckContract = defineApiContract({
  operationId: 'checkHealth',
  path: '/api/health',
  method: 'GET',
  responses: {
    200: {
      description: 'Returns health information when the server is healthy.',
      content: {
        'application/json': {
          schema: healthCheckResponseSchema,
        },
      },
    },
    500: {
      description: 'Returns health information when the server is unhealthy.',
      content: {
        'application/json': {
          schema: healthCheckResponseSchema,
        },
      },
    },
  },
});
