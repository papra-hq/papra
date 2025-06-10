import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { sidebar } from '../content/navigation';

export const GET: APIRoute = async ({ site }) => {
  const docs = await getCollection('docs');

  const sections = sidebar.map((section) => {
    return {
      label: section.label,
      items: section.items.map((item) => {
        return {
          ...item,
          url: new URL(item.slug ?? '', site).toString(),
          description: docs.find(doc => (doc.id === item.slug || (item.slug === '' && doc.id === 'index')))?.data.description,
        };
      }),
    };
  });

  return new Response(JSON.stringify(sections));
};
