import * as v from 'valibot';

export const apiUrlSchema = v.pipe(v.string(), v.url());
export const apiKeySchema = v.string();
export const defaultOrganizationIdSchema = v.string();

export const cliConfigSchema = v.object({
  apiUrl: v.optional(apiUrlSchema),
  apiKey: v.optional(apiKeySchema),
  defaultOrganizationId: v.optional(defaultOrganizationIdSchema),
});

export type CliConfig = v.InferOutput<typeof cliConfigSchema>;
