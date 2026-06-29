import type { Document } from '@/modules/documents/documents.types';
import type { Tag } from '@/modules/tags/tags.types';
import { describe, expect, test } from 'vitest';
import { searchDemoDocuments, someCorpusTokenStartsWith } from './demo.search.services';

describe('demo search services', () => {
  describe('searchDemoDocuments', () => {
    const tags = {
      cooking: { id: '1', name: 'cooking' },
      work: { id: '2', name: 'work' },
      personal: { id: '3', name: 'personal' },
    } as unknown as Record<string, Tag>;

    const documents = [
      {
        id: 'doc_1',
        name: 'Recipe for Pancakes',
        content: 'Mix flour, eggs, and milk to make pancakes.',
        tags: [tags.cooking],
        createdAt: new Date('2023-01-01'),
      },
      {
        id: 'doc_2',
        name: 'Work Meeting Notes',
        content: 'Discuss project timeline and deliverables.',
        tags: [tags.work],
        createdAt: new Date('2023-02-15'),
      },
      {
        id: 'doc_3',
        name: 'Personal Journal',
        content: 'Today I went for a walk in the park.',
        tags: [tags.personal],
        createdAt: new Date('2023-03-10'),
      },
      {
        id: 'doc_4',
        name: 'Grocery List',
        content: 'Eggs, milk, bread, and butter.',
        tags: [tags.cooking, tags.personal],
        createdAt: new Date('2023-04-05'),
      },
      {
        id: 'doc_5',
        name: 'Project Plan',
        content: 'Outline project goals and milestones.',
        tags: [tags.work],
        createdAt: new Date('2023-05-20'),
      },
      {
        id: 'doc_6',
        name: 'Vacation Ideas',
        content: 'Consider visiting the beach or mountains.',
        tags: [],
        createdAt: new Date('2023-06-15'),
      },
      {
        id: 'doc_7',
        name: 'Invoice 001',
        content: 'Invoice for services.',
        tags: [tags.work],
        createdAt: new Date('2023-07-01'),
        customProperties: [{ key: 'invoicenumber', type: 'text', value: 'INV-001' }],
      },
      {
        id: 'doc_8',
        name: 'Case File',
        content: 'Reviewed case file.',
        tags: [],
        createdAt: new Date('2023-08-01'),
        customProperties: [
          {
            key: 'status',
            type: 'select',
            value: { optionId: 'opt_status_archived', name: 'Archived' },
          },
          {
            key: 'labels',
            type: 'multi_select',
            value: [
              { optionId: 'opt_label_urgent', name: 'Urgent' },
              { optionId: 'opt_label_review', name: 'Review' },
            ],
          },
        ],
      },
    ] as unknown as Document[];

    const queries = [
      { query: 'panca', expectedIds: ['doc_1'] },
      { query: 'pancakes', expectedIds: ['doc_1'] },
      { query: 'pancakes flour', expectedIds: ['doc_1'] },
      { query: 'tag:cooking', expectedIds: ['doc_1', 'doc_4'] },
      { query: 'tag:cooking butter', expectedIds: ['doc_4'] },
      { query: 'tag:work created:>2023-03-01', expectedIds: ['doc_5', 'doc_7'] },
      { query: '-tag:work', expectedIds: ['doc_1', 'doc_3', 'doc_4', 'doc_6', 'doc_8'] },
      { query: 'has:tags', expectedIds: ['doc_1', 'doc_2', 'doc_3', 'doc_4', 'doc_5', 'doc_7'] },
      { query: '-has:tags', expectedIds: ['doc_6', 'doc_8'] },
      { query: 'NOT has:tags', expectedIds: ['doc_6', 'doc_8'] },
      { query: '-has:tags OR tag:personal', expectedIds: ['doc_3', 'doc_4', 'doc_6', 'doc_8'] },
      { query: 'ncakes', expectedIds: [] },
      { query: 'name:ncakes', expectedIds: [] },
      { query: 'content:ncakes', expectedIds: [] },
      { query: 'InvoiceNumber:INV', expectedIds: ['doc_7'] },
      { query: 'invoicenumber:INV', expectedIds: ['doc_7'] },
      { query: 'INVOICENUMBER:INV', expectedIds: ['doc_7'] },
      // select custom property — matched by option key (lowercased option name) or option id
      { query: 'status:archived', expectedIds: ['doc_8'] },
      { query: 'status:Archived', expectedIds: ['doc_8'] },
      { query: 'status:opt_status_archived', expectedIds: ['doc_8'] },
      { query: 'status:pending', expectedIds: [] },
      { query: 'has:status', expectedIds: ['doc_8'] },
      // multi_select custom property — matches if any option matches
      { query: 'labels:urgent', expectedIds: ['doc_8'] },
      { query: 'labels:review', expectedIds: ['doc_8'] },
      { query: 'labels:missing', expectedIds: [] },
    ];

    for (const { query, expectedIds } of queries) {
      test(`search query "${query}"`, () => {
        expect(searchDemoDocuments({ query, documents }).map((doc) => doc.id)).toEqual(expectedIds);
      });
    }
  });

  describe('someCorpusTokenStartsWith', () => {
    test('simulate FTS search behavior by checking if a word starts with the search text, like `name:"foo"*`', () => {
      expect(someCorpusTokenStartsWith({ corpus: 'The quick brown fox', prefix: 'qu' })).toBe(true);
      expect(someCorpusTokenStartsWith({ corpus: 'The quick brown fox', prefix: 'ick' })).toBe(
        false,
      );
    });

    test('works with punctuation', () => {
      expect(
        someCorpusTokenStartsWith({ corpus: 'Hello, world! This is a test.', prefix: 'wo' }),
      ).toBe(true);
      expect(
        someCorpusTokenStartsWith({ corpus: 'Hello, world! This is a test.', prefix: 'is' }),
      ).toBe(true);
      expect(
        someCorpusTokenStartsWith({ corpus: 'Hello, world! This is a test.', prefix: 'te' }),
      ).toBe(true);
      expect(
        someCorpusTokenStartsWith({ corpus: 'Hello, world! This is a test.', prefix: 'lo' }),
      ).toBe(false);
      expect(someCorpusTokenStartsWith({ corpus: 'Hello-world', prefix: 'worl' })).toBe(true);
    });
  });
});
