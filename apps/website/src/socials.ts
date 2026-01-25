import type { Translator } from './i18n/i18n';
import { useI18n } from './i18n/i18n';

export const GITHUB_REPO_URL = 'https://github.com/papra-hq/papra';
export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;
export const DISCORD_INVITE_URL = 'https://papra.app/discord';

export function getSocials({
  t = useI18n().t,
}: {
  t?: Translator;
} = {}) {
  return [
    {
      id: 'github',
      name: t('socials.github.name'),
      label: t('socials.github.label'),
      url: GITHUB_REPO_URL,
      icon: 'i-tabler-brand-github',
      inHeader: true,
    },
    {
      id: 'discord',
      name: t('socials.discord.name'),
      label: t('socials.discord.label'),
      url: DISCORD_INVITE_URL,
      icon: 'i-tabler-brand-discord',
      inHeader: true,
    },
    {
      id: 'bluesky',
      name: t('socials.bluesky.name'),
      label: t('socials.bluesky.label'),
      url: 'https://bsky.app/profile/papra.app',
      icon: 'i-tabler-brand-bluesky',
      inHeader: true,
    },
    {
      id: 'mastodon',
      name: t('socials.mastodon.name'),
      label: t('socials.mastodon.label'),
      url: 'https://mastodon.social/@papra',
      icon: 'i-tabler-brand-mastodon',
      inHeader: true,
    },
    {
      id: 'x',
      name: t('socials.x.name'),
      label: t('socials.x.label'),
      url: 'https://x.com/papra_app',
      icon: 'i-tabler-brand-x',
      inHeader: true,
    },
    {
      id: 'reddit',
      name: t('socials.reddit.name'),
      label: t('socials.reddit.label'),
      url: 'https://www.reddit.com/r/Papra/',
      icon: 'i-tabler-brand-reddit',
      inHeader: false,
    },
    {
      id: 'linkedin',
      name: t('socials.linkedin.name'),
      label: t('socials.linkedin.label'),
      url: 'https://www.linkedin.com/company/papra-hq',
      icon: 'i-tabler-brand-linkedin',
      inHeader: false,
    },
  ];
}
