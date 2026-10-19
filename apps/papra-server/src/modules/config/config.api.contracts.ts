import * as v from 'valibot';
import { defineApiContract } from '../api/api.contracts';

export const publicConfigSchema = v.object({
  version: v.string(),
  gitCommitSha: v.string(),
  gitCommitDate: v.string(),
  auth: v.object({
    isEmailVerificationRequired: v.boolean(),
    isPasswordResetEnabled: v.boolean(),
    isRegistrationEnabled: v.boolean(),
    showLegalLinksOnAuthPage: v.boolean(),
    providers: v.object({
      email: v.object({ isEnabled: v.boolean() }),
      github: v.object({ isEnabled: v.boolean() }),
      google: v.object({ isEnabled: v.boolean() }),
      customs: v.array(
        v.object({
          providerId: v.string(),
          providerName: v.string(),
          providerIconUrl: v.optional(v.string()),
        }),
      ),
    }),
  }),
  documents: v.object({
    deletedDocumentsRetentionDays: v.number(),
    isReprocessingEnabled: v.boolean(),
  }),
  intakeEmails: v.object({
    isEnabled: v.boolean(),
    address: v.object({
      canCustomizeUsername: v.boolean(),
      domains: v.array(v.string()),
    }),
  }),
  organizations: v.object({
    deletedOrganizationsPurgeDaysDelay: v.number(),
  }),
  autoTagging: v.object({
    isEnabled: v.boolean(),
  }),
});

export type PublicConfig = v.InferOutput<typeof publicConfigSchema>;

export const getPublicConfigContract = defineApiContract({
  operationId: 'getPublicConfig',
  path: '/api/config',
  method: 'GET',
  responses: {
    200: {
      description: 'Returns the public instance configuration.',
      content: {
        'application/json': {
          schema: v.object({ config: publicConfigSchema }),
        },
      },
    },
  },
});
