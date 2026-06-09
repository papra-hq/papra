import type { Component } from 'solid-js';
import type { ShareLink } from '../document-share-links.types';
import { Match, Switch } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';

type ShareLinkStatusType = 'trashed' | 'expired' | 'enabled' | 'disabled';
type ShareLinkStatusProps =
  | {
      shareLink: ShareLink;
    }
  | {
      status: ShareLinkStatusType;
    };

export function getShareLinkStatus({ shareLink }: { shareLink: ShareLink }): ShareLinkStatusType {
  // A trashed document makes the link unusable (410) regardless of its own enabled/expiry state.
  if (shareLink.isDocumentDeleted) {
    return 'trashed';
  }

  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    return 'expired';
  }

  return shareLink.isEnabled ? 'enabled' : 'disabled';
}

export const ShareLinkStatus: Component<ShareLinkStatusProps> = (props) => {
  const { t } = useI18n();
  const getStatus = () =>
    'shareLink' in props ? getShareLinkStatus({ shareLink: props.shareLink }) : props.status;

  return (
    <Switch>
      <Match when={getStatus() === 'trashed'}>
        <span
          class="rounded-full bg-red/10 text-red px-2 py-0.5 text-xs font-medium border border-red/20 inline-flex items-center gap-2 lh-tight"
          title={t('document-share-links.management.status.trashed-hint')}
        >
          <div class="i-tabler-trash size-3" />
          {t('document-share-links.management.status.trashed')}
        </span>
      </Match>
      <Match when={getStatus() === 'expired'}>
        <span class="rounded-full bg-warning/10 text-warning px-2 py-0.5 text-xs font-medium border border-warning/20 inline-flex items-center gap-2 lh-tight">
          <div class="size-1 bg-current rounded-full" />
          {t('document-share-links.management.status.expired')}
        </span>
      </Match>
      <Match when={getStatus() === 'enabled'}>
        <span class="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium border border-primary/20 inline-flex items-center gap-2 lh-tight">
          <div class="size-1 bg-current rounded-full" />
          {t('document-share-links.management.status.enabled')}
        </span>
      </Match>
      <Match when={getStatus() === 'disabled'}>
        <span class="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-medium border border-muted-foreground/20 inline-flex items-center gap-2 lh-tight">
          <div class="size-1 bg-current rounded-full" />
          {t('document-share-links.management.status.disabled')}
        </span>
      </Match>
    </Switch>
  );
};
