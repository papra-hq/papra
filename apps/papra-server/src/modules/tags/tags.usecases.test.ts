import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { createOrganizationTagLimitReachedError } from './tags.errors';
import { createTagsRepository } from './tags.repository';
import { checkIfOrganizationCanCreateNewTag, createTag } from './tags.usecases';

describe('tags usecases', () => {
  describe('checkIfOrganizationCanCreateNewTag', () => {
    test('when the organization has fewer tags than the limit, no error is thrown', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        tags: [
          { id: 'tag-1', organizationId: 'org-1', name: 'Tag 1', normalizedName: 'tag 1', color: '#AA0000' },
        ],
      });

      const tagsRepository = createTagsRepository({ db });
      const config = overrideConfig({ tags: { maxTagsPerOrganization: 5 } });

      await checkIfOrganizationCanCreateNewTag({
        organizationId: 'org-1',
        config,
        tagsRepository,
      });
    });

    test('when the organization has reached the tag limit, an error is thrown', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        tags: [
          { id: 'tag-1', organizationId: 'org-1', name: 'Tag 1', normalizedName: 'tag 1', color: '#AA0000' },
          { id: 'tag-2', organizationId: 'org-1', name: 'Tag 2', normalizedName: 'tag 2', color: '#00AA00' },
        ],
      });

      const tagsRepository = createTagsRepository({ db });
      const config = overrideConfig({ tags: { maxTagsPerOrganization: 2 } });

      await expect(
        checkIfOrganizationCanCreateNewTag({
          organizationId: 'org-1',
          config,
          tagsRepository,
        }),
      ).rejects.toThrow(createOrganizationTagLimitReachedError());
    });

    test('tags from other organizations are not counted towards the limit', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org-1', name: 'Organization 1' },
          { id: 'org-2', name: 'Organization 2' },
        ],
        tags: [
          { id: 'tag-1', organizationId: 'org-1', name: 'Tag 1', normalizedName: 'tag 1', color: '#AA0000' },
          { id: 'tag-2', organizationId: 'org-2', name: 'Tag 2', normalizedName: 'tag 2', color: '#00AA00' },
          { id: 'tag-3', organizationId: 'org-2', name: 'Tag 3', normalizedName: 'tag 3', color: '#0000AA' },
        ],
      });

      const tagsRepository = createTagsRepository({ db });
      const config = overrideConfig({ tags: { maxTagsPerOrganization: 2 } });

      await checkIfOrganizationCanCreateNewTag({
        organizationId: 'org-1',
        config,
        tagsRepository,
      });
    });
  });

  describe('createTag', () => {
    test('when the organization has not reached the tag limit, the tag is created', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
      });

      const tagsRepository = createTagsRepository({ db });
      const config = overrideConfig({ tags: { maxTagsPerOrganization: 5 } });

      const { tag } = await createTag({
        organizationId: 'org-1',
        name: 'New Tag',
        color: '#FF0000',
        config,
        tagsRepository,
      });

      expect(tag).to.include({
        organizationId: 'org-1',
        name: 'New Tag',
        color: '#FF0000',
      });
    });

    test('when the organization has reached the tag limit, creating a new tag throws an error', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [{ id: 'org-1', name: 'Organization 1' }],
        tags: [
          { id: 'tag-1', organizationId: 'org-1', name: 'Tag 1', normalizedName: 'tag 1', color: '#AA0000' },
          { id: 'tag-2', organizationId: 'org-1', name: 'Tag 2', normalizedName: 'tag 2', color: '#00AA00' },
        ],
      });

      const tagsRepository = createTagsRepository({ db });
      const config = overrideConfig({ tags: { maxTagsPerOrganization: 2 } });

      await expect(
        createTag({
          organizationId: 'org-1',
          name: 'New Tag',
          color: '#FF0000',
          config,
          tagsRepository,
        }),
      ).rejects.toThrow(createOrganizationTagLimitReachedError());
    });
  });
});
