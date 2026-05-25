import type { CustomPropertySelectOption, CustomPropertyType } from '../../custom-properties/custom-properties.types';

export type DemoCustomPropertyDefinitionFixture = {
  name: string;
  key: string;
  description?: string;
  type: CustomPropertyType;
  options?: CustomPropertySelectOption[];
};

export const customPropertyDefinitionsFixtures: DemoCustomPropertyDefinitionFixture[] = [
  {
    name: 'Status',
    key: 'status',
    description: 'Current processing status of the document',
    type: 'select',
    options: [
      { id: 'opt_status_pending', key: 'pending', name: 'Pending', displayOrder: 0 },
      { id: 'opt_status_reviewed', key: 'reviewed', name: 'Reviewed', displayOrder: 1 },
      { id: 'opt_status_archived', key: 'archived', name: 'Archived', displayOrder: 2 },
    ],
  },
  {
    name: 'Priority',
    key: 'priority',
    description: 'Investigation priority level',
    type: 'select',
    options: [
      { id: 'opt_priority_low', key: 'low', name: 'Low', displayOrder: 0 },
      { id: 'opt_priority_medium', key: 'medium', name: 'Medium', displayOrder: 1 },
      { id: 'opt_priority_high', key: 'high', name: 'High', displayOrder: 2 },
      { id: 'opt_priority_critical', key: 'critical', name: 'Critical', displayOrder: 3 },
    ],
  },
  {
    name: 'Amount',
    key: 'amount',
    description: 'Monetary amount in GBP',
    type: 'number',
  },
  {
    name: 'Confidential',
    key: 'confidential',
    description: 'Whether this document is confidential',
    type: 'boolean',
  },
  {
    name: 'Reference',
    key: 'reference',
    description: 'External reference number or identifier',
    type: 'text',
  },
] as const satisfies DemoCustomPropertyDefinitionFixture[];
