import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { ORGANIZATION_ROLE_MEMBER } from '../organizations/organizations.constants';
import { createDocumentAlreadyHasTagError } from './tags.errors';
import { createTagsRepository } from './tags.repository';

describe('tags repository', () => {
  describe('crud operations on tags collection', () => {
    test('given an organization, tags can be created, retrieved, updated, and deleted', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
      });

      const tagsRepository = createTagsRepository({ db });

      const { tag: tag1 } = await tagsRepository.createTag({
        tag: { organizationId: 'organization-1', name: 'Tag 1', color: '#aa0000' },
      });

      expect(tag1).to.include({
        organizationId: 'organization-1',
        name: 'Tag 1',
        description: null,
        color: '#aa0000',
      });

      const { tags } = await tagsRepository.getOrganizationTags({ organizationId: 'organization-1' });

      expect(tags).to.have.length(1);
      expect(tags[0]).to.include({
        organizationId: 'organization-1',
        name: 'Tag 1',
        description: null,
        color: '#aa0000',
      });

      const { tag: updatedTag1 } = await tagsRepository.updateTag({
        tagId: tag1.id,
        name: 'Tag 1 Updated',
        description: 'Tag 1 Description',
        color: '#00aa00',
      });

      expect(updatedTag1).to.include({
        organizationId: 'organization-1',
        name: 'Tag 1 Updated',
        description: 'Tag 1 Description',
        color: '#00aa00',
      });

      const { tags: tagsAfterUpdate } = await tagsRepository.getOrganizationTags({ organizationId: 'organization-1' });

      expect(tagsAfterUpdate).to.have.length(1);
      expect(tagsAfterUpdate[0]).to.include({
        organizationId: 'organization-1',
        name: 'Tag 1 Updated',
        description: 'Tag 1 Description',
        color: '#00aa00',
      });

      await tagsRepository.deleteTag({ tagId: tag1.id });

      const { tags: tagsAfterDelete } = await tagsRepository.getOrganizationTags({ organizationId: 'organization-1' });

      expect(tagsAfterDelete).to.have.length(0);
    });
  });

  describe('addTagToDocument', () => {
    test('a tag can be be added only once to a document', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1', slug: 'organization-1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLE_MEMBER }],
        documents: [
          { id: 'document-1', organizationId: 'organization-1', createdBy: 'user-1', name: 'Document 1', originalName: 'document-1.pdf', content: 'lorem ipsum', originalStorageKey: '', mimeType: 'application/pdf', originalSha256Hash: 'hash' },
        ],
        tags: [{ id: 'tag-1', organizationId: 'organization-1', name: 'Tag 1', color: '#aa0000' }],
      });

      const tagsRepository = createTagsRepository({ db });

      await tagsRepository.addTagToDocument({ tagId: 'tag-1', documentId: 'document-1' });

      await expect(
        tagsRepository.addTagToDocument({
          tagId: 'tag-1',
          documentId: 'document-1',
        }),
      ).rejects.toThrow(createDocumentAlreadyHasTagError());
    });
  });
});
