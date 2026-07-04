import { expect, test } from 'vitest';
import type { Config } from '../../config/config.types';
import { createAiServices } from '../../ai/ai.services';
import { promptForAutoTagging } from '../auto-tagging.usecases';

const document = {
  name: 'acme-invoice-2026-06.pdf',
  content: [
    'INVOICE #2026-042',
    'From: Acme Corp, 123 Main St',
    'To: John Doe',
    'Web hosting services, June 2026',
    'Total due: $1,250.00 - payment within 30 days',
  ].join('\n'),
};

const existingTags = [
  { id: 'tag_1', name: 'invoice', description: 'Bills and invoices' },
  { id: 'tag_2', name: 'recipe', description: 'Cooking recipes' },
  { id: 'tag_3', name: 'contract', description: null },
  { id: 'tag_4', name: 'garden', description: 'Gardening and landscaping' },
];

export function runAutoTaggingTestSuite({
  modelId,
  config,
  timeout = 20_000,
}: {
  modelId: string;
  config: Config;
  timeout?: number;
}) {
  const aiServices = createAiServices({ config });

  test('auto-tagging should correctly identify tags for a document', { timeout }, async () => {
    const { tagIdsToAdd, tagsToCreate } = await promptForAutoTagging({
      existingTags,
      modelId,
      aiServices,
      canCreateNewTags: false,
      document,
      maxTags: 3,
    });

    expect(tagsToCreate).toEqual([]);
    expect(tagIdsToAdd.length).toBeLessThanOrEqual(3);
    expect(tagIdsToAdd).toContain('tag_1'); // the document is unambiguously an invoice
  });
}
