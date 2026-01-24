import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    homepageCallout: z.object({
      title: z.string(),
      description: z.string(),
    }).optional(),
    lang: z.enum(['en']).optional(),
    ogImage: z.string().optional(),
    coverImage: z.string().optional(),
  }),
});

export const collections = { blog };
