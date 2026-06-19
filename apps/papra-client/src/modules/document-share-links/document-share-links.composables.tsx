import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '../shared/confirm';
import { queryClient } from '../shared/query/query-client';
import { createToast } from '../ui/components/sonner';
import { deleteShareLink, updateShareLink } from './document-share-links.services';

export function invalidateShareLinksQueries({ organizationId }: { organizationId: string }) {
  return queryClient.invalidateQueries({
    queryKey: ['organizations', organizationId, 'share-links'],
  });
}

export function useCopyShareLink() {
  const { t } = useI18n();

  return {
    copyShareLink: async ({ url }: { url: string }) => {
      try {
        await navigator.clipboard.writeText(url);
        createToast({ type: 'success', message: t('document-share-links.copied') });
      } catch {
        createToast({ type: 'error', message: t('document-share-links.copy-error') });
      }
    },
  };
}

export function useToggleShareLink() {
  const { t } = useI18n();

  return {
    toggleShareLink: async ({
      organizationId,
      shareLinkId,
      isEnabled,
    }: {
      organizationId: string;
      shareLinkId: string;
      isEnabled: boolean;
    }) => {
      await updateShareLink({ organizationId, shareLinkId, isEnabled });
      await invalidateShareLinksQueries({ organizationId });
      createToast({
        type: 'success',
        message: isEnabled ? t('document-share-links.enabled') : t('document-share-links.disabled'),
      });
    },
  };
}

export function useDeleteShareLink() {
  const { confirm } = useConfirmModal();
  const { t } = useI18n();

  return {
    deleteShareLink: async ({
      organizationId,
      shareLinkId,
    }: {
      organizationId: string;
      shareLinkId: string;
    }): Promise<{ hasDeleted: boolean }> => {
      const isConfirmed = await confirm({
        title: t('document-share-links.delete.confirm.title'),
        message: t('document-share-links.delete.confirm.message'),
        confirmButton: {
          text: t('document-share-links.delete.confirm.confirm-button'),
          variant: 'destructive',
        },
        cancelButton: { text: t('document-share-links.delete.confirm.cancel-button') },
      });

      if (!isConfirmed) {
        return { hasDeleted: false };
      }

      await deleteShareLink({ organizationId, shareLinkId });
      await invalidateShareLinksQueries({ organizationId });
      createToast({ type: 'success', message: t('document-share-links.deleted') });

      return { hasDeleted: true };
    },
  };
}
