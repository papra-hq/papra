import { icons as tablerIconSet } from '@iconify-json/tabler';
import { describe, expect, test } from 'vitest';
import { getDaysBeforePermanentDeletion, getDocumentIcon, getDocumentNameExtension, getDocumentNameWithoutExtension, iconByFileType } from './document.models';

describe('files models', () => {
  describe('iconByFileType', () => {
    const icons = Object.values(iconByFileType);

    test('they must at least have the default icon', () => {
      expect(iconByFileType['*']).toBeDefined();
    });

    test('all the icons should be from tabler icon set', () => {
      for (const icon of icons) {
        expect(icon).to.match(/^i-tabler-/, `Icon ${icon} is not from tabler icon set`);
      }
    });

    test('icons should not contain any spaces', () => {
      for (const icon of icons) {
        expect(icon).not.to.match(/\s/, `Icon ${icon} contains spaces`);
      }
    });

    test('the icons used for showing file types should exists with current iconify configuration', () => {
      for (const icon of icons) {
        const iconName = icon.replace('i-tabler-', '');
        const iconData = tablerIconSet.icons[iconName] ?? tablerIconSet.aliases?.[iconName];

        expect(iconData).to.not.eql(undefined, `Icon ${icon} does not exist in tabler icon set`);
      }
    });
  });

  describe('getFileIcon', () => {
    test('a file icon is selected based on the file type', () => {
      const document = { mimeType: 'text/plain' };
      const iconsMap = {
        '*': 'i-tabler-file',
        'text/plain': 'i-tabler-file-text',
      };
      const icon = getDocumentIcon({ document, iconsMap });

      expect(icon).to.eql('i-tabler-file-text');
    });

    test('if a file type is not associated with an icon, the default icon is used', () => {
      const document = { mimeType: 'text/html' };
      const iconsMap = {
        '*': 'i-tabler-file',
        'text/plain': 'i-tabler-file-text',
      };
      const icon = getDocumentIcon({ document, iconsMap });

      expect(icon).to.eql('i-tabler-file');
    });

    test('a file icon can be selected based on the file type group', () => {
      const document = { mimeType: 'text/html' };
      const iconsMap = {
        '*': 'i-tabler-file',
        'text': 'i-tabler-file-text',
      };
      const icon = getDocumentIcon({ document, iconsMap });

      expect(icon).to.eql('i-tabler-file-text');
    });

    test('when an icon is defined for both the whole type and the group type, the file type icon is used', () => {
      const document = { mimeType: 'text/html' };
      const iconsMap = {
        '*': 'i-tabler-file',
        'text': 'i-tabler-file-text',
        'text/html': 'i-tabler-file-type-html',
      };
      const icon = getDocumentIcon({ document, iconsMap });

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
});
