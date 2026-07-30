import { describe, expect, test } from 'vitest';
import {
  buildAutoNamingSystemPrompt,
  buildAutoNamingUserPrompt,
  getTitleAction,
} from './auto-naming.models';

describe('auto-naming.models', () => {
  describe('buildAutoNamingSystemPrompt', () => {
    test('returns the auto-naming system instructions', () => {
      expect(buildAutoNamingSystemPrompt({ maxTitleLength: 120 })).toMatchInlineSnapshot(`
        "You are an assistant that generates a concise, descriptive title for a document based on its content.

        Instructions:
        - Produce a short, human-readable title (3-10 words) that clearly identifies the document.
        - Include key identifiers when present: document type (invoice, contract, receipt, letter), issuer or company name, and date or period.
        - Examples: "Invoice - Acme Corp - March 2026", "Employment Contract - Jane Doe", "Electricity Bill - Q1 2026".
        - The title must not exceed 120 characters.
        - Do not include a file extension, surrounding quotes, or trailing punctuation.
        - Write the title in the same language as the document content.
        - If the current document name already looks meaningful and descriptive, you may refine it rather than replace it."
      `);
    });
  });

  describe('buildAutoNamingUserPrompt', () => {
    test('the document name and content are simply inlined', () => {
      expect(
        buildAutoNamingUserPrompt({
          document: {
            name: 'scan.pdf',
            content: 'Invoice from Acme Corp for March 2026',
          },
          maxContentLength: 20_000,
        }),
      ).toMatchInlineSnapshot(`
        "Current document name: scan.pdf
        Document content:
        Invoice from Acme Corp for March 2026"
      `);
    });

    test('truncates document content to the configured maximum length', () => {
      expect(
        buildAutoNamingUserPrompt({
          document: {
            name: 'scan.pdf',
            content: 'Invoice from Acme Corp for March 2026',
          },
          maxContentLength: 12,
        }),
      ).toMatchInlineSnapshot(`
        "Current document name: scan.pdf
        Document content:
        Invoice from"
      `);
    });
  });

  describe('getTitleAction', () => {
    test('sanitizes and truncates the generated title', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: 'Invoice\nAcme Corp.' },
          currentName: 'scan.pdf',
          maxTitleLength: 12,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice Acme' });
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
      ).to.eql({ shouldRename: true, title: 'Invoice - Acme  Corp' });
    });

    test('leading and trailing quotes are stripped from the generated title', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: '"Invoice - Acme Corp"' },
          currentName: 'scan.pdf',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice - Acme Corp' });
    });

    test('whitespace around a quoted title is trimmed before stripping quotes', () => {
      expect(
        getTitleAction({
          autoNamingResponse: { title: '  "Invoice - Acme Corp" ' },
          currentName: 'scan.pdf',
          maxTitleLength: 120,
        }),
      ).to.eql({ shouldRename: true, title: 'Invoice - Acme Corp' });
    });
  });
});
