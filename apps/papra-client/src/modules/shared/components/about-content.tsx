import type { Component } from 'solid-js';
import { For, Show } from 'solid-js';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';
import { socials } from '../socials.constants';

export const AboutContent: Component = () => {
  const { t, formatDate, formatRelativeTime } = useI18n();
  const { config } = useConfig();

  const getShortCommitSha = () => {
    return config.gitCommitSha.substring(0, 7);
  };

  const getCommitUrl = () => {
    if (config.gitCommitSha === 'unknown') {
      return null;
    }
    return `https://github.com/papra-hq/papra/commit/${config.gitCommitSha}`;
  };

  const getVersionDetails = () => [
    {
      label: t('about.version'),
      value: config.version,
      icon: 'i-tabler-versions',
    },
    {
      label: t('about.git-commit'),
      icon: 'i-tabler-git-commit',
      url: getCommitUrl(),
      value: getShortCommitSha(),
    },
    {
      label: t('about.commit-date'),
      icon: 'i-tabler-calendar',
      value:
        config.gitCommitDate !== 'unknown'
          ? `${formatDate(config.gitCommitDate, { dateStyle: 'long' })} (${formatRelativeTime(config.gitCommitDate)})`
          : 'unknown',
    },
  ];

  const getLinks = () => [
    {
      label: t('about.links.documentation'),
      href: 'https://docs.papra.app',
      icon: 'i-tabler-book',
      description: t('about.links.documentation-description'),
    },
    {
      label: t('about.links.github'),
      href: 'https://github.com/papra-hq/papra',
      icon: 'i-tabler-brand-github',
      description: t('about.links.github-description'),
    },
    {
      label: t('about.links.discord'),
      href: 'https://papra.app/discord',
      icon: 'i-tabler-brand-discord',
      description: t('about.links.discord-description'),
    },
    {
      label: t('about.links.sponsor'),
      href: 'https://github.com/sponsors/papra-hq',
      icon: 'i-tabler-heart',
      description: t('about.links.sponsor-description'),
    },
  ];

  const getSocials = () => socials.map(social => ({ ...social, label: t(`socials.${social.id}`) }));

  return (
    <div class="flex flex-col gap-6">
      {/* Header */}
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-bold">{t('about.title')}</h2>
        <p class="text-muted-foreground">{t('about.description')}</p>
      </div>

      <div>
        <For each={getVersionDetails()}>
          {detail => (
            <div class="flex items-center gap-2 py-1">
              <div class={`${detail.icon} text-muted-foreground size-5`} />

              <span class="font-medium text-muted-foreground">
                {detail.label}
                :
              </span>
              <Show
                when={detail.url}
                fallback={<span class="font-semibold">{detail.value}</span>}
              >
                <a
                  href={detail.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:underline font-semibold hover:text-primary transition"
                >
                  {detail.value}
                </a>
              </Show>
            </div>
          )}
        </For>
      </div>

      <div class="flex flex-col gap-4">
        <h3 class="text-lg font-semibold">{t('about.links.title')}</h3>
        <div class="flex flex-col gap-3">
          <For each={getLinks()}>
            {link => (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <div class="flex items-center justify-center size-10 bg-accent rounded-lg">
                  <div class={`${link.icon} text-primary size-6`} />
                </div>
                <div class="flex flex-col">
                  <span class="font-semibold">{link.label}</span>
                  {link.description && (
                    <span class="text-sm text-muted-foreground">{link.description}</span>
                  )}
                </div>
                <div class="i-tabler-external-link ml-auto text-muted-foreground size-4" />
              </a>
            )}
          </For>
        </div>

        <div class="flex flex-wrap gap-4">
          <For each={getSocials()}>
            {social => (
              <Tooltip>
                <TooltipContent>
                  {social.label}
                </TooltipContent>
                <TooltipTrigger>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div class={`${social.icon} text-primary size-6`} />
                  </a>
                </TooltipTrigger>
              </Tooltip>
            )}
          </For>
        </div>
      </div>
    </div>
  );
};
