import * as v from 'valibot';
import { createCustomPropertyUserNotFoundError } from '../../custom-properties.errors';
import { defineCustomPropertyType } from '../custom-property-definition.models';

export const userRelationCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'user_relation',

  value: {
    inputSchema: v.array(v.string()),

    extendInputValidation: async ({ value: userIds, customProperty, organizationsRepository }) => {
      const { members } = await organizationsRepository.getOrganizationMembers({ organizationId: customProperty.organizationId });
      const memberUserIds = new Set(members.map(m => m.userId));

      for (const userId of userIds) {
        if (!memberUserIds.has(userId)) {
          throw createCustomPropertyUserNotFoundError();
        }
      }
    },

    toDb: ({ value }) => value.map(userId => ({ userId })),

    fromDb: ({ rows }) => rows
      .filter(r => r.relatedUser !== null)
      .map(r => ({
        userId: r.relatedUser!.id,
        name: r.relatedUser!.name,
        email: r.relatedUser!.email,
      })),
  },
});
