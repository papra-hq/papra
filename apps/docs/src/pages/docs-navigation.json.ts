import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sidebar } from '../content/navigation';

export const GET: APIRoute = async ({ site }) => {
  const docs = await getCollection('docs');

  const sections = sidebar.map((section) => {
    return {
      label: section.label,
      items: section
        .items
        .filter(item => item.slug !== undefined || (item.link && !item.link.startsWith('http')))
        .map((item) => {
          const slug = item.slug ?? item.link?.replace(/^\//, '');

          return {
            label: item.label,
            slug,
            url: new URL(slug, site).toString(),
            description: docs.find(doc => (doc.id === slug || (slug === '' && doc.id === 'index')))?.data.description,
          };
        }),
    };
  });

  return new Response(JSON.stringify(sections));
};
