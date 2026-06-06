import type { Component } from 'solid-js';
import { formatBytes } from '@corentinth/chisels';
import { A, useParams } from '@solidjs/router';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { createSignal, Match, Show, Switch } from 'solid-js';
import { DocumentBlobPreview } from '@/modules/documents/components/document-preview.component';
import { getDocumentIcon } from '@/modules/documents/document.models';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useAboutDialog } from '@/modules/shared/components/about-dialog';
import { downloadFile } from '@/modules/shared/files/download';
import { isHttpErrorWithStatusCode } from '@/modules/shared/http/http-errors';
import { cn } from '@/modules/shared/style/cn';
import { ThemeSwitcher } from '@/modules/theme/theme-switcher.component';
import { Button } from '@/modules/ui/components/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/modules/ui/components/dropdown-menu';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { LanguageSwitcher } from '@/modules/ui/layouts/sidenav.layout';
import { fetchSharedDocument, fetchSharedDocumentFile, verifySharePassword } from '../document-share-links.services';

function isPreviewable(mimeType: string) {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

const PasswordGate: Component<{ token: string; onUnlocked: (args: { accessToken: string }) => void }> = (props) => {
  const { t } = useI18n();
  const [getPassword, setPassword] = createSignal('');

  const verifyMutation = useMutation(() => ({
    mutationFn: () => verifySharePassword({ token: props.token, password: getPassword() }),
    onSuccess: ({ accessToken }) => props.onUnlocked({ accessToken }),
    onError: (error) => {
      const message = isHttpErrorWithStatusCode({ error, statusCode: 429 })
        ? t('document-share-links.public.password.too-many-attempts')
        : t('document-share-links.public.password.invalid');

      createToast({ type: 'error', message });
    },
  }));

  return (
    <div class="flex flex-col gap-4 max-w-lg mx-auto my-6 md:my-24 px-6">
      <div class="flex flex-col items-center gap-2 text-center">
        <div class="i-tabler-lock size-8 text-muted-foreground" />
        <h1 class="text-lg font-semibold">{t('document-share-links.public.password.title')}</h1>
        <p class="text-sm text-muted-foreground">{t('document-share-links.public.password.description')}</p>
      </div>

      <form
        class="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          verifyMutation.mutate();
        }}
      >
        <TextFieldRoot class="flex flex-col gap-1">
          <TextFieldLabel class="sr-only" for="share-password">{t('document-share-links.public.password.label')}</TextFieldLabel>
          <TextField type="password" id="share-password" autofocus autocomplete="current-password" placeholder={t('document-share-links.public.password.placeholder')} value={getPassword()} onInput={e => setPassword(e.currentTarget.value)} />
        </TextFieldRoot>

        <Button type="submit" isLoading={verifyMutation.isPending} disabled={getPassword() === ''}>
          {t('document-share-links.public.password.submit')}
        </Button>
      </form>
    </div>
  );
};

const SharedDocumentCard: Component<{ token: string; accessToken: string | undefined; document: { name: string; size: number; mimeType: string } }> = (props) => {
  const { t } = useI18n();

  const downloadMutation = useMutation(() => ({
    mutationFn: () => fetchSharedDocumentFile({ token: props.token, accessToken: props.accessToken }),
    onSuccess: ({ blob }) => {
      const url = URL.createObjectURL(blob);
      downloadFile({ url, fileName: props.document.name });
      URL.revokeObjectURL(url);
    },
    onError: () => createToast({ type: 'error', message: t('document-share-links.public.download-error') }),
  }));

  const previewQuery = useQuery(() => ({
    queryKey: ['share-link', props.token, 'file', props.accessToken],
    queryFn: () => fetchSharedDocumentFile({ token: props.token, accessToken: props.accessToken }),
    enabled: isPreviewable(props.document.mimeType),
    retry: false,
    refetchOnWindowFocus: false,
  }));

  return (
    <div>
      <div class="flex flex-col md:flex-row items-center gap-2 md:gap-4 max-w-5xl px-6 w-full mx-auto py-12 border-b">

        <div class="bg-muted flex items-center justify-center size-12 rounded-lg shrink-0">
          <div
            class={cn(
              getDocumentIcon({ document: props.document }),
              'size-7 text-primary',
            )}
          />
        </div>

        <div class="text-center md:text-left">
          <h1 class="text-xl font-semibold break-all">{props.document.name}</h1>
          <p class="text-sm text-muted-foreground">
            {formatBytes({ bytes: props.document.size, base: 1000 })}
          </p>
        </div>

        <div class="md:ml-auto">
          <Button onClick={() => downloadMutation.mutate()} isLoading={downloadMutation.isPending}>
            <div class="i-tabler-download size-4 mr-2" />
            {t('document-share-links.public.download')}
          </Button>
        </div>
      </div>

      <div class="p-6 flex justify-center max-w-5xl mx-auto w-full">
        <Show
          when={previewQuery.data?.blob}
        >
          {getBlob => (
            <div class="rounded-md overflow-hidden w-full min-h-1200px">
              <DocumentBlobPreview blob={getBlob()} mimeType={props.document.mimeType} />
            </div>
          )}
        </Show>
      </div>

    </div>
  );
};

const StatusMessage: Component<{ icon: string; title: string; description: string }> = props => (
  <div class="flex flex-col items-center gap-2 text-center mt-12 px-6">
    <div class={`${props.icon} size-8 text-muted-foreground`} />
    <h1 class="text-lg font-semibold">{props.title}</h1>
    <p class="text-sm text-muted-foreground">{props.description}</p>
  </div>
);

export const SharedDocumentPage: Component = () => {
  const { t } = useI18n();
  const params = useParams();
  const [getAccessToken, setAccessToken] = createSignal<string | undefined>(undefined);
  const aboutDialog = useAboutDialog();

  const documentQuery = useQuery(() => ({
    queryKey: ['share-link', params.token, getAccessToken()],
    queryFn: () => fetchSharedDocument({ token: params.token, accessToken: getAccessToken() }),
    retry: false,
  }));

  return (
    <div>

      <div class="border-b">
        <div class="px-6 py-4 flex items-center justify-between gap-2 max-w-5xl mx-auto">
          <A href="/" class="group text-base text-muted-foreground flex gap-2 font-semibold hover:text-foreground transition">
            <div class="i-tabler-file-text size-6 text-primary transform rotate-12deg group-hover:rotate-25deg transition" />

            Papra
          </A>

          <div class="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger as={Button} variant="outline" aria-label="User menu" size="icon">
                <div class="i-tabler-dots size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent class="min-w-48">

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger class="flex items-center gap-2 cursor-pointer">
                    <div class="i-tabler-language size-4 text-muted-foreground" />
                    {t('user-menu.language')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent class="min-w-48">
                    <LanguageSwitcher />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger class="flex items-center gap-2 cursor-pointer">
                    <div class="i-tabler-sun-moon size-4 text-muted-foreground" />
                    {t('user-menu.theme')}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent class="min-w-48">
                    <ThemeSwitcher />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem
                  onClick={() => aboutDialog.open()}
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <div class="i-tabler-info-circle size-4 text-muted-foreground" />
                  {t('user-menu.about')}
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>

      <Switch>
        <Match when={documentQuery.isPending}>
          <div class="flex justify-center py-8">
            <div class="i-tabler-loader-2 size-6 animate-spin text-muted-foreground" />
          </div>
        </Match>

        <Match when={documentQuery.isSuccess}>
          <SharedDocumentCard token={params.token} accessToken={getAccessToken()} document={documentQuery.data!.document} />
        </Match>

        <Match when={documentQuery.isError && isHttpErrorWithStatusCode({ error: documentQuery.error, statusCode: 401 })}>
          <PasswordGate token={params.token} onUnlocked={({ accessToken }) => setAccessToken(accessToken)} />
        </Match>

        <Match when={documentQuery.isError && isHttpErrorWithStatusCode({ error: documentQuery.error, statusCode: 410 })}>
          <StatusMessage icon="i-tabler-link-off" title={t('document-share-links.public.gone.title')} description={t('document-share-links.public.gone.description')} />
        </Match>

        <Match when={documentQuery.isError}>
          <StatusMessage icon="i-tabler-file-off" title={t('document-share-links.public.not-found.title')} description={t('document-share-links.public.not-found.description')} />
        </Match>
      </Switch>
    </div>
  );
};
