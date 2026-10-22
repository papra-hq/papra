import * as v from 'valibot';
import { defineApiContract } from '../../api/api.contracts';
import { errorResponseDefinition } from '../../api/api.contracts.errors';
import { organizationIdSchema } from '../../organizations/organization.schemas';

export const adminSoftDeleteOrganizationContract = defineApiContract({
  operationId: 'adminSoftDeleteOrganization',
  path: '/api/admin/organizations/:organizationId',
  method: 'DELETE',
  request: {
    params: v.strictObject({
      organizationId: organizationIdSchema,
    }),
  },
  responses: {
    204: {
      description:
        'Soft-deletes the organization and schedules its purge. Already-deleted organizations are left unchanged.',
      content: {},
    },
    ...errorResponseDefinition({
      statusCode: 401,
      code: 'auth.unauthorized',
      message: 'An authenticated session with the organizations:delete permission is required.',
    }),
    ...errorResponseDefinition({
      statusCode: 403,
      code: 'organization.has_active_subscription',
      message: 'A subscription blocks organization deletion.',
    }),
    ...errorResponseDefinition({
      statusCode: 404,
      code: 'organization.not_found',
      message: 'Organization not found.',
    }),
  },
});
