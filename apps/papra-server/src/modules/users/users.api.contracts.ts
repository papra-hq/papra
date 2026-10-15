import { defineApiContract } from '../api/api.contracts';
import * as v from 'valibot';
import { isoDateStringSchema } from '../api/api.schemas';

export const getCurrentUserContract = defineApiContract({
  path: '/api/users/me',
  method: 'GET',
  responses: {
    200: {
      description: "Returns the current authenticated user's information.",
      content: {
        'application/json': {
          schema: v.object({
            user: v.object({
              id: v.string(),
              email: v.string(),
              name: v.string(),
              createdAt: isoDateStringSchema,
              updatedAt: isoDateStringSchema,
              twoFactorEnabled: v.boolean(),
              permissions: v.array(v.string()),
            }),
          }),
        },
      },
    },
  },
});

export const updateCurrentUserContract = defineApiContract({
  path: '/api/users/me',
  method: 'PUT',
  request: {
    body: {
      'application/json': v.strictObject({
        name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(50)),
      }),
    },
  },
  responses: {
    200: {
      description: "Updates the current authenticated user's information.",
      content: {
        'application/json': {
          schema: v.object({
            user: v.object({
              id: v.string(),
              email: v.string(),
              name: v.string(),
              createdAt: isoDateStringSchema,
              updatedAt: isoDateStringSchema,
              twoFactorEnabled: v.boolean(),
            }),
          }),
        },
      },
    },
  },
});
