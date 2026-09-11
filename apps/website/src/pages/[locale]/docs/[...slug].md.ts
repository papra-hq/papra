import type { APIRoute, InferGetStaticPropsType } from 'astro';
import { getCollection } from 'astro:content';
import { getDocStaticPaths } from '../../../docs/docs.models';
import { formatDocMarkdown } from '../../../docs/docs.markdown';

export async function getStaticPaths() {
  return getDocStaticPaths(await getCollection('docs'));
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = ({ props: { entry } }) =>
  new Response(formatDocMarkdown(entry), {
    // Display the source in browsers instead of downloading an unknown MIME type.
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
