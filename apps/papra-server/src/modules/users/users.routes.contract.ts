import * as v from 'valibot';
import { defineEndpointContract } from '../api/contracts.models';

const userSchema = v.object({
  id: v.string(),
  email: v.string(),
  name: v.string(),
  createdAt: v.date(),
  updatedAt: v.date(),
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
