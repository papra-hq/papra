import { beforeEach, describe, expect, test, vi } from 'vitest';
import { bulkAddTagToDocuments, bulkDeleteDocuments } from './documents.bulk-actions';

vi.mock('../tags/tags.services', () => ({
  addTagToDocument: vi.fn(),
}));

vi.mock('./documents.services', () => ({
  deleteDocument: vi.fn(),
}));

vi.mock('./documents.composables', () => ({
  invalidateOrganizationDocumentsQuery: vi.fn(),
}));

const { addTagToDocument } = await import('../tags/tags.services');
const { deleteDocument } = await import('./documents.services');
const { invalidateOrganizationDocumentsQuery } = await import('./documents.composables');

describe('documents bulk actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('bulkAddTagToDocuments', () => {
    test('calls addTagToDocument for each document with the given tag id', async () => {
      vi.mocked(addTagToDocument).mockResolvedValue(undefined);
      vi.mocked(invalidateOrganizationDocumentsQuery).mockResolvedValue(undefined);

      await bulkAddTagToDocuments({
        documentIds: ['doc-1', 'doc-2', 'doc-3'],
        organizationId: 'org-1',
        tagId: 'tag-1',
      });

      expect(addTagToDocument).toHaveBeenCalledTimes(3);
      expect(addTagToDocument).toHaveBeenCalledWith({ documentId: 'doc-1', organizationId: 'org-1', tagId: 'tag-1' });
      expect(addTagToDocument).toHaveBeenCalledWith({ documentId: 'doc-2', organizationId: 'org-1', tagId: 'tag-1' });
      expect(addTagToDocument).toHaveBeenCalledWith({ documentId: 'doc-3', organizationId: 'org-1', tagId: 'tag-1' });
    });

    test('invalidates the organization documents query once after all operations complete', async () => {
      vi.mocked(addTagToDocument).mockResolvedValue(undefined);
      vi.mocked(invalidateOrganizationDocumentsQuery).mockResolvedValue(undefined);

      await bulkAddTagToDocuments({
        documentIds: ['doc-1', 'doc-2'],
        organizationId: 'org-1',
        tagId: 'tag-1',
      });

      expect(invalidateOrganizationDocumentsQuery).toHaveBeenCalledTimes(1);
      expect(invalidateOrganizationDocumentsQuery).toHaveBeenCalledWith({ organizationId: 'org-1' });
    });

    test('returns the count of successful and failed operations', async () => {
      vi.mocked(addTagToDocument).mockResolvedValue(undefined);
      vi.mocked(invalidateOrganizationDocumentsQuery).mockResolvedValue(undefined);

      const result = await bulkAddTagToDocuments({
        documentIds: ['doc-1', 'doc-2', 'doc-3'],
        organizationId: 'org-1',
        tagId: 'tag-1',
      });

      expect(result).to.eql({ successCount: 3, errorCount: 0 });
    });

    test('when some operations fail, the successful ones still proceed and counts reflect the results', async () => {
      vi.mocked(addTagToDocument)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('already tagged'))
        .mockResolvedValueOnce(undefined);
      vi.mocked(invalidateOrganizationDocumentsQuery).mockResolvedValue(undefined);

      const result = await bulkAddTagToDocuments({
        documentIds: ['doc-1', 'doc-2', 'doc-3'],
        organizationId: 'org-1',
        tagId: 'tag-1',
      });

      expect(result).to.eql({ successCount: 2, errorCount: 1 });
      expect(addTagToDocument).toHaveBeenCalledTimes(3);
      expect(invalidateOrganizationDocumentsQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('bulkDeleteDocuments', () => {
    test('calls deleteDocument for each document id', async () => {
      vi.mocked(deleteDocument).mockResolvedValue(undefined);
      vi.mocked(invalidateOrganizationDocumentsQuery).mockResolvedValue(undefined);

      await bulkDeleteDocuments({
        documentIds: ['doc-1', 'doc-2'],
        organizationId: 'org-1',
      });

      expect(deleteDocument).toHaveBeenCalledTimes(2);
      expect(deleteDocument).toHaveBeenCalledWith({ documentId: 'doc-1', organizationId: 'org-1' });
      expect(deleteDocument).toHaveBeenCalledWith({ documentId: 'doc-2', organizationId: 'org-1' });
    });

    test('invalidates the organization documents query once after all operations complete', async () => {
      vi.mocked(deleteDocument).mockResolvedValue(undefined);
      vi.mocked(invalidateOrganizationDocumentsQuery).mockResolvedValue(undefined);

      await bulkDeleteDocuments({
        documentIds: ['doc-1', 'doc-2'],
        organizationId: 'org-1',
      });

      expect(invalidateOrganizationDocumentsQuery).toHaveBeenCalledTimes(1);
      expect(invalidateOrganizationDocumentsQuery).toHaveBeenCalledWith({ organizationId: 'org-1' });
    });

    test('returns the count of successful and failed operations', async () => {
      vi.mocked(deleteDocument).mockResolvedValue(undefined);
      vi.mocked(invalidateOrganizationDocumentsQuery).mockResolvedValue(undefined);

      const result = await bulkDeleteDocuments({
        documentIds: ['doc-1', 'doc-2', 'doc-3'],
        organizationId: 'org-1',
      });

      expect(result).to.eql({ successCount: 3, errorCount: 0 });
    });

    test('when some deletions fail, successful ones still proceed and counts reflect the results', async () => {
      vi.mocked(deleteDocument)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce(undefined);
      vi.mocked(invalidateOrganizationDocumentsQuery).mockResolvedValue(undefined);

      const result = await bulkDeleteDocuments({
        documentIds: ['doc-1', 'doc-2', 'doc-3'],
        organizationId: 'org-1',
      });

      expect(result).to.eql({ successCount: 2, errorCount: 1 });
      expect(deleteDocument).toHaveBeenCalledTimes(3);
      expect(invalidateOrganizationDocumentsQuery).toHaveBeenCalledTimes(1);
    });
  });
});
