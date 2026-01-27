import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTaggingRulesRepository } from './tagging-rules.repository';

describe('tagging-rules repository', () => {
  describe('getOrganizationEnabledTaggingRules', () => {
    test('getting enabled tagging rules includes all related conditions and actions', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [
          { id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1', createdAt: new Date('2023-01-01'), updatedAt: new Date('2023-02-01') },
          { id: 'tag_2', name: 'Tag 2', normalizedName: 'tag 2', color: '#111111', organizationId: 'org_1', createdAt: new Date('2023-01-02'), updatedAt: new Date('2023-02-02') },
        ],
        taggingRules: [
          { id: 'tr_1', organizationId: 'org_1', name: 'Enabled Rule 1', enabled: true, createdAt: new Date('2023-03-01'), updatedAt: new Date('2023-04-01') },
        ],
        taggingRuleConditions: [
          { id: 'trc_1', taggingRuleId: 'tr_1', field: 'name', operator: 'equal', value: 'Doc 1', createdAt: new Date('2023-05-01'), updatedAt: new Date('2023-06-01') },
          { id: 'trc_2', taggingRuleId: 'tr_1', field: 'content', operator: 'contains', value: 'invoice', createdAt: new Date('2023-05-01'), updatedAt: new Date('2023-06-01') },
        ],
        taggingRuleActions: [
          { id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1', createdAt: new Date('2023-07-01'), updatedAt: new Date('2023-08-01') },
          { id: 'tra_2', taggingRuleId: 'tr_1', tagId: 'tag_2', createdAt: new Date('2023-07-01'), updatedAt: new Date('2023-08-01') },
        ],
      });

      const taggingRulesRepository = createTaggingRulesRepository({ db });

      const { taggingRules } = await taggingRulesRepository.getOrganizationEnabledTaggingRules({ organizationId: 'org_1' });

      expect(taggingRules).to.eql([
        {
          createdAt: new Date('2023-03-01T00:00:00.000Z'),
          description: null,
          enabled: true,
          id: 'tr_1',
          name: 'Enabled Rule 1',
          organizationId: 'org_1',
          conditionMatchMode: 'all',
          updatedAt: new Date('2023-04-01T00:00:00.000Z'),
          actions: [
            {
              createdAt: new Date('2023-07-01T00:00:00.000Z'),
              id: 'tra_1',
              tagId: 'tag_1',
              taggingRuleId: 'tr_1',
              updatedAt: new Date('2023-08-01T00:00:00.000Z'),
              tag: {
                id: 'tag_1',
                name: 'Tag 1',
                normalizedName: 'tag 1',
                color: '#000000',
                description: null,
                organizationId: 'org_1',
                createdAt: new Date('2023-01-01T00:00:00.000Z'),
                updatedAt: new Date('2023-02-01T00:00:00.000Z'),
              },
            },
            {
              createdAt: new Date('2023-07-01T00:00:00.000Z'),
              id: 'tra_2',
              tagId: 'tag_2',
              taggingRuleId: 'tr_1',
              updatedAt: new Date('2023-08-01T00:00:00.000Z'),
              tag: {
                id: 'tag_2',
                name: 'Tag 2',
                normalizedName: 'tag 2',
                color: '#111111',
                description: null,
                organizationId: 'org_1',
                createdAt: new Date('2023-01-02T00:00:00.000Z'),
                updatedAt: new Date('2023-02-02T00:00:00.000Z'),
              },
            },
          ],
          conditions: [
            {
              createdAt: new Date('2023-05-01T00:00:00.000Z'),
              field: 'name',
              id: 'trc_1',
              isCaseSensitive: false,
              operator: 'equal',
              taggingRuleId: 'tr_1',
              updatedAt: new Date('2023-06-01T00:00:00.000Z'),
              value: 'Doc 1',
            },
            {
              createdAt: new Date('2023-05-01T00:00:00.000Z'),
              field: 'content',
              id: 'trc_2',
              isCaseSensitive: false,
              operator: 'contains',
              taggingRuleId: 'tr_1',
              updatedAt: new Date('2023-06-01T00:00:00.000Z'),
              value: 'invoice',
            },
          ],

        },
      ]);
    });

    test('disabled tagging rules are excluded from the results', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' }],
        taggingRules: [
          { id: 'tr_1', organizationId: 'org_1', name: 'Enabled Rule', enabled: true },
          { id: 'tr_2', organizationId: 'org_1', name: 'Disabled Rule', enabled: false },
        ],
        taggingRuleConditions: [
          { id: 'trc_1', taggingRuleId: 'tr_1', field: 'name', operator: 'equal', value: 'Doc 1' },
          { id: 'trc_2', taggingRuleId: 'tr_2', field: 'name', operator: 'equal', value: 'Doc 2' },
        ],
        taggingRuleActions: [
          { id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' },
          { id: 'tra_2', taggingRuleId: 'tr_2', tagId: 'tag_1' },
        ],
      });

      const taggingRulesRepository = createTaggingRulesRepository({ db });

      const { taggingRules } = await taggingRulesRepository.getOrganizationEnabledTaggingRules({ organizationId: 'org_1' });

      expect(taggingRules).toHaveLength(1);
      expect(taggingRules[0]?.id).toBe('tr_1');
      expect(taggingRules[0]?.enabled).toBe(true);
    });

    test('tagging rules from other organizations are not included', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Org 1' },
          { id: 'org_2', name: 'Org 2' },
        ],
        tags: [
          { id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' },
          { id: 'tag_2', name: 'Tag 2', normalizedName: 'tag 2', color: '#111111', organizationId: 'org_2' },
        ],
        taggingRules: [
          { id: 'tr_1', organizationId: 'org_1', name: 'Rule Org 1', enabled: true },
          { id: 'tr_2', organizationId: 'org_2', name: 'Rule Org 2', enabled: true },
        ],
        taggingRuleActions: [
          { id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' },
          { id: 'tra_2', taggingRuleId: 'tr_2', tagId: 'tag_2' },
        ],
      });

      const taggingRulesRepository = createTaggingRulesRepository({ db });

      const { taggingRules } = await taggingRulesRepository.getOrganizationEnabledTaggingRules({ organizationId: 'org_1' });

      expect(taggingRules).toHaveLength(1);
      expect(taggingRules[0]?.id).toBe('tr_1');
      expect(taggingRules[0]?.organizationId).toBe('org_1');
    });

    test('organizations with only disabled rules get an empty result', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' }],
        taggingRules: [
          { id: 'tr_1', organizationId: 'org_1', name: 'Disabled Rule', enabled: false },
        ],
        taggingRuleActions: [
          { id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' },
        ],
      });

      const taggingRulesRepository = createTaggingRulesRepository({ db });

      const { taggingRules } = await taggingRulesRepository.getOrganizationEnabledTaggingRules({ organizationId: 'org_1' });

      expect(taggingRules).toEqual([]);
    });

    test('organizations without any tagging rules get an empty result', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
      });

      const taggingRulesRepository = createTaggingRulesRepository({ db });

      const { taggingRules } = await taggingRulesRepository.getOrganizationEnabledTaggingRules({ organizationId: 'org_1' });

      expect(taggingRules).toEqual([]);
    });

    test('tagging rules without conditions are properly retrieved with empty conditions array', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [{ id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' }],
        taggingRules: [
          { id: 'tr_1', organizationId: 'org_1', name: 'Rule Without Conditions', enabled: true },
        ],
        taggingRuleActions: [
          { id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' },
        ],
      });

      const taggingRulesRepository = createTaggingRulesRepository({ db });

      const { taggingRules } = await taggingRulesRepository.getOrganizationEnabledTaggingRules({ organizationId: 'org_1' });

      expect(taggingRules).toHaveLength(1);
      expect(taggingRules[0]?.conditions).toEqual([]);
      expect(taggingRules[0]?.actions).toHaveLength(1);
    });

    test('multiple enabled rules are retrieved with their respective conditions and actions', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org_1', name: 'Org 1' }],
        tags: [
          { id: 'tag_1', name: 'Tag 1', normalizedName: 'tag 1', color: '#000000', organizationId: 'org_1' },
          { id: 'tag_2', name: 'Tag 2', normalizedName: 'tag 2', color: '#111111', organizationId: 'org_1' },
        ],
        taggingRules: [
          { id: 'tr_1', organizationId: 'org_1', name: 'Rule 1', enabled: true },
          { id: 'tr_2', organizationId: 'org_1', name: 'Rule 2', enabled: true },
          { id: 'tr_3', organizationId: 'org_1', name: 'Rule 3 Disabled', enabled: false },
        ],
        taggingRuleConditions: [
          { id: 'trc_1', taggingRuleId: 'tr_1', field: 'name', operator: 'equal', value: 'Doc 1' },
          { id: 'trc_2', taggingRuleId: 'tr_2', field: 'name', operator: 'contains', value: 'Invoice' },
        ],
        taggingRuleActions: [
          { id: 'tra_1', taggingRuleId: 'tr_1', tagId: 'tag_1' },
          { id: 'tra_2', taggingRuleId: 'tr_2', tagId: 'tag_2' },
          { id: 'tra_3', taggingRuleId: 'tr_3', tagId: 'tag_1' },
        ],
      });

      const taggingRulesRepository = createTaggingRulesRepository({ db });

      const { taggingRules } = await taggingRulesRepository.getOrganizationEnabledTaggingRules({ organizationId: 'org_1' });

      expect(taggingRules).toHaveLength(2);

      const rule1 = taggingRules.find(r => r.id === 'tr_1');
      const rule2 = taggingRules.find(r => r.id === 'tr_2');

      expect(rule1).toBeDefined();
      expect(rule1?.conditions).toHaveLength(1);
      expect(rule1?.actions).toHaveLength(1);

      expect(rule2).toBeDefined();
      expect(rule2?.conditions).toHaveLength(1);
      expect(rule2?.actions).toHaveLength(1);
    });
  });
});
