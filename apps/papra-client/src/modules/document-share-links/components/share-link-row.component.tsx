import type { Component } from 'solid-js';
import type { ShareLink } from '../document-share-links.types';
import { Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useCopy } from '@/modules/shared/utils/copy';
import { ShareLinkActions } from './share-link-actions.component';
import { ShareLinkStatus } from './share-link-status.component';

export const ShareLinkRow: Component<{ shareLink: ShareLink }> = (props) => {
  const { t, formatDate } = useI18n();
  const { copy, getIsJustCopied } = useCopy();

  return (
    <div class="flex items-center gap-2 border rounded-md p-3">
      <div class="flex-1 min-w-0">
        <button
          type="button"
          class="group flex items-center gap-2 min-w-0 max-w-full cursor-pointer text-left text-muted-foreground transition hover:text-foreground"
          onClick={() => copy({ text: props.shareLink.url })}
          title={t('document-share-links.copy')}
        >
          <span class="truncate text-sm font-mono min-w-0">{props.shareLink.url}</span>
          <div
            class="size-4 flex-shrink-0 opacity-0 transition group-hover:opacity-100"
            classList={{ 'i-tabler-check text-green opacity-100': getIsJustCopied(), 'i-tabler-copy': !getIsJustCopied() }}
          />
        </button>
        <div class="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <ShareLinkStatus shareLink={props.shareLink} />

          <span>{props.shareLink.isPasswordProtected ? t('document-share-links.password-protected') : t('document-share-links.no-password')}</span>
          <span>-</span>
          <Show when={props.shareLink.expiresAt} fallback={t('document-share-links.never-expires')}>
            {getExpiresAt => t('document-share-links.expires-on', { date: formatDate(getExpiresAt()) })}
          </Show>
        </div>
      </div>

      <ShareLinkActions shareLink={props.shareLink} withGoToDocument={false} />
    </div>
  );
};
