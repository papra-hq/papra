import z from 'zod';
import { createCustomPropertyRelatedDocumentNotFoundError } from '../../custom-properties.errors';
import { defineCustomPropertyType } from '../custom-property-definition.models';

export const documentRelationCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'document_relation',

  value: {

    inputSchema: z.array(z.string()),

    extendInputValidation: async ({ value: documentIds, customProperty, documentsRepository }) => {
      const { documents } = await documentsRepository.getDocumentsByIds({ documentIds, organizationId: customProperty.organizationId });
      const foundIds = new Set(documents.map(d => d.id));

      for (const documentId of documentIds) {
        if (!foundIds.has(documentId)) {
          throw createCustomPropertyRelatedDocumentNotFoundError();
        }
      }
    },

    toDb: ({ value }) => value.map(relatedDocumentId => ({ relatedDocumentId })),

    fromDb: ({ rows }) => rows
      .filter(r => r.relatedDocument !== null)
      .map(r => ({
        documentId: r.relatedDocument!.id,
        name: r.relatedDocument!.name,
      })),
  },
});
