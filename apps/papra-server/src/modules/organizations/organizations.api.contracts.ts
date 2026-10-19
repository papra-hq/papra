import * as v from 'valibot';
import { defineApiContract } from '../api/api.contracts';
import { isoDateStringSchema } from '../api/api.schemas';

export const getOrganizationsContract = defineApiContract({
  operationId: 'getOrganizations',
  path: '/api/organizations',
  method: 'GET',
  responses: {
    200: {
      description: "Returns the current authenticated user's non-deleted organizations.",
      content: {
        'application/json': {
          schema: v.object({
            organizations: v.array(
              v.object({
                id: v.string(),
                name: v.string(),
                createdAt: isoDateStringSchema,
                updatedAt: isoDateStringSchema,
                customerId: v.nullable(v.string()),
                deletedAt: v.nullable(isoDateStringSchema),
                deletedBy: v.nullable(v.string()),
                scheduledPurgeAt: v.nullable(isoDateStringSchema),
              }),
            ),
          }),
        },
      },
    },
  },
});
