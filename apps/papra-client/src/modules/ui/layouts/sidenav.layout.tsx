import type { Component, ComponentProps, JSX, ParentComponent } from 'solid-js';
import { A, useNavigate, useParams } from '@solidjs/router';
import { For, Show, Suspense } from 'solid-js';

import { signOut } from '@/modules/auth/auth.services';
import { useCommandPalette } from '@/modules/command-palette/command-palette.provider';

import { useDocumentUpload } from '@/modules/documents/components/document-import-status.component';
import { GlobalDropArea } from '@/modules/documents/components/global-drop-area.component';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { usePendingInvitationsCount } from '@/modules/invitations/composables/usePendingInvitationsCount';
import { AboutDialog, useAboutDialog } from '@/modules/shared/components/about-dialog';
import { cn } from '@/modules/shared/style/cn';
import { UsageWarningCard } from '@/modules/subscriptions/components/usage-warning-card';
import { useThemeStore } from '@/modules/theme/theme.store';
import { Button } from '@/modules/ui/components/button';
import { useCurrentUser } from '@/modules/users/composables/useCurrentUser';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../components/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../components/sheet';

type MenuItem = {
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  badge?: JSX.Element;
};

const MenuItemButton: Component<MenuItem> = (props) => {
  return (
    <Button class="justify-start items-center gap-2 dark:text-muted-foreground truncate" variant="ghost" {...(props.onClick ? { onClick: props.onClick } : { as: A, href: props.href, activeClass: 'bg-accent/50! text-accent-foreground! truncate', end: true } as ComponentProps<typeof Button>)}>
      <div class={cn(props.icon, 'size-5 text-muted-foreground opacity-50')} />
      <div>{props.label}</div>
      {props.badge && <div class="ml-auto">{props.badge}</div>}
    </Button>
  );
};

export const SideNav: Component<{
  mainMenu?: MenuItem[];
  footerMenu?: MenuItem[];
  header?: Component;
  footer?: Component;
  preFooter?: Component;
}> = (props) => {
  return (
    <div class="flex h-full">
      {(props.header || props.mainMenu || props.footerMenu || props.footer || props.preFooter) && (
        <div class="h-full flex flex-col pb-6 flex-1 min-w-0">
          {props.header && <props.header />}

          {props.mainMenu && (
            <nav class="flex flex-col gap-0.5 mt-4 px-4">
              <For each={props.mainMenu}>{menuItem => <MenuItemButton {...menuItem} />}</For>
            </nav>
          )}

          <div class="flex-1" />

          {props.preFooter && <props.preFooter />}

          {props.footerMenu && (
            <nav class="flex flex-col gap-0.5 px-4">
              <For each={props.footerMenu}>{menuItem => <MenuItemButton {...menuItem} />}</For>
            </nav>
          )}

          {props.footer && <props.footer />}
        </div>
      )}
    </div>
  );
};

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
  const navigate = useNavigate();
  const { getPendingInvitationsCount } = usePendingInvitationsCount();
  const { t } = useI18n();
  const { hasPermission } = useCurrentUser();
  const aboutDialog = useAboutDialog();

  const { promptImport, uploadDocuments } = useDocumentUpload();

  return (
    <div class="flex flex-row h-screen min-h-0">
      <div class="w-280px border-r border-r-border  flex-shrink-0 hidden md:block bg-card">
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
              <SheetContent side="left" class="bg-card p-0!">
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

            <DropdownMenu>
              <DropdownMenuTrigger as={Button} class="relative text-base hidden sm:flex" variant="outline" aria-label="User menu" size="icon">
                <div class="i-tabler-user size-4" />
                <Show when={getPendingInvitationsCount() > 0}>
                  <div class="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-xl text-xs px-1.5 py-0.8 font-bold leading-none">
                    {getPendingInvitationsCount() }
                  </div>
                </Show>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="min-w-48">
                <DropdownMenuItem class="flex items-center gap-2 cursor-pointer" as={A} href="/settings">
                  <div class="i-tabler-settings size-4 text-muted-foreground" />
                  {t('user-menu.account-settings')}
                </DropdownMenuItem>

                <DropdownMenuItem class="flex items-center gap-2 cursor-pointer" as={A} href="/api-keys">
                  <div class="i-tabler-key size-4 text-muted-foreground" />
                  {t('user-menu.api-keys')}
                </DropdownMenuItem>

                <DropdownMenuItem class="flex items-center gap-2 cursor-pointer" as={A} href="/invitations">
                  <div class="i-tabler-mail-plus size-4 text-muted-foreground" />
                  {t('user-menu.invitations')}
                  <Show when={getPendingInvitationsCount() > 0}>
                    <div class="ml-auto bg-primary text-primary-foreground rounded-xl text-xs px-1.5 py-0.8 font-bold leading-none">
                      {getPendingInvitationsCount() }
                    </div>
                  </Show>
                </DropdownMenuItem>

                <DropdownMenuSub>

                  <DropdownMenuSubTrigger class="flex items-center gap-2 cursor-pointer">
                    <div class="i-tabler-language size-4 text-muted-foreground" />
                    {t('user-menu.language')}
                  </DropdownMenuSubTrigger>

                  <DropdownMenuSubContent class="min-w-48">
                    <LanguageSwitcher />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem
                  onClick={() => aboutDialog.open()}
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <div class="i-tabler-info-circle size-4 text-muted-foreground" />
                  {t('user-menu.about')}
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate('/login');
                  }}
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <div class="i-tabler-logout size-4 text-muted-foreground" />
                  {t('user-menu.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
