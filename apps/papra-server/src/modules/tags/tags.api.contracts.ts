import * as v from 'valibot';
import { defineApiContract } from '../api/api.contracts';
import { isoDateStringSchema } from '../api/api.schemas';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { tagColorSchema, tagDescriptionSchema, tagIdSchema, tagNameSchema } from './tags.schemas';
import { errorResponseDefinition } from '../api/api.contracts.errors';
import { tagNotFoundErrorDefinition } from './tags.errors';

export const createOrganizationTagContract = defineApiContract({
  operationId: 'createOrganizationTag',
  path: '/api/organizations/:organizationId/tags',
  method: 'POST',
  request: {
    params: v.strictObject({
      organizationId: organizationIdSchema,
    }),
    body: {
      'application/json': v.strictObject({
        name: tagNameSchema,
        color: tagColorSchema,
        description: v.optional(tagDescriptionSchema),
      }),
    },
  },
  responses: {
    200: {
      description: 'Returns the created organization tag.',
      content: {
        'application/json': {
          schema: v.object({
            tag: v.object({
              id: v.string(),
              createdAt: isoDateStringSchema,
              updatedAt: isoDateStringSchema,
              organizationId: v.string(),
              name: v.string(),
              normalizedName: v.nullable(v.string()),
              color: v.string(),
              description: v.nullable(v.string()),
            }),
          }),
        },
      },
    },
  },
});

export const updateOrganizationTagContract = defineApiContract({
  operationId: 'updateOrganizationTag',
  path: '/api/organizations/:organizationId/tags/:tagId',
  method: 'PUT',
  request: {
    params: v.strictObject({
      organizationId: organizationIdSchema,
      tagId: tagIdSchema,
    }),
    body: {
      'application/json': v.strictObject({
        name: v.optional(tagNameSchema),
        color: v.optional(tagColorSchema),
        description: v.optional(tagDescriptionSchema),
      }),
    },
  },
  responses: {
    200: {
      description: 'Returns the updated organization tag.',
      content: {
        'application/json': {
          schema: v.object({
            tag: v.object({
              id: v.string(),
              createdAt: isoDateStringSchema,
              updatedAt: isoDateStringSchema,
              organizationId: v.string(),
              name: v.string(),
              normalizedName: v.nullable(v.string()),
              color: v.string(),
              description: v.nullable(v.string()),
            }),
          }),
        },
      },
    },
    ...errorResponseDefinition(tagNotFoundErrorDefinition),
  },
});

export const deleteOrganizationTagContract = defineApiContract({
  operationId: 'deleteOrganizationTag',
  path: '/api/organizations/:organizationId/tags/:tagId',
  method: 'DELETE',
  request: {
    params: v.strictObject({
      organizationId: organizationIdSchema,
      tagId: tagIdSchema,
    }),
  },
  responses: {
    204: {
      description: 'Deletes the organization tag.',
      content: {},
    },
    ...errorResponseDefinition(tagNotFoundErrorDefinition),
  },
});

export const getOrganizationTagsContract = defineApiContract({
  operationId: 'getOrganizationTags',
  path: '/api/organizations/:organizationId/tags',
  method: 'GET',
  request: {
    params: v.strictObject({
      organizationId: organizationIdSchema,
    }),
  },
  responses: {
    200: {
      description: 'Returns organization tags with their non-deleted document counts.',
      content: {
        'application/json': {
          schema: v.object({
            tags: v.array(
              v.object({
                id: v.string(),
                createdAt: isoDateStringSchema,
                updatedAt: isoDateStringSchema,
                organizationId: v.string(),
                name: v.string(),
                normalizedName: v.nullable(v.string()),
                color: v.string(),
                description: v.nullable(v.string()),
                documentsCount: v.number(),
              }),
            ),
          }),
        },
      },
    },
  },
});
