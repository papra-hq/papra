import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const getDocsSections = (): Promise<{ label: string; items: { label: string; url: string; description: string }[] }[]> => fetch('https://docs.papra.app/docs-navigation.json').then(res => res.json());

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('blog');
  const getBlogPostUrl = (slug: string) => new URL(`blog/${slug}`, site).href;

  const docsSections = await getDocsSections();

  const llmTxt = `
# Papra

> Papra is a minimalistic document management and archiving platform. It is designed to be simple to use and accessible to everyone. Papra is a platform for long-term document storage and management, like a digital archive for your documents.

## Blog Posts

${posts.map(post => `- [${post.data.title}](${getBlogPostUrl(post.slug)}): ${post.data.description}`).join('\n')}

## Assets

- [Papra Documentation](https://docs.papra.app): The self-hosting documentation for Papra.
- [Papra GitHub](https://github.com/papra-hq/papra): The source code for Papra.
- [Papra Discord](https://papra.app/discord): The official Discord server for Papra.
- [Bluesky account](https://bsky.app/profile/papra.app): The official Bluesky account for Papra @papra.app.
- [Mastodon account](https://mastodon.social/@papra): The official Mastodon account for Papra @papra@mastodon.social.
- [X / Twitter account](https://x.com/papra_app): The official X account for Papra @papra_app.
- [Support the project](https://buymeacoffee.com/cthmsst): Support the project by sponsoring the developer.
- [Contact](https://papra.app/contact): Contact the development team.

## Legal

- [Privacy Policy](https://papra.app/privacy): The privacy policy for Papra.
- [Terms of Service](https://papra.app/terms-of-service): The terms of service for Papra.

## Docs

${docsSections.map(section => `### ${section.label}\n\n${section.items.map(item => `- [${item.label}](${item.url}): ${item.description ?? item.label}`).join('\n')}`).join('\n\n')} 
`.trim();

  return new Response(llmTxt);
};
