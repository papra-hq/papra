import * as v from 'valibot';
import { defineApiContract } from '../api/api.contracts';
import { isoDateStringSchema } from '../api/api.schemas';
import { errorResponseDefinition } from '../api/api.contracts.errors';
import { organizationIdSchema, organizationNameSchema } from './organization.schemas';

const organizationSchema = v.object({
  id: v.string(),
  name: v.string(),
  createdAt: isoDateStringSchema,
  updatedAt: isoDateStringSchema,
  customerId: v.nullable(v.string()),
  deletedAt: v.nullable(isoDateStringSchema),
  deletedBy: v.nullable(v.string()),
  scheduledPurgeAt: v.nullable(isoDateStringSchema),
});

const organizationParamsSchema = v.strictObject({
  organizationId: organizationIdSchema,
});

const organizationBodySchema = v.strictObject({
  name: organizationNameSchema,
});

const organizationMembershipErrorResponse = errorResponseDefinition({
  statusCode: 403,
  code: 'user.not_in_organization',
  message: 'You are not part of this organization.',
});

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
            organizations: v.array(organizationSchema),
          }),
        },
      },
    },
  },
});

export const getDeletedOrganizationsContract = defineApiContract({
  operationId: 'getDeletedOrganizations',
  path: '/api/organizations/deleted',
  method: 'GET',
  responses: {
    200: {
      description: "Returns the current authenticated user's restorable deleted organizations.",
      content: {
        'application/json': {
          schema: v.object({
            organizations: v.array(organizationSchema),
          }),
        },
      },
    },
  },
});

export const createOrganizationContract = defineApiContract({
  operationId: 'createOrganization',
  path: '/api/organizations',
  method: 'POST',
  request: {
    body: {
      'application/json': organizationBodySchema,
    },
  },
  responses: {
    200: {
      description: 'Returns the created organization.',
      content: {
        'application/json': {
          schema: v.object({
            organization: organizationSchema,
          }),
        },
      },
    },
    ...errorResponseDefinition({
      statusCode: 403,
      code: 'user.max_organization_count_reached',
      message: 'You have reached the maximum number of organizations.',
    }),
    ...errorResponseDefinition({
      statusCode: 404,
      code: 'users.not_found',
      message: 'User not found',
    }),
  },
});

export const getOrganizationContract = defineApiContract({
  operationId: 'getOrganization',
  path: '/api/organizations/:organizationId',
  method: 'GET',
  request: {
    params: organizationParamsSchema,
  },
  responses: {
    200: {
      description: 'Returns the organization. It may be absent after a concurrent deletion.',
      content: {
        'application/json': {
          schema: v.object({
            organization: v.optional(organizationSchema),
          }),
        },
      },
    },
    ...organizationMembershipErrorResponse,
  },
});

export const updateOrganizationContract = defineApiContract({
  operationId: 'updateOrganization',
  path: '/api/organizations/:organizationId',
  method: 'PUT',
  request: {
    params: organizationParamsSchema,
    body: {
      'application/json': organizationBodySchema,
    },
  },
  responses: {
    200: {
      description:
        'Returns the updated organization. It may be absent after a concurrent deletion.',
      content: {
        'application/json': {
          schema: v.object({
            organization: v.optional(organizationSchema),
          }),
        },
      },
    },
    ...organizationMembershipErrorResponse,
  },
});

export const softDeleteOrganizationContract = defineApiContract({
  operationId: 'softDeleteOrganization',
  path: '/api/organizations/:organizationId',
  method: 'DELETE',
  request: {
    params: organizationParamsSchema,
  },
  responses: {
    204: {
      description: 'Soft-deletes the organization and schedules its purge.',
      content: {},
    },
    403: {
      description: 'The user is not an organization owner or a subscription blocks deletion.',
      content: {
        'application/json': {
          schema: v.object({
            error: v.object({
              code: v.picklist([
                'user.not_in_organization',
                'user.not_organization_owner',
                'organization.has_active_subscription',
              ]),
              message: v.string(),
            }),
          }),
        },
      },
    },
    ...errorResponseDefinition({
      statusCode: 404,
      code: 'organization.not_found',
      message: 'Organization not found.',
    }),
  },
});
