import * as v from 'valibot';
import { defineEndpointContract } from '../api/contracts.models';
import { isoDateTimeSchema } from '../api/schemas/date.schemas';

const userSchema = v.object({
  id: v.string(),
  email: v.string(),
  name: v.nullable(v.string()),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
  twoFactorEnabled: v.boolean(),
});

export const getCurrentUserEndpointContract = defineEndpointContract({
  method: 'GET',
  path: '/api/users/me',
  responses: {
    200: v.object({
      user: v.object({
        ...userSchema.entries,
        permissions: v.array(v.string()),
      }),
    }),
  },
});

export const updateCurrentUserEndpointContract = defineEndpointContract({
  method: 'PUT',
  path: '/api/users/me',
  body: v.strictObject({
    name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(50)),
  }),
  responses: {
    200: v.object({
      user: userSchema,
    }),
  },
});
