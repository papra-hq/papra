import * as v from 'valibot';
import { createCustomPropertyRelatedDocumentNotFoundError } from '../../custom-properties.errors';
import { defineCustomPropertyType } from '../custom-property-definition.models';

export const documentRelationCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'document_relation',

  value: {

    inputSchema: v.array(v.string()),

    extendInputValidation: async ({ value: documentIds, customProperty, documentsRepository }) => {
      const allDocumentsAreFromOrganization = await documentsRepository.areAllDocumentsInOrganization({
        documentIds,
        organizationId: customProperty.organizationId,
      });

      if (!allDocumentsAreFromOrganization) {
        throw createCustomPropertyRelatedDocumentNotFoundError();
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
