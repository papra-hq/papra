import type { Component, ParentComponent } from 'solid-js';
import { A, useParams } from '@solidjs/router';
import { For, Show, Suspense } from 'solid-js';

import { useCommandPalette } from '@/modules/command-palette/command-palette.provider';

import { useDocumentUpload } from '@/modules/documents/components/document-import-status.component';
import { GlobalDropArea } from '@/modules/documents/components/global-drop-area.component';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { AboutDialog, useAboutDialog } from '@/modules/shared/components/about-dialog';
import { UsageWarningCard } from '@/modules/subscriptions/components/usage-warning-card';
import { useThemeStore } from '@/modules/theme/theme.store';
import { Button } from '@/modules/ui/components/button';
import { UserSettingsDropdown } from '@/modules/users/components/user-settings.component';
import { useCurrentUser } from '@/modules/users/composables/useCurrentUser';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '../components/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../components/sheet';

export const ThemeSwitcher: Component = () => {
  const themeStore = useThemeStore();
  const { t } = useI18n();

  return (
    <>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'light' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-sun text-lg" />
        {t('layout.theme.light')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'dark' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-moon text-lg" />
        {t('layout.theme.dark')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'system' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-device-laptop text-lg" />
        {t('layout.theme.system')}
      </DropdownMenuItem>
    </>
  );
};

export const LanguageSwitcher: Component = () => {
  const { getLocale, setLocale, locales } = useI18n();
  const languageName = new Intl.DisplayNames(getLocale(), {
    type: 'language',
    languageDisplay: 'standard',
  });

  return (
    <DropdownMenuRadioGroup value={getLocale()} onChange={setLocale}>
      <For each={locales}>
        {locale => (
          <DropdownMenuRadioItem value={locale.key} disabled={getLocale() === locale.key}>
            <span translate="no" lang={getLocale() === locale.key ? undefined : locale.key}>
              {locale.name}
            </span>
            <Show when={getLocale() !== locale.key}>
              <span class="text-muted-foreground pl-1">
                (
                {languageName.of(locale.key)}
                )
              </span>
            </Show>
          </DropdownMenuRadioItem>
        )}
      </For>
    </DropdownMenuRadioGroup>
  );
};

export const SidenavLayout: ParentComponent<{
  sideNav: Component;
  showSearch?: boolean;
}> = (props) => {
  const themeStore = useThemeStore();
  const params = useParams();
  const { openCommandPalette } = useCommandPalette();
  const { t } = useI18n();
  const { hasPermission } = useCurrentUser();
  const aboutDialog = useAboutDialog();

  const { promptImport, uploadDocuments } = useDocumentUpload();

  return (
    <div class="flex flex-row h-screen min-h-0">
      <div class="w-280px border-r border-r-border flex-shrink-0 hidden md:block bg-card overflow-y-auto">
        <props.sideNav />

      </div>

      <div class="flex-1 min-h-0 flex flex-col">
        <UsageWarningCard organizationId={params.organizationId} />

        <div class="flex justify-between px-6 pt-4">

          <div class="flex items-center">
            <Sheet>
              <SheetTrigger>
                <Button variant="ghost" size="icon" class="md:hidden mr-2">
                  <div class="i-tabler-menu-2 size-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" class="bg-card p-0! overflow-y-auto">
                <props.sideNav />
              </SheetContent>
            </Sheet>

            {(props.showSearch ?? true) && (
              <Button variant="outline" class="lg:min-w-64  justify-start" onClick={openCommandPalette}>
                <div class="i-tabler-search size-4 mr-2" />
                {t('layout.search.placeholder')}
              </Button>
            )}
          </div>

          <div class="flex items-center gap-2">

            <GlobalDropArea onFilesDrop={uploadDocuments} />
            <Button onClick={promptImport}>
              <div class="i-tabler-upload size-4" />
              <span class="hidden sm:inline ml-2">
                {t('layout.menu.import-document')}
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger as={Button} class="text-base hidden sm:flex" variant="outline" aria-label="Theme switcher">
                <div classList={{ 'i-tabler-moon': themeStore.getColorMode() === 'dark', 'i-tabler-sun': themeStore.getColorMode() === 'light' }} />
                <div class="ml-2 i-tabler-chevron-down text-muted-foreground text-sm" />
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-42">
                <ThemeSwitcher />
              </DropdownMenuContent>
            </DropdownMenu>

            <Show when={hasPermission('bo:access')}>
              <Button as={A} href="/admin" variant="outline" class="hidden sm:flex gap-2">
                <div class="i-tabler-settings size-4" />
                {t('layout.menu.admin')}
              </Button>
            </Show>

            <UserSettingsDropdown class="hidden sm:flex" />

          </div>
        </div>
        <div class="flex-1 overflow-auto max-w-screen">
          <Suspense>
            {props.children}

          </Suspense>
        </div>
      </div>

      <AboutDialog open={aboutDialog.isOpen()} onOpenChange={aboutDialog.setIsOpen} />
    </div>
  );
};
