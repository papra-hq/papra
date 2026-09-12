import type { APIRoute, InferGetStaticPropsType } from 'astro';
import { getCollection } from 'astro:content';
import { formatDocMarkdown } from '../../docs/docs.markdown';
import { getDocStaticPaths } from '../../docs/docs.models';

export async function getStaticPaths() {
  return getDocStaticPaths(await getCollection('docs'))
    .filter(({ props }) => props.docId === 'index')
    .map(({ params: { locale }, props }) => ({ params: { locale }, props }));
}

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = ({ props: { entry } }) =>
  new Response(formatDocMarkdown(entry), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
