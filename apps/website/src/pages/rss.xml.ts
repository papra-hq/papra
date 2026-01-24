import type { APIRoute } from 'astro';
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

function sortPosts<T extends { data: { publishedAt: Date } }>(posts: T[]) {
  return posts.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

function formatDate(date: Date) {
  date.setUTCHours(0);
  return date;
}

export const GET: APIRoute = async (context) => {
  const unsortedPosts = await getCollection('blog');
  const posts = sortPosts(unsortedPosts);

  return rss({
    title: 'Papra Blog',
    description: 'News and updates about Papra.',
    site: context.site!.href,
    items: posts.map(item => ({
      title: item.data.title,
      description: item.data.description,
      link: `/blog/${item.slug}/`,
      pubDate: formatDate(item.data.publishedAt),
    })),
  });
};
