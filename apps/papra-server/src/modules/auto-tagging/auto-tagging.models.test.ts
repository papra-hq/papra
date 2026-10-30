import { describe, expect, test } from 'vitest';
import { getTagsActions } from './auto-tagging.models';

describe('auto-tagging.models', () => {
  describe('getTagsActions', () => {
    describe('the structured data returned by the AI depends on the context (can create new tags, is there existing tags, etc.)', () => {
      const existingTags = [
        { id: 'tag_1', name: 'Finance' },
        { id: 'tag_2', name: 'Household' },
        { id: 'tag_3', name: 'Gardening' },
        { id: 'tag_4', name: 'Travel' },
      ];

      test('when the creation of new tags is not allowed and there are existing tags, the prediction returns an array of existing tags name', () => {
        expect(
          getTagsActions({
            autoTaggingResponse: { existingTags: ['Finance', 'Household'] },
            existingTags,
            maxTags: 5,
          }),
        ).to.eql({
          tagIdsToAdd: ['tag_1', 'tag_2'],
          tagsToCreate: [],
        });
      });

      test('when the creation of new tags is allowed and there are existing tags, the prediction returns an array of existing tags name and new tags', () => {
        expect(
          getTagsActions({
            autoTaggingResponse: {
              existingTags: ['Finance'],
              newTags: [{ name: 'New Tag', description: 'A new tag description' }],
            },
            existingTags,
            maxTags: 5,
          }),
        ).to.eql({
          tagIdsToAdd: ['tag_1'],
          tagsToCreate: [{ name: 'New Tag', description: 'A new tag description' }],
        });
      });

      test('when the creation of new tags is allowed and there are no existing tags, the prediction returns an array of new tags', () => {
        expect(
          getTagsActions({
            autoTaggingResponse: {
              newTags: [{ name: 'New Tag 1', description: 'Description 1' }, { name: 'New Tag 2' }],
            },
            maxTags: 5,
            existingTags: [],
          }),
        ).to.eql({
          tagIdsToAdd: [],
          tagsToCreate: [
            { name: 'New Tag 1', description: 'Description 1' },
            { name: 'New Tag 2' },
          ],
        });
      });

      test('should not happen because of guards, but when the creation of new tags is not allowed and there are no existing tags, the prediction returns an empty array', () => {
        expect(
          getTagsActions({
            autoTaggingResponse: {},
            maxTags: 5,
            existingTags: [],
          }),
        ).to.eql({
          tagIdsToAdd: [],
          tagsToCreate: [],
        });
      });

      test('duplicated existing are deduplicated and only one tag is returned', () => {
        expect(
          getTagsActions({
            autoTaggingResponse: { existingTags: ['Finance', 'Finance'] },
            existingTags,
            maxTags: 5,
          }),
        ).to.eql({
          tagIdsToAdd: ['tag_1'],
          tagsToCreate: [],
        });
      });

      test('the number of tags returned should not exceed the maxTags limit, the extra tags should be ignored, with the priority given to existing tags over new tags', () => {
        expect(
          getTagsActions({
            autoTaggingResponse: {
              existingTags: ['Finance', 'Household', 'Gardening', 'Travel'],
            },
            maxTags: 3,
            existingTags,
          }),
        ).to.eql({
          tagIdsToAdd: ['tag_1', 'tag_2', 'tag_3'],
          tagsToCreate: [],
        });

        expect(
          getTagsActions({
            autoTaggingResponse: {
              newTags: [
                { name: 'New Tag 1' },
                { name: 'New Tag 2' },
                { name: 'New Tag 3' },
                { name: 'New Tag 4' },
              ],
            },
            maxTags: 3,
            existingTags,
          }),
        ).to.eql({
          tagIdsToAdd: [],
          tagsToCreate: [{ name: 'New Tag 1' }, { name: 'New Tag 2' }, { name: 'New Tag 3' }],
        });

        expect(
          getTagsActions({
            autoTaggingResponse: {
              existingTags: ['Finance', 'Household'],
              newTags: [{ name: 'New Tag 1' }, { name: 'New Tag 2' }],
            },
            maxTags: 3,
            existingTags,
          }),
        ).to.eql({
          tagIdsToAdd: ['tag_1', 'tag_2'],
          tagsToCreate: [{ name: 'New Tag 1' }],
        });

        expect(
          getTagsActions({
            autoTaggingResponse: {
              existingTags: ['Finance', 'Household', 'Gardening', 'Travel'],
              newTags: [{ name: 'New Tag 1' }, { name: 'New Tag 2' }],
            },
            maxTags: 3,
            existingTags,
          }),
        ).to.eql({
          tagIdsToAdd: ['tag_1', 'tag_2', 'tag_3'],
          tagsToCreate: [],
        });
      });

      test('duplicated tags do not count towards the maxTags limit', () => {
        expect(
          getTagsActions({
            autoTaggingResponse: {
              existingTags: ['Finance', 'Finance', 'Household'],
              newTags: [{ name: 'New Tag 1' }, { name: 'New Tag 2' }],
            },
            maxTags: 3,
            existingTags,
          }),
        ).to.eql({
          tagIdsToAdd: ['tag_1', 'tag_2'],
          tagsToCreate: [{ name: 'New Tag 1' }],
        });
      });
    });
  });
});
