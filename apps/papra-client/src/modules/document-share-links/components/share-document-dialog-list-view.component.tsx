import type { Component } from 'solid-js';
import type { ShareLink } from '../document-share-links.types';
import { For } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/ui/components/dialog';
import { ShareLinkRow } from './share-link-row.component';

export const ShareDocumentDialogListView: Component<{
  shareLinks: ShareLink[];
  documentName: string;
  onCreateNew: () => void;
}> = (props) => {
  const { t } = useI18n();

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('document-share-links.list.title')}</DialogTitle>
        <DialogDescription>
          {t('document-share-links.list.description', { name: props.documentName })}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-2 max-h-72 overflow-y-auto min-w-0">
        <For each={props.shareLinks}>{(shareLink) => <ShareLinkRow shareLink={shareLink} />}</For>
      </div>

      <DialogFooter>
        <Button onClick={props.onCreateNew}>
          <div class="i-tabler-plus size-4 mr-2" />
          {t('document-share-links.list.create-new')}
        </Button>
      </DialogFooter>
    </>
  );
};
