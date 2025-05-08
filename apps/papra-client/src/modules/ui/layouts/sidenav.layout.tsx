import type { TooltipTriggerProps } from '@kobalte/core/tooltip';
import type { Component, ComponentProps, JSX, ParentComponent } from 'solid-js';
import { signOut } from '@/modules/auth/auth.services';
import { useCommandPalette } from '@/modules/command-palette/command-palette.provider';

import { useConfig } from '@/modules/config/config.provider';
import { useDocumentUpload } from '@/modules/documents/components/document-import-status.component';

import { GlobalDropArea } from '@/modules/documents/components/global-drop-area.component';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { cn } from '@/modules/shared/style/cn';
import { useThemeStore } from '@/modules/theme/theme.store';
import { Button } from '@/modules/ui/components/button';
import { A, useNavigate, useParams } from '@solidjs/router';
import { Show, Suspense } from 'solid-js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../components/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../components/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/tooltip';

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
      <div class={cn(props.icon, 'size-5 text-muted-foreground opacity-50')}></div>
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
}> = (props) => {
  const { config } = useConfig();

  const getShortSideNavItems = () => [
    {
      label: 'All organizations',
      to: '/organizations',
      icon: 'i-tabler-building-community',
    },
    {
      label: 'GitHub repository',
      href: 'https://github.com/papra-hq/papra',
      icon: 'i-tabler-brand-github',
    },
    {
      label: 'Bluesky',
      href: 'https://bsky.app/profile/papra.app',
      icon: 'i-tabler-brand-bluesky',
    },
  ];

  const version = `v${config.papraVersion}`;

  return (
    <div class="flex h-full">
      <div class="w-65px border-r bg-card pt-4 pb-6 flex flex-col">
        <Button variant="link" size="icon" as={A} href="/" class="text-lg font-bold hover:no-underline flex items-center text-primary mb-4 mx-auto">
          <div class="i-tabler-file-text size-10 transform rotate-12deg hover:rotate-25deg transition"></div>
        </Button>

        <div class="flex flex-col gap-0.5 flex-1">
          {getShortSideNavItems().map(menuItem => (
            <Tooltip>
              <TooltipTrigger
                as={(tooltipProps: TooltipTriggerProps) => (
                  <Button
                    variant="link"
                    class="text-lg font-bold hover:no-underline flex items-center text-foreground dark:text-muted-foreground hover:text-primary"
                    {...tooltipProps}
                    aria-label={menuItem.label}
                    {...(menuItem.href
                      ? { as: 'a', href: menuItem.href, target: '_blank', rel: 'noopener noreferrer' }
                      : { as: A, href: menuItem.to })}
                  >
                    <div class={cn(menuItem.icon, 'size-5')} />
                  </Button>
                )}
              />

              <TooltipContent>{menuItem.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        <a class="text-xs text-muted-foreground text-center mt-auto transition-colors hover:(text-primary underline)" href={`https://github.com/papra-hq/papra/releases/tag/${version}`} target="_blank" rel="noopener noreferrer">
          {version}
        </a>

      </div>
      {(props.header || props.mainMenu || props.footerMenu || props.footer) && (
        <div class="h-full flex flex-col pb-6 flex-1">
          {props.header && <props.header />}

          {props.mainMenu && (
            <nav class="flex flex-col gap-0.5 mt-4 px-4">
              {props.mainMenu.map(menuItem => <MenuItemButton {...menuItem} />)}
            </nav>
          )}

          <div class="flex-1"></div>

          {props.footerMenu && (
            <nav class="flex flex-col gap-0.5 px-4">
              {props.footerMenu.map(menuItem => <MenuItemButton {...menuItem} />)}
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

  return (
    <>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'light' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-sun text-lg"></div>
        Light Mode
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'dark' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-moon text-lg"></div>
        Dark Mode
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => themeStore.setColorMode({ mode: 'system' })} class="flex items-center gap-2 cursor-pointer">
        <div class="i-tabler-device-laptop text-lg"></div>
        System Mode
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
    <>
      {locales.map(locale => (
        <DropdownMenuItem onClick={() => setLocale(locale.key)} class={cn('cursor-pointer', { 'font-bold': getLocale() === locale.key })}>
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
        </DropdownMenuItem>
      ))}
    </>
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

  const { promptImport, uploadDocuments } = useDocumentUpload({ organizationId: params.organizationId });

  return (
    <div class="flex flex-row h-screen min-h-0">
      <div class="w-350px border-r border-r-border  flex-shrink-0 hidden md:block bg-card">
        <props.sideNav />

      </div>
      <div class="flex-1 min-h-0 flex flex-col">
        <div class="flex justify-between px-6 pt-4">

          <div class="flex items-center">
            <Sheet>
              <SheetTrigger>
                <Button variant="ghost" size="icon" class="md:hidden mr-2">
                  <div class="i-tabler-menu-2 size-6"></div>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" class="bg-card p-0!">
                <props.sideNav />
              </SheetContent>
            </Sheet>

            {(props.showSearch ?? true) && (
              <Button variant="outline" class="lg:min-w-64  justify-start" onClick={openCommandPalette}>
                <div class="i-tabler-search size-4 mr-2"></div>
                Search...
              </Button>
            )}
          </div>

          <div class="flex items-center gap-2">
            <GlobalDropArea onFilesDrop={uploadDocuments} />
            <Button onClick={promptImport}>
              <div class="i-tabler-upload size-4"></div>
              <span class="hidden sm:inline ml-2">
                Import a document
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger as={Button} class="text-base hidden sm:flex" variant="outline" aria-label="Theme switcher">
                <div classList={{ 'i-tabler-moon': themeStore.getColorMode() === 'dark', 'i-tabler-sun': themeStore.getColorMode() === 'light' }}></div>
                <div class="ml-2 i-tabler-chevron-down text-muted-foreground text-sm"></div>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-42">
                <ThemeSwitcher />
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger as={Button} class="text-base hidden sm:flex" variant="outline" aria-label="User menu" size="icon">
                <div class="i-tabler-user size-4"></div>
              </DropdownMenuTrigger>
              <DropdownMenuContent class="w-42">
                <DropdownMenuItem class="flex items-center gap-2 cursor-pointer" as={A} href="/settings">
                  <div class="i-tabler-settings size-4 text-muted-foreground"></div>
                  Account settings
                </DropdownMenuItem>

                <DropdownMenuItem class="flex items-center gap-2 cursor-pointer" as={A} href="/api-keys">
                  <div class="i-tabler-key size-4 text-muted-foreground"></div>
                  API keys
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger class="flex items-center gap-2 cursor-pointer">
                    <div class="i-tabler-language size-4 text-muted-foreground"></div>
                    Language
                  </DropdownMenuSubTrigger>

                  <DropdownMenuSubContent>
                    <LanguageSwitcher />
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate('/login');
                  }}
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <div class="i-tabler-logout size-4 text-muted-foreground"></div>
                  Logout
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
    </div>
  );
};
