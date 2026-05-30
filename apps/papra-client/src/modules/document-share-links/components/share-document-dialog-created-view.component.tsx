import type { Component } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useCopy } from '@/modules/shared/utils/copy';
import { Button } from '@/modules/ui/components/button';
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/modules/ui/components/dialog';

export const ShareDocumentDialogCreatedView: Component<{
  url: string;
  onDone: () => void;
}> = (props) => {
  const { t } = useI18n();
  const { copy, getIsJustCopied } = useCopy();

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('document-share-links.created.title')}</DialogTitle>
        <DialogDescription>{t('document-share-links.created.description')}</DialogDescription>
      </DialogHeader>

      <div class="flex items-center gap-2 border rounded-md p-3 min-w-0">
        <span class="flex-1 truncate text-sm font-mono min-w-0">{props.url}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => copy({ text: props.url })}>
          <div
            class="size-4 mr-2"
            classList={{ 'i-tabler-check text-green': getIsJustCopied(), 'i-tabler-copy': !getIsJustCopied() }}
          />
          {t('document-share-links.copy')}
        </Button>
      </div>

      <DialogFooter>
        <Button onClick={props.onDone}>
          {t('document-share-links.created.done')}
        </Button>
      </DialogFooter>
    </>
  );
};
