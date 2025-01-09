import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

export const docsCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
  }),
});

export const collections = { docs: docsCollection };
