import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import * as pagefind from 'pagefind';

function assertSuccess({ errors }: { errors: string[] }) {
  if (errors.length > 0) {
    throw new Error(`Pagefind: ${errors.join('\n')}`);
  }
}

export default function docsSearch(): AstroIntegration {
  return {
    name: 'docs-search',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        try {
          const response = await pagefind.createIndex();
          assertSuccess(response);
          const { index } = response;
          if (!index) {
            throw new Error('Pagefind did not create an index');
          }

          // Use Astro's final asset directory (dist/client with Cloudflare),
          // keeping the site root so result URLs retain their /<locale>/docs prefix.
          const indexed = await index.addDirectory({
            path: fileURLToPath(dir),
            glob: '*/docs/**/*.html',
          });
          assertSuccess(indexed);
          assertSuccess(
            await index.writeFiles({
              outputPath: fileURLToPath(new URL('pagefind/', dir)),
            }),
          );
          logger.info(`Indexed ${indexed.page_count} documentation pages`);
        } finally {
          await pagefind.close();
        }
      },
    },
  };
}
