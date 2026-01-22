import { icons as tablerIconSet } from '@iconify-json/tabler';
import { describe, expect, test } from 'vitest';
import { fileIcons, getDaysBeforePermanentDeletion, getDocumentIcon, getDocumentNameExtension, getDocumentNameWithoutExtension, makeDocumentSearchPermalink, makeDocumentSearchQuery } from './document.models';

describe('files models', () => {
  describe('iconByFileType', () => {
    test('all the icons should be from tabler icon set', () => {
      for (const { icon } of fileIcons) {
        expect(icon).to.match(/^i-tabler-/, `Icon ${icon} is not from tabler icon set`);
      }
    });

    test('icons should not contain any spaces', () => {
      for (const { icon } of fileIcons) {
        expect(icon).not.to.match(/\s/, `Icon ${icon} contains spaces`);
      }
    });

    test('the icons used for showing file types should exists with current iconify configuration', () => {
      for (const { icon } of fileIcons) {
        const iconName = icon.replace('i-tabler-', '');
        const iconData = tablerIconSet.icons[iconName] ?? tablerIconSet.aliases?.[iconName];

        expect(iconData).to.not.eql(undefined, `Icon ${icon} does not exist in tabler icon set`);
      }
    });

    test('there should not be duplicate icons for a file extension', () => {
      const seenExtensions = new Set<string>();

      for (const { extensions, icon } of fileIcons) {
        for (const extension of extensions) {
          expect(
            seenExtensions.has(extension),
          ).to.eql(
            false,
            `Duplicate icon ${icon} found for extension .${extension}`,
          );
          seenExtensions.add(extension);
        }
      }
    });

    test('there should not be duplicate icons for a mime type', () => {
      const seenMimeTypes = new Set<string>();

      for (const { mimeTypes, icon } of fileIcons) {
        for (const mimeType of mimeTypes) {
          expect(
            seenMimeTypes.has(mimeType),
          ).to.eql(
            false,
            `Duplicate icon ${icon} found for mime type ${mimeType}`,
          );
          seenMimeTypes.add(mimeType);
        }
      }
    });
  });

  describe('getFileIcon', () => {
    test('a file icon is selected based on the file type', () => {
      const document = { mimeType: 'text/plain' };

      const icon = getDocumentIcon({ document });

      expect(icon).to.eql('i-tabler-file-text');
    });

    test('if a file type is not associated with an icon, the default icon is used', () => {
      const document = { mimeType: 'foo/bar' };

      const icon = getDocumentIcon({ document });

      expect(icon).to.eql('i-tabler-file');
    });

    test('a file icon can be selected based on the file type group', () => {
      const document = { mimeType: 'image/unknow-image-format' };

      const icon = getDocumentIcon({ document });

      expect(icon).to.eql('i-tabler-photo');
    });

    test('when an icon is defined for both the whole type and the group type, the file type icon is used', () => {
      const document = { mimeType: 'text/html' };
      const icon = getDocumentIcon({ document, iconByMimeTypeMap: { 'text/html': 'i-tabler-file-type-html', 'text': 'i-tabler-file-text' } });

      expect(icon).to.eql('i-tabler-file-type-html');
    });

    test('a file icon can be selected based on the file extension', () => {
      const document = { name: 'document.css' };

      const icon = getDocumentIcon({ document });

      expect(icon).to.eql('i-tabler-file-type-css');
    });

    test('if no file type or extension match is found, the default icon is used', () => {
      const document = { name: 'document.unknownextension' };

      const icon = getDocumentIcon({ document });

      expect(icon).to.eql('i-tabler-file');
    });

    test('if the document has no name nor mimeType, the default icon is used', () => {
      expect(getDocumentIcon({ document: { name: undefined, mimeType: undefined } })).to.eql('i-tabler-file');
      expect(getDocumentIcon({ document: { name: undefined } })).to.eql('i-tabler-file');
      expect(getDocumentIcon({ document: { mimeType: undefined } })).to.eql('i-tabler-file');
      expect(getDocumentIcon({ document: { } })).to.eql('i-tabler-file');
    });

    test('when a document has both a mimeType and a name, the mimeType takes precedence for icon selection', () => {
      const document = { name: 'document.css', mimeType: 'text/html' };

      const icon = getDocumentIcon({ document });

      expect(icon).to.eql('i-tabler-file-type-html');
    });
  });

  describe('getDaysBeforePermanentDeletion', () => {
    test('get the amount of days before a document is permanently deleted, basically the difference between the deletion date and now', () => {
      const document = { deletedAt: new Date('2021-01-01') };
      const deletedDocumentsRetentionDays = 30;
      const now = new Date('2021-01-10');

      const daysBeforeDeletion = getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now });

      expect(daysBeforeDeletion).to.eql(21);
    });

    test('if the document has not been deleted, the days before permanent deletion is undefined', () => {
      const document = { deletedAt: undefined };
      const deletedDocumentsRetentionDays = 30;
      const now = new Date('2021-01-10');

      const daysBeforeDeletion = getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now });

      expect(daysBeforeDeletion).to.eql(undefined);
    });

    test('returns 0 when the permanent deletion date is today', () => {
      const document = { deletedAt: new Date('2021-01-01') };
      const deletedDocumentsRetentionDays = 30;
      const now = new Date('2021-01-31');

      const daysBeforeDeletion = getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now });

      expect(daysBeforeDeletion).to.eql(0);
    });

    test('returns negative days when the permanent deletion date has passed', () => {
      const document = { deletedAt: new Date('2021-01-01') };
      const deletedDocumentsRetentionDays = 30;
      const now = new Date('2021-02-15');

      const daysBeforeDeletion = getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now });

      expect(daysBeforeDeletion).to.eql(-15);
    });

    test('handles deletion that happened on the same day (considers time of day)', () => {
      const document = { deletedAt: new Date('2021-01-10T08:00:00') };
      const deletedDocumentsRetentionDays = 30;
      const now = new Date('2021-01-10T14:00:00');

      const daysBeforeDeletion = getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now });

      // Since differenceInDays counts full days, and there's only 6 hours difference,
      // the permanent deletion date (30 days from 08:00) is 29 full days from 14:00
      expect(daysBeforeDeletion).to.eql(29);
    });

    test('handles very short retention periods', () => {
      const document = { deletedAt: new Date('2021-01-10') };
      const deletedDocumentsRetentionDays = 1;
      const now = new Date('2021-01-10');

      const daysBeforeDeletion = getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now });

      expect(daysBeforeDeletion).to.eql(1);
    });

    test('handles very long retention periods', () => {
      const document = { deletedAt: new Date('2021-01-01') };
      const deletedDocumentsRetentionDays = 365;
      const now = new Date('2021-01-10');

      const daysBeforeDeletion = getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now });

      expect(daysBeforeDeletion).to.eql(356);
    });

    test('handles zero retention days (immediate deletion)', () => {
      const document = { deletedAt: new Date('2021-01-10') };
      const deletedDocumentsRetentionDays = 0;
      const now = new Date('2021-01-10');

      const daysBeforeDeletion = getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now });

      expect(daysBeforeDeletion).to.eql(0);
    });

    test('handles dates across year boundaries', () => {
      const document = { deletedAt: new Date('2020-12-20') };
      const deletedDocumentsRetentionDays = 30;
      const now = new Date('2021-01-05');

      const daysBeforeDeletion = getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now });

      expect(daysBeforeDeletion).to.eql(14);
    });

    test('handles dates across leap year February', () => {
      const document = { deletedAt: new Date('2020-02-15') };
      const deletedDocumentsRetentionDays = 30;
      const now = new Date('2020-02-20');

      const daysBeforeDeletion = getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now });

      expect(daysBeforeDeletion).to.eql(25);
    });

    test('handles timestamp precision with hours and minutes', () => {
      const document = { deletedAt: new Date('2021-01-01T23:59:59') };
      const deletedDocumentsRetentionDays = 30;
      const now = new Date('2021-01-02T00:00:01');

      const daysBeforeDeletion = getDaysBeforePermanentDeletion({ document, deletedDocumentsRetentionDays, now });

      expect(daysBeforeDeletion).to.eql(29);
    });
  });

  describe('getDocumentNameWithoutExtension', () => {
    test('get the document name without the extension', () => {
      expect(getDocumentNameWithoutExtension({ name: 'document.txt' })).to.eql('document');
      expect(getDocumentNameWithoutExtension({ name: 'document' })).to.eql('document');
      expect(getDocumentNameWithoutExtension({ name: '.document' })).to.eql('.document');
      expect(getDocumentNameWithoutExtension({ name: '.document.txt' })).to.eql('.document');
      expect(getDocumentNameWithoutExtension({ name: 'document.test.txt' })).to.eql('document.test');
    });
  });

  describe('getDocumentNameExtension', () => {
    test('get the document name extension', () => {
      expect(getDocumentNameExtension({ name: 'document.txt' })).to.eql('txt');
      expect(getDocumentNameExtension({ name: 'document' })).to.eql(undefined);
      expect(getDocumentNameExtension({ name: '.document' })).to.eql(undefined);
      expect(getDocumentNameExtension({ name: '.document.txt' })).to.eql('txt');
      expect(getDocumentNameExtension({ name: 'document.test.txt' })).to.eql('txt');
    });
  });

  describe('makeDocumentSearchQuery', () => {
    test('with no search criteria, the search query is an empty string', () => {
      expect(makeDocumentSearchQuery()).to.eql('');
      expect(makeDocumentSearchQuery({})).to.eql('');
      expect(makeDocumentSearchQuery({ tags: [] })).to.eql('');
      expect(makeDocumentSearchQuery({ query: '' })).to.eql('');
      expect(makeDocumentSearchQuery({ query: undefined })).to.eql('');
      expect(makeDocumentSearchQuery({ tags: [], query: '' })).to.eql('');
      expect(makeDocumentSearchQuery({ tags: [], query: undefined })).to.eql('');
    });

    test('the tags are prefixed with "tag:" and use preferably the name over the id', () => {
      expect(
        makeDocumentSearchQuery({
          tags: [
            { name: 'invoices', id: 'tag_1111' },
            { name: 'receipts' },
            { id: 'tag_2222' },
          ],
        }),
      ).to.eql('tag:invoices tag:receipts tag:tag_2222');
    });

    test('tags with spaces in their name are quoted in the search query', () => {
      expect(
        makeDocumentSearchQuery({ tags: [{ name: 'my tag' }] }),
      ).to.eql(
        'tag:"my tag"',
      );

      expect(
        makeDocumentSearchQuery({ tags: [{ name: 'tag with "quotes"' }] }),
      ).to.eql(
        'tag:"tag with \\"quotes\\""',
      );

      expect(
        makeDocumentSearchQuery({ tags: [{ id: 'tag_1234', name: 'escaped \\"quote' }] }),
      ).to.eql(
        `tag:"escaped \\\\\\"quote"`,
      );
    });

    test('the tags are sorted alphabetically in the search query for deterministic results', () => {
      expect(
        makeDocumentSearchQuery({
          tags: [
            { name: 'bbb' },
            { name: 'ccc' },
            { name: 'aaa' },
          ],
        }),
      ).to.eql('tag:aaa tag:bbb tag:ccc');
    });

    test('the text query is included in the search query', () => {
      expect(makeDocumentSearchQuery({ query: 'my search' })).to.eql('my search');
    });

    test('both tags and text query are included in the search query', () => {
      expect(
        makeDocumentSearchQuery({
          tags: [
            { name: 'invoices' },
            { id: 'tag_2222' },
          ],
          query: 'my search',
        }),
      ).to.eql('tag:invoices tag:tag_2222 my search');
    });
  });

  describe('makeDocumentSearchPermalink', () => {
    test('constructs a url-safe permalink for document search with search query', () => {
      const permalink = makeDocumentSearchPermalink({
        organizationId: 'org-123',
        search: {
          tags: [
            { name: 'invoices', id: 'tag_1111' },
            { name: 'receipts' },
            { id: 'tag_2222' },
          ],
          query: 'financial report',
        },
      });

      expect(permalink).to.eql('/organizations/org-123/documents?query=tag%3Ainvoices%20tag%3Areceipts%20tag%3Atag_2222%20financial%20report');
    });
  });
});
