import { describe, expect, test } from 'vitest';
import { getTitleAction } from './auto-naming.models';

describe('auto-naming.models', () => {
  describe('getTitleAction', () => {
    test('sanitizes and truncates the generated title', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: 'Invoice\nAcme Corp.' },
          currentName: 'scan.pdf',
          maxTitleLength: 12,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice Acme.pdf' });
    });

    test('does not rename when the generated title is empty', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: '   ' },
          currentName: 'scan.pdf',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: false, title: '' });
    });

    test('does not rename when the generated title matches the current name', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: 'Invoice - Acme Corp' },
          currentName: 'Invoice - Acme Corp',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: false, title: 'Invoice - Acme Corp' });
    });

    test('does not rename when the AI returns a non-string title', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: 123 as unknown as string },
          currentName: 'scan.pdf',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: false, title: '' });
    });

    test('control characters are stripped from the generated title', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: 'Invoice\u0000-\tAcme\u001F Corp' },
          currentName: 'scan.pdf',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice - Acme  Corp.pdf' });
    });

    test('leading and trailing quotes are stripped from the generated title', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: '"Invoice - Acme Corp"' },
          currentName: 'scan.pdf',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice - Acme Corp.pdf' });
    });

    test('whitespace around a quoted title is trimmed before stripping quotes', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: '  "Invoice - Acme Corp" ' },
          currentName: 'scan.pdf',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice - Acme Corp.pdf' });
    });

    test('the extension of the current name is kept so downloads keep their file type', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: 'Invoice - Acme Corp' },
          currentName: 'SCAN_0001.PDF',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice - Acme Corp.PDF' });
    });

    test('the extension is not duplicated when the AI already included it', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: 'Invoice - Acme Corp.pdf' },
          currentName: 'scan.pdf',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice - Acme Corp.pdf' });
    });

    test('when the current name has no extension, the extension of the original file name is used', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: 'Invoice - Acme Corp - March 2026' },
          currentName: 'Invoice - Acme Corp',
          originalName: 'scan.pdf',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice - Acme Corp - March 2026.pdf' });
    });

    test('no extension is added when neither the current nor the original name has one', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: 'Invoice - Acme Corp' },
          currentName: 'scan',
          originalName: 'scan',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice - Acme Corp' });

      expect(
        getTitleAction({
          autoNamingResponse: { title: 'Invoice - Acme Corp' },
          currentName: '.scan',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice - Acme Corp' });
    });

    test('the title is truncated so the name with its extension fits the 255 characters limit', () => {
      const { title } = getTitleAction({
        autoNamingResponse: { title: 'a'.repeat(300) },
        currentName: 'scan.pdf',
        maxTitleLength: 255,
      });

      expect(title).to.eql(`${'a'.repeat(251)}.pdf`);
    });

    test('does not rename when the generated title is only the extension', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: '.pdf' },
          currentName: 'scan.pdf',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: false, title: '' });
    });
  });
});
