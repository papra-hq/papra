import type { Document } from '../../documents/documents.types';
import type { InferOutput } from 'valibot';
import * as v from 'valibot';
import type { OrganizationSettings } from '../../organizations/organization-settings/organization-settings.types';
import type { GenericObjectSchema } from '../../shared/schemas/objects.schemas';
import type { Tag } from '../../tags/tags.types';
import type { DocumentEnrichmentCapability } from '../document-enrichment.schemas';

export type DocumentEnrichmentCapabilityDefinition<
  Name extends string = string,
  ResponseSchema extends GenericObjectSchema = GenericObjectSchema,
> = {
  name: Name;

  isAvailable: (args: { organizationSettings: OrganizationSettings; tags: Tag[] }) => boolean;

  buildSystemPromptFragments: (args: {
    organizationSettings: OrganizationSettings;
    tags: Tag[];
  }) => {
    fragment: string;
  };

  getResponseSchema: (args: {
    organizationSettings: OrganizationSettings;
    tags: Tag[];
  }) => ResponseSchema;

  apply: (args: {
    document: Pick<Document, 'name' | 'content' | 'originalName'>;
    documentId: string;
    organizationId: string;
    response: InferOutput<ResponseSchema>;
    organizationSettings: OrganizationSettings;
    tags: Tag[];
  }) => Promise<void>;

  documentInfoRequirements: ('tags' | 'custom-properties')[];
};

export function defineDocumentEnrichmentCapabilityFactory<
  FactoryArgs = unknown,
  Name extends DocumentEnrichmentCapability = DocumentEnrichmentCapability,
  ResponseSchema extends GenericObjectSchema = GenericObjectSchema,
>(factory: (args: FactoryArgs) => DocumentEnrichmentCapabilityDefinition<Name, ResponseSchema>) {
  return (args: FactoryArgs) => {
    const capability = factory(args);
    return {
      ...capability,
      apply: async (
        input: Omit<Parameters<typeof capability.apply>[0], 'response'> & { response: unknown },
      ) =>
        capability.apply({
          ...input,
          response: v.parse(capability.getResponseSchema(input), input.response),
        }),
    };
  };
}
