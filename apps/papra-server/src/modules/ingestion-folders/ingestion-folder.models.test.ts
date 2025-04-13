import { describe, expect, test } from 'vitest';
import { addTimestampToFilename, isFileInDoneFolder, isFileInErrorFolder, normalizeFilePathToIngestionFolder } from './ingestion-folder.models';

describe('ingestion-folder models', () => {
  describe('normalizeFilePathToIngestionFolder', () => {
    test('get the path of a file relative to the ingestion folder', () => {
      expect(
        normalizeFilePathToIngestionFolder({
          filePath: '/home/foo/projects/papra/apps/papra-server/ingestion/org_1/yo.md',
          ingestionFolderPath: '/home/foo/projects/papra/apps/papra-server/ingestion',
        }),
      ).to.eql({ relativeFilePath: 'org_1/yo.md' });
    });
  });

  describe('isFileInErrorFolder', () => {
    test('the user can configure the error folder as a relative path, it is relative to the file organization ingestion folder', () => {
      // Here the error folder is /foo/bar/ingestion/org_1/error
      expect(
        isFileInErrorFolder({
          filePath: '/foo/bar/ingestion/org_1/yo.md',
          errorFolder: 'error',
          organizationIngestionFolderPath: '/foo/bar/ingestion/org_1',
        }),
      ).to.equal(false);

      expect(
        isFileInErrorFolder({
          filePath: '/foo/bar/ingestion/org_1/error/yo.md',
          errorFolder: 'error',
          organizationIngestionFolderPath: '/foo/bar/ingestion/org_1',
        }),
      ).to.equal(true);
    });

    test('the user can configure the error folder as an absolute path that can overlap with the organization ingestion folder', () => {
      expect(
        isFileInErrorFolder({
          filePath: '/foo/bar/ingestion/org_1/error/yo.md',
          errorFolder: '/foo/bar/ingestion/org_1/error',
          organizationIngestionFolderPath: '/foo/bar/ingestion/org_1',
        }),
      ).to.equal(true);

      expect(
        isFileInErrorFolder({
          filePath: '/foo/bar/ingestion/org_1/error/yo.md',
          errorFolder: '/error',
          organizationIngestionFolderPath: '/foo/bar/ingestion/org_1',
        }),
      ).to.equal(false);
    });
  });

  describe('isFileInDoneFolder', () => {
    test('the user can configure the done folder as a relative path, it is relative to the file organization ingestion folder', () => {
      // Here the done folder is /foo/bar/ingestion/org_1/done
      expect(
        isFileInDoneFolder({
          filePath: '/foo/bar/ingestion/org_1/yo.md',
          doneFolder: 'done',
          organizationIngestionFolderPath: '/foo/bar/ingestion/org_1',
        }),
      ).to.equal(false);

      expect(
        isFileInDoneFolder({
          filePath: '/foo/bar/ingestion/org_1/done/yo.md',
          doneFolder: 'done',
          organizationIngestionFolderPath: '/foo/bar/ingestion/org_1',
        }),
      ).to.equal(true);
    });

    test('the user can configure the done folder as an absolute path that can overlap with the organization ingestion folder', () => {
      expect(
        isFileInDoneFolder({
          filePath: '/foo/bar/ingestion/org_1/done/yo.md',
          doneFolder: '/foo/bar/ingestion/org_1/done',
          organizationIngestionFolderPath: '/foo/bar/ingestion/org_1',
        }),
      ).to.equal(true);

      expect(
        isFileInDoneFolder({
          filePath: '/foo/bar/ingestion/org_1/done/yo.md',
          doneFolder: '/done',
          organizationIngestionFolderPath: '/foo/bar/ingestion/org_1',
        }),
      ).to.equal(false);
    });
  });

  describe('addTimestampToFilename', () => {
    test('given a filename, it adds a timestamp to the name, before the extension', () => {
      expect(
        addTimestampToFilename({ fileName: 'yo.md', now: new Date('2024-04-14T12:00:00.000Z') }),
      ).to.equal('yo_1713096000000.md');

      expect(
        addTimestampToFilename({ fileName: '.config', now: new Date('2024-04-14T12:00:00.000Z') }),
      ).to.equal('.config_1713096000000');

      expect(
        addTimestampToFilename({ fileName: 'documents.models.tests.ts', now: new Date('2024-04-14T12:00:00.000Z') }),
      ).to.equal('documents.models.tests_1713096000000.ts');
    });
  });
});
