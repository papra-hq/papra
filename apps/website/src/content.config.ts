import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    homepageCallout: z
      .object({
        title: z.string(),
        description: z.string(),
      })
      .optional(),
    lang: z.enum(['en']).optional(),
    ogImage: z.string().optional(),
    coverImage: z.string().optional(),
  }),
});

const docs = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
  }),
});

export const collections = { blog, docs };
