import type { Document } from '@/modules/documents/documents.types';
import type { Tag } from '@/modules/tags/tags.types';
import { describe, expect, test } from 'vitest';
import { searchDemoDocuments } from './demo.search.services';

describe('demo search services', () => {
  describe('searchDemoDocuments', () => {
    const tags = {
      cooking: { id: '1', name: 'cooking' },
      work: { id: '2', name: 'work' },
      personal: { id: '3', name: 'personal' },
    } as unknown as Record<string, Tag>;

    const documents = [
      { id: 'doc_1', name: 'Recipe for Pancakes', content: 'Mix flour, eggs, and milk to make pancakes.', tags: [tags.cooking], createdAt: new Date('2023-01-01') },
      { id: 'doc_2', name: 'Work Meeting Notes', content: 'Discuss project timeline and deliverables.', tags: [tags.work], createdAt: new Date('2023-02-15') },
      { id: 'doc_3', name: 'Personal Journal', content: 'Today I went for a walk in the park.', tags: [tags.personal], createdAt: new Date('2023-03-10') },
      { id: 'doc_4', name: 'Grocery List', content: 'Eggs, milk, bread, and butter.', tags: [tags.cooking, tags.personal], createdAt: new Date('2023-04-05') },
      { id: 'doc_5', name: 'Project Plan', content: 'Outline project goals and milestones.', tags: [tags.work], createdAt: new Date('2023-05-20') },
      { id: 'doc_6', name: 'Vacation Ideas', content: 'Consider visiting the beach or mountains.', tags: [], createdAt: new Date('2023-06-15') },
    ] as unknown as Document[];

    const queries = [
      { query: 'pancakes', expectedIds: ['doc_1'] },
      { query: 'tag:cooking', expectedIds: ['doc_1', 'doc_4'] },
      { query: 'tag:cooking butter', expectedIds: ['doc_4'] },
      { query: 'tag:work created:>2023-03-01', expectedIds: ['doc_5'] },
      { query: '-tag:work', expectedIds: ['doc_1', 'doc_3', 'doc_4', 'doc_6'] },
      { query: 'has:tags', expectedIds: ['doc_1', 'doc_2', 'doc_3', 'doc_4', 'doc_5'] },
      { query: '-has:tags', expectedIds: ['doc_6'] },
      { query: 'NOT has:tags', expectedIds: ['doc_6'] },
      { query: '-has:tags OR tag:personal', expectedIds: ['doc_3', 'doc_4', 'doc_6'] },
    ];

    for (const { query, expectedIds } of queries) {
      test(`search query "${query}"`, () => {
        expect(
          searchDemoDocuments({ query, documents }).map(doc => doc.id),
        ).toEqual(
          expectedIds,
        );
      });
    }
  });
});
