import { describe, expect, test } from 'vitest';
import { formatDocMarkdown } from './docs.markdown';

describe('docs.markdown', () => {
  describe('formatDocMarkdown', () => {
    test('appends the title as a markdown heading and the body below it', () => {
      expect(
        formatDocMarkdown({
          body: 'Lorem ipsum',
          data: { title: 'Title' },
        }),
      ).to.eql('# Title\n\nLorem ipsum');
    });

    test('trims the body', () => {
      expect(
        formatDocMarkdown({
          body: '  Lorem ipsum \n\t ',
          data: { title: 'Title' },
        }),
      ).to.eql('# Title\n\nLorem ipsum');
    });

    test.each(["'", '"'])('preserves quoted content after imports using %s', (quote) => {
      const content = `Use "Tabs" for navigation and don't remove this text.`;

      expect(
        formatDocMarkdown({
          body: `import Tabs from ${quote}./Tabs.astro${quote}\n\n${content}`,
          data: { title: 'Title' },
        }),
      ).to.eql(`# Title\n\n${content}`);
    });

    test('preserves inline mentions of imports', () => {
      const body = `You can import { Tabs } from './Tabs.astro';\nMore content.`;

      expect(formatDocMarkdown({ body, data: { title: 'Title' } })).to.eql(`# Title\n\n${body}`);
    });

    test('removes imports with trailing whitespace and CRLF line endings', () => {
      expect(
        formatDocMarkdown({
          body: `Before\r\n\r\nimport Tabs from './Tabs.astro'; \t\r\nAfter`,
          data: { title: 'Title' },
        }),
      ).to.eql('# Title\n\nBefore\r\n\r\nAfter');
    });

    test('removes imports from the body', () => {
      expect(
        formatDocMarkdown({
          body: `
import Steps from './Steps.astro';

Some content

import { Button } from './Button.astro';
import { Link } from './Link.astro';
Lorem ipsum

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from './Card.astro';

Stuff

          `,
          data: { title: 'Title' },
        }),
      ).to.eql('# Title\n\nSome content\n\nLorem ipsum\n\nStuff');
    });
  });
});
