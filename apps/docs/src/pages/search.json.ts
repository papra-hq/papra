import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { markdownToTxt } from 'markdown-to-txt';
import MiniSearch from 'minisearch';

function getRawContent(docsMarkdown: string | undefined) {
  return markdownToTxt(docsMarkdown ?? '').replace(/\s+/g, ' ');
}

export const GET: APIRoute = async () => {
  const docs = await getCollection('docs');

  const docsWithContent = docs.map(doc => ({
    ...doc.data,
    content: getRawContent(doc.body),
  }));

  const stopWords = new Set(['the', 'is', 'in', 'to', 'of', 'at', 'by', 'with', 'from', 'up', 'down', 'out', 'over', 'under', 'again', 'further', 'then', 'once', 'this', 'that', 'these', 'those', 'which', 'who', 'whom', 'whose', 'what', 'why', 'how', 'all', 'any', 'some', 'a', 'an', 'and', 'as', 'but', 'if', 'or', 'because', 'as', 'until', 'while']);

  const miniSearch = new MiniSearch({
    idField: 'slug',
    fields: ['title', 'description', 'content'],
    storeFields: ['title', 'description', 'slug'],
    searchOptions: { fuzzy: 0.2 },
    processTerm: term => term.toLowerCase().split(' ').filter(word => !stopWords.has(word)).join(' '),
  });

  miniSearch.addAll(docsWithContent);

  return new Response(
    JSON.stringify(miniSearch),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
};
