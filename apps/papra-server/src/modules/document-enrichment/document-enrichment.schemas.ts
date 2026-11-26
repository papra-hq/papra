import * as v from 'valibot';

export const documentEnrichmentCapabilitySchema = v.picklist(['auto-tagging', 'filename']);

export type DocumentEnrichmentCapability = v.InferOutput<typeof documentEnrichmentCapabilitySchema>;

export const enrichDocumentBodySchema = v.strictObject({
  capabilities: v.pipe(v.array(documentEnrichmentCapabilitySchema), v.minLength(1)),
});
